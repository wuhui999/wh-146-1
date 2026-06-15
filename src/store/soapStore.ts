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
  deleteNotes: (id: string) => void;
  setCalcConfig: (config: CalcConfig) => void;
  setReminderEnabled: (enabled: boolean) => void;
  getRecipe: (id: string) => Recipe | undefined;
  getBatch: (id: string) => Batch | undefined;
  getNotesByRecipe: (recipeId: string) => BatchNotes | undefined;
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

const loadInitialState = (): SoapState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        recipes: parsed.recipes || [],
        batches: parsed.batches || [],
        notes: parsed.notes || [],
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
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
      activeRecipeId: state.activeRecipeId === id ? null : state.activeRecipeId,
    }));
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
    set((state) => ({
      batches: state.batches.filter((b) => b.id !== id),
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

  deleteNotes: (id) => {
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
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
