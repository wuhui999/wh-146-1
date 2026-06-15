import { useMemo, useState, useEffect } from 'react';
import {
  NotebookPen,
  Star,
  AlertTriangle,
  ThumbsUp,
  Palette,
  Flower2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useSoapStore } from '@/store/soapStore';
import type { BatchNotes, Batch } from '@/types';

function StarRating({
  value,
  onChange,
  max = 5,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="transition hover:scale-110 focus:outline-none"
        >
          <Star
            className={`w-6 h-6 ${
              i < value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function createEmptyNotes(batch: Batch): BatchNotes {
  return {
    id: `notes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    batchId: batch.id,
    recipeId: batch.recipe.id,
    fragranceEval: 3,
    hardnessEval: 3,
    colorNote: '',
    textureNote: '',
    issues: '',
    successes: '',
    overallRating: 3,
    demoldDate: undefined,
    createdAt: Date.now(),
  };
}

export default function NotesPage() {
  const {
    batches,
    notes,
    activeBatchId,
    setActiveBatch,
    upsertNotes,
  } = useSoapStore();

  const sortedBatches = useMemo(() => {
    return [...batches].sort(
      (a, b) =>
        (b.startTimestamp || b.recipe.createdAt) -
        (a.startTimestamp || a.recipe.createdAt)
    );
  }, [batches]);

  const activeBatch = useMemo(() => {
    if (activeBatchId) {
      const found = batches.find((b) => b.id === activeBatchId);
      if (found) return found;
    }
    return sortedBatches[0];
  }, [activeBatchId, batches, sortedBatches]);

  const findNotesForBatch = useSoapStore((s) => s.findNotesForBatch);

  const existingNotes = useMemo(() => {
    if (!activeBatch) return undefined;
    return findNotesForBatch(activeBatch.id, activeBatch.recipe.id);
  }, [activeBatch, findNotesForBatch]);

  const [formState, setFormState] = useState<BatchNotes | null>(null);

  useEffect(() => {
    if (!activeBatch) {
      setFormState(null);
      return;
    }
    if (existingNotes) {
      setFormState({ ...existingNotes });
    } else {
      setFormState(createEmptyNotes(activeBatch));
    }
  }, [activeBatch?.id, existingNotes?.id]);

  const updateField = <K extends keyof BatchNotes>(
    key: K,
    value: BatchNotes[K]
  ) => {
    if (!formState) return;
    const newState = { ...formState, [key]: value };
    setFormState(newState);
    // 统一使用 upsert，按 id 或 batchId 幂等更新
    upsertNotes(newState);
  };

  if (!activeBatch || sortedBatches.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-amber-100">
        <NotebookPen className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">还没有批次</h3>
        <p className="text-gray-500">
          请先在配方页开始制作，创建批次后再填写笔记
        </p>
      </div>
    );
  }

  if (!formState) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
              <NotebookPen className="w-5 h-5 text-amber-500" />
              批次笔记
            </h2>
            <p className="text-sm text-gray-500">
              记录此批次的成品表现、香气、硬度等信息
            </p>
          </div>
          <div className="relative">
            <select
              value={activeBatch.id}
              onChange={(e) => setActiveBatch(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium text-gray-700 cursor-pointer"
            >
              {sortedBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.recipe.name || `批次 ${b.id.slice(-6)}`} ·{' '}
                  {b.startTimestamp
                    ? new Date(b.startTimestamp).toLocaleDateString('zh-CN')
                    : '未开始'}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl text-sm">
          <span className="font-medium text-amber-800">当前批次：</span>
          <span className="text-gray-700">
            {activeBatch.recipe.name || '未命名配方'}
          </span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-gray-600">
            {activeBatch.recipe.oils.length} 种油 · {activeBatch.recipe.superFatPercent}%超脂
          </span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-gray-600">
            开始时间：
            {activeBatch.startTimestamp
              ? new Date(activeBatch.startTimestamp).toLocaleString('zh-CN')
              : '未开始'}
          </span>
          {existingNotes && (
            <>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-emerald-600 font-medium">✓ 已有笔记</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Flower2 className="w-5 h-5 text-pink-500" />
                香气评分
              </h3>
              <StarRating
                value={formState.fragranceEval}
                onChange={(v) => updateField('fragranceEval', v)}
              />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                硬度评分
              </h3>
              <StarRating
                value={formState.hardnessEval}
                onChange={(v) => updateField('hardnessEval', v)}
              />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-amber-500" />
                总体评分
              </h3>
              <StarRating
                value={formState.overallRating}
                onChange={(v) => updateField('overallRating', v)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-purple-500" />
            外观与质感
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                颜色描述
              </label>
              <input
                type="text"
                value={formState.colorNote}
                onChange={(e) => updateField('colorNote', e.target.value)}
                placeholder="如：奶白色、淡粉色带斑点..."
                className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                质感描述
              </label>
              <input
                type="text"
                value={formState.textureNote}
                onChange={(e) => updateField('textureNote', e.target.value)}
                placeholder="如：细腻光滑、有磨砂颗粒感..."
                className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            遇到的问题
          </h3>
          <textarea
            value={formState.issues}
            onChange={(e) => updateField('issues', e.target.value)}
            placeholder="记录此批次遇到的问题，如：分离、松糕、白粉、颜色褪色..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <ThumbsUp className="w-5 h-5 text-emerald-500" />
            成功之处
          </h3>
          <textarea
            value={formState.successes}
            onChange={(e) => updateField('successes', e.target.value)}
            placeholder="记录此批次的亮点，如：起泡丰富、香气持久、硬度理想..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
        <h3 className="font-bold text-emerald-800 mb-2">小贴士</h3>
        <ul className="text-sm text-emerald-700 space-y-1 list-disc list-inside">
          <li>脱模后24小时内记录外观和香气最为准确</li>
          <li>熟成4周后再次评估硬度和洗感，与初期对比</li>
          <li>每个批次独立保存笔记，便于对比分析</li>
          <li>记录问题时尽量具体，方便后续排查原因</li>
        </ul>
      </div>
    </div>
  );
}
