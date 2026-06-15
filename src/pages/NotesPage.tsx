import { useMemo } from 'react';
import {
  NotebookPen,
  Star,
  AlertTriangle,
  ThumbsUp,
  Palette,
  Flower2,
  ShieldCheck,
} from 'lucide-react';
import { useSoapStore } from '@/store/soapStore';
import type { BatchNotes } from '@/types';

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
          onClick={() => onChange(i + 1)}
          className="transition hover:scale-110"
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

export default function NotesPage() {
  const {
    recipes,
    activeRecipeId,
    getRecipe,
    getNotesByRecipe,
    addNotes,
    updateNotes,
  } = useSoapStore();

  const recipe = useMemo(() => {
    if (activeRecipeId) return getRecipe(activeRecipeId);
    if (recipes.length > 0) return recipes[0];
    return null;
  }, [activeRecipeId, recipes, getRecipe]);

  const existingNotes = useMemo(() => {
    if (!recipe) return null;
    return getNotesByRecipe(recipe.id);
  }, [recipe, getNotesByRecipe]);

  const defaultNotes: BatchNotes = existingNotes || {
    id: `notes-${Date.now()}`,
    recipeId: recipe?.id || '',
    fragranceEval: 3,
    hardnessEval: 3,
    colorNote: '',
    textureNote: '',
    issues: '',
    successes: '',
    overallRating: 3,
    createdAt: Date.now(),
  };

  const saveNotes = (updates: Partial<BatchNotes>) => {
    if (!recipe) return;
    const toSave = { ...defaultNotes, ...updates, recipeId: recipe.id };
    if (existingNotes) {
      updateNotes(toSave);
    } else {
      addNotes(toSave);
    }
  };

  if (!recipe) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-amber-100">
        <NotebookPen className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">请先创建配方</h3>
        <p className="text-gray-500">前往配方页创建一个新的手工皂配方</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
          <NotebookPen className="w-5 h-5 text-amber-500" />
          批次笔记 - {recipe.name || '未命名配方'}
        </h2>
        <p className="text-sm text-gray-500">
          记录此配方的成品表现、香气、硬度等信息，帮助优化下一批次
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Flower2 className="w-5 h-5 text-pink-500" />
            香气评分
          </h3>
          <div className="mb-4">
            <StarRating
              value={defaultNotes.fragranceEval}
              onChange={(v) => saveNotes({ fragranceEval: v })}
            />
          </div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 mt-6">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            硬度评分
          </h3>
          <div className="mb-4">
            <StarRating
              value={defaultNotes.hardnessEval}
              onChange={(v) => saveNotes({ hardnessEval: v })}
            />
          </div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 mt-6">
            <Star className="w-5 h-5 text-amber-500" />
            总体评分
          </h3>
          <StarRating
            value={defaultNotes.overallRating}
            onChange={(v) => saveNotes({ overallRating: v })}
          />
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
                value={defaultNotes.colorNote}
                onChange={(e) => saveNotes({ colorNote: e.target.value })}
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
                value={defaultNotes.textureNote}
                onChange={(e) => saveNotes({ textureNote: e.target.value })}
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
            value={defaultNotes.issues}
            onChange={(e) => saveNotes({ issues: e.target.value })}
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
            value={defaultNotes.successes}
            onChange={(e) => saveNotes({ successes: e.target.value })}
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
          <li>记录问题时尽量具体，方便后续排查原因</li>
          <li>建议拍照存档，与笔记对应</li>
        </ul>
      </div>
    </div>
  );
}
