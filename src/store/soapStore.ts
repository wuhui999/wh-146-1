import { create } from 'zustand';
import type { Recipe, Batch, BatchNotes, CalcConfig } from '@/types';
import { DEFAULT_CALC_CONFIG } from '@/data/oils';

const STORAGE_KEY = 'soap-calculator-data';

interface SoapState {
  recipes: Recipe[];
  batches: Batch[];
  notes: BatchNotes[];
  calcConfig: CalcConfig;
  activeRecipeId: string | null;
  activeBatchId: string | null;
  reminderEnabled: boolean;
}

interface SoapActions {
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  setActiveRecipe: (id: string | null) => void;
  addBatch: (batch: Batch) => void;
  updateBatch: (batch: Batch) => void;
  deleteBatch: (id: string) => void;
  setActiveBatch: (id: string | null) => void;
  addNotes: (notes: BatchNotes) => void;
  updateNotes: (notes: BatchNotes) => void;
  upsertNotes: (notes: BatchNotes) => void;
  deleteNotes: (id: string) => void;
  deleteNotesByBatchId: (batchId: string) => void;
  setCalcConfig: (config: CalcConfig) => void;
  setReminderEnabled: (enabled: boolean) => void;
  getRecipe: (id: string) => Recipe | undefined;
  getBatch: (id: string) => Batch | undefined;
  getNotesByRecipe: (recipeId: string) => BatchNotes | undefined;
  getNotesByBatch: (batchId: string) => BatchNotes | undefined;
  findNotesForBatch: (batchId: string, recipeId: string) => BatchNotes | undefined;
  createNewRecipe: () => Recipe;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const createEmptyRecipe = (): Recipe => ({
  id: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  oils: [
    { oilId: 'olive', weight: 300 },
    { oilId: 'coconut', weight: 100 },
    { oilId: 'palm', weight: 100 },
  ],
  superFatPercent: 5,
  lyeType: 'NaOH',
  waterRatio: 0.38,
  additives: [],
  ambientTemp: 25,
  targetTemp: 35,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

function migrateLegacyNotes(
  rawNotes: Array<BatchNotes & { batchId?: string }>,
  batches: Batch[]
): BatchNotes[] {
  // 迁移策略：
  // 1. 已有合法 batchId 的笔记原样保留
  // 2. 仅含 recipeId 的旧格式笔记：查找同 recipeId 下最早的一个批次并绑定；
  //    若同 recipeId 下存在多个批次，其余批次不分配（避免张冠李戴）
  // 3. 找不到对应批次的孤立旧笔记：分配一个占位 batchId，保证数据不丢失，
  //    在 UI 层可选择忽略或显示为"无对应批次"

  const seenRecipeIds = new Set<string>();
  return rawNotes.map((n) => {
    if (n.batchId && typeof n.batchId === 'string' && n.batchId.length > 0) {
      return n as BatchNotes;
    }
    // 旧格式：只有 recipeId
    const matchingBatches = batches.filter((b) => b.recipe.id === n.recipeId);
    if (matchingBatches.length === 1 && !seenRecipeIds.has(n.recipeId)) {
      seenRecipeIds.add(n.recipeId);
      return {
        ...n,
        batchId: matchingBatches[0].id,
      } as BatchNotes;
    }
    // 降级：分配一个不存在的占位 batchId，避免成为幽灵数据。
    // 数据保留在 localStorage 中，但不会在历史页/笔记页展示
    return {
      ...n,
      batchId: `orphan-${n.id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    } as BatchNotes;
  });
}

const loadInitialState = (): SoapState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const recipes: Recipe[] = parsed.recipes || [];
      const batches: Batch[] = parsed.batches || [];
      const rawNotes: Array<BatchNotes & { batchId?: string }> = parsed.notes || [];
      const notes: BatchNotes[] = migrateLegacyNotes(rawNotes, batches);

      return {
        recipes,
        batches,
        notes,
        calcConfig: parsed.calcConfig || DEFAULT_CALC_CONFIG,
        activeRecipeId: parsed.activeRecipeId || null,
        activeBatchId: parsed.activeBatchId || null,
        reminderEnabled: parsed.reminderEnabled ?? true,
      };
    }
  } catch {
    // ignore
  }
  return {
    recipes: [],
    batches: [],
    notes: [],
    calcConfig: DEFAULT_CALC_CONFIG,
    activeRecipeId: null,
    activeBatchId: null,
    reminderEnabled: true,
  };
};

export const useSoapStore = create<SoapState & SoapActions>((set, get) => ({
  ...loadInitialState(),

  addRecipe: (recipe) => {
    set((state) => ({ recipes: [...state.recipes, recipe] }));
    get().saveToStorage();
  },

  updateRecipe: (recipe) => {
    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === recipe.id ? { ...recipe, updatedAt: Date.now() } : r
      ),
    }));
    get().saveToStorage();
  },

  deleteRecipe: (id) => {
    // 删除配方时，级联删除该配方所有批次，以及对应批次的笔记
    set((state) => {
      const batchesToDelete = state.batches.filter((b) => b.recipe.id === id);
      const batchIdsToDelete = new Set(batchesToDelete.map((b) => b.id));
      return {
        recipes: state.recipes.filter((r) => r.id !== id),
        batches: state.batches.filter((b) => b.recipe.id !== id),
        notes: state.notes.filter((n) => !batchIdsToDelete.has(n.batchId)),
        activeRecipeId: state.activeRecipeId === id ? null : state.activeRecipeId,
        activeBatchId:
          state.activeBatchId && batchIdsToDelete.has(state.activeBatchId)
            ? null
            : state.activeBatchId,
      };
    });
    get().saveToStorage();
  },

  setActiveRecipe: (id) => {
    set({ activeRecipeId: id });
    get().saveToStorage();
  },

  addBatch: (batch) => {
    set((state) => ({ batches: [...state.batches, batch] }));
    get().saveToStorage();
  },

  updateBatch: (batch) => {
    set((state) => ({
      batches: state.batches.map((b) => (b.id === batch.id ? batch : b)),
    }));
    get().saveToStorage();
  },

  deleteBatch: (id) => {
    // 删除批次时同步删除该批次的所有笔记
    set((state) => ({
      batches: state.batches.filter((b) => b.id !== id),
      notes: state.notes.filter((n) => n.batchId !== id),
      activeBatchId: state.activeBatchId === id ? null : state.activeBatchId,
    }));
    get().saveToStorage();
  },

  setActiveBatch: (id) => {
    set({ activeBatchId: id });
    get().saveToStorage();
  },

  addNotes: (notes) => {
    set((state) => ({ notes: [...state.notes, notes] }));
    get().saveToStorage();
  },

  updateNotes: (notes) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === notes.id ? notes : n)),
    }));
    get().saveToStorage();
  },

  upsertNotes: (notes) => {
    // 按 id 或 batchId 做幂等更新，避免重复追加
    set((state) => {
      const idx = state.notes.findIndex(
        (n) => n.id === notes.id || n.batchId === notes.batchId
      );
      if (idx >= 0) {
        const merged = [...state.notes];
        merged[idx] = { ...merged[idx], ...notes };
        return { notes: merged };
      }
      return { notes: [...state.notes, notes] };
    });
    get().saveToStorage();
  },

  deleteNotes: (id) => {
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
    get().saveToStorage();
  },

  deleteNotesByBatchId: (batchId) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.batchId !== batchId),
    }));
    get().saveToStorage();
  },

  setCalcConfig: (config) => {
    set({ calcConfig: config });
    get().saveToStorage();
  },

  setReminderEnabled: (enabled) => {
    set({ reminderEnabled: enabled });
    get().saveToStorage();
  },

  getRecipe: (id) => get().recipes.find((r) => r.id === id),

  getBatch: (id) => get().batches.find((b) => b.id === id),

  getNotesByRecipe: (recipeId) =>
    get().notes.find((n) => n.recipeId === recipeId),

  getNotesByBatch: (batchId) =>
    get().notes.find((n) => n.batchId === batchId),

  findNotesForBatch: (batchId, recipeId) => {
    // 兼容查找：先按 batchId 精确匹配，找不到再按 recipeId 回退（用于旧数据）
    const direct = get().notes.find((n) => n.batchId === batchId);
    if (direct) return direct;
    return get().notes.find((n) => n.recipeId === recipeId);
  },

  createNewRecipe: () => {
    const recipe = createEmptyRecipe();
    get().addRecipe(recipe);
    get().setActiveRecipe(recipe.id);
    return recipe;
  },

  loadFromStorage: () => {
    const loaded = loadInitialState();
    set(loaded);
  },

  saveToStorage: () => {
    const state = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          recipes: state.recipes,
          batches: state.batches,
          notes: state.notes,
          calcConfig: state.calcConfig,
          activeRecipeId: state.activeRecipeId,
          activeBatchId: state.activeBatchId,
          reminderEnabled: state.reminderEnabled,
        })
      );
    } catch {
      // ignore
    }
  },
}));
