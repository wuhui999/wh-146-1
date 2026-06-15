import { useMemo, useState } from 'react';
import {
  History,
  Trash2,
  BarChart3,
  Scale,
  FlaskConical,
  Star,
  ChevronRight,
  X,
  FilePlus,
} from 'lucide-react';
import { useSoapStore } from '@/store/soapStore';
import { calculateSaponification, formatDuration } from '@/lib/saponification';
import { getOilById } from '@/data/oils';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  mixing: { label: '搅拌中', color: 'bg-amber-100 text-amber-700' },
  gelling: { label: '保温中', color: 'bg-orange-100 text-orange-700' },
  curing: { label: '熟成中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
};

export default function HistoryPage() {
  const {
    batches,
    deleteBatch,
    notes,
    calcConfig,
    setActiveRecipe,
    setActiveBatch,
    createNewRecipe,
  } = useSoapStore();

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const batchesWithResult = useMemo(() => {
    return batches
      .map((batch) => {
        const result = calculateSaponification(batch.recipe, calcConfig);
        const batchNotes = notes.find((n) => n.batchId === batch.id);
        return { batch, result, batchNotes };
      })
      .sort(
        (a, b) =>
          (b.batch.startTimestamp || b.batch.recipe.createdAt) -
          (a.batch.startTimestamp || a.batch.recipe.createdAt)
      );
  }, [batches, notes, calcConfig]);

  const compareBatches = useMemo(() => {
    return batchesWithResult.filter((b) => compareIds.includes(b.batch.id));
  }, [batchesWithResult, compareIds]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const duplicateRecipe = (recipeId: string) => {
    const src = batches.find((b) => b.recipe.id === recipeId)?.recipe;
    if (!src) return;
    const newRecipe = createNewRecipe();
    setActiveRecipe(newRecipe.id);
    const updated = {
      ...newRecipe,
      name: `${src.name || '配方'} (副本)`,
      oils: JSON.parse(JSON.stringify(src.oils)),
      superFatPercent: src.superFatPercent,
      lyeType: src.lyeType,
      waterRatio: src.waterRatio,
      additives: JSON.parse(JSON.stringify(src.additives)),
      ambientTemp: src.ambientTemp,
      targetTemp: src.targetTemp,
    };
    useSoapStore.getState().updateRecipe(updated);
  };

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-amber-100">
        <History className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">还没有批次记录</h3>
        <p className="text-gray-500">在配方页点击"开始制作"创建您的第一个批次</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              批次历史
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              共 {batches.length} 个批次 · 可选择最多 3 个进行对比
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500 self-center">
              已选 {compareIds.length}/3
            </span>
            <button
              onClick={() => {
                setCompareIds([]);
              }}
              className="px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              disabled={compareIds.length === 0}
            >
              清空
            </button>
            <button
              onClick={() => setShowCompare(true)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition shadow-md disabled:opacity-50 flex items-center gap-1"
              disabled={compareIds.length < 2}
            >
              <BarChart3 className="w-4 h-4" />
              对比分析
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {batchesWithResult.map(({ batch, result, batchNotes }) => {
          const status = statusLabels[batch.status] || statusLabels.draft;
          const oilsSummary = batch.recipe.oils
            .map((ro) => {
              const oil = getOilById(ro.oilId);
              return oil ? oil.name : ro.oilId;
            })
            .slice(0, 3)
            .join('、');
          const isComparing = compareIds.includes(batch.id);

          return (
            <div
              key={batch.id}
              className={`bg-white rounded-2xl shadow-lg border-2 transition ${
                isComparing
                  ? 'border-indigo-400 shadow-indigo-100'
                  : 'border-amber-100'
              }`}
            >
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleCompare(batch.id)}
                      className={`w-6 h-6 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition ${
                        isComparing
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      {isComparing && <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 text-lg">
                          {batch.recipe.name || `批次 ${batch.id.slice(-6)}`}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {batch.startTimestamp
                          ? new Date(batch.startTimestamp).toLocaleString('zh-CN')
                          : new Date(batch.recipe.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => duplicateRecipe(batch.recipe.id)}
                      className="p-2 text-gray-500 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition"
                      title="复制配方"
                    >
                      <FilePlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveRecipe(batch.recipe.id);
                        setActiveBatch(batch.id);
                      }}
                      className="px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定删除此批次记录吗？')) {
                          deleteBatch(batch.id);
                          setCompareIds((prev) =>
                            prev.filter((x) => x !== batch.id)
                          );
                        }
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3">
                    <div className="text-xs text-amber-600 flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      总油量
                    </div>
                    <div className="font-bold text-gray-800 mt-1">
                      {result.totalOilWeight}g
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3">
                    <div className="text-xs text-blue-600">INS值</div>
                    <div className="font-bold text-gray-800 mt-1">
                      {result.soapProfile.ins}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3">
                    <div className="text-xs text-emerald-600">硬度</div>
                    <div className="font-bold text-gray-800 mt-1">
                      {result.soapProfile.hardness}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3">
                    <div className="text-xs text-purple-600 flex items-center gap-1">
                      <FlaskConical className="w-3 h-3" />
                      超脂
                    </div>
                    <div className="font-bold text-gray-800 mt-1">
                      {batch.recipe.superFatPercent}%
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-3">
                    <div className="text-xs text-rose-600">脱模窗口</div>
                    <div className="font-bold text-gray-800 mt-1 text-sm">
                      {formatDuration(result.demoldWindow.minHours)}~
                      {formatDuration(result.demoldWindow.maxHours)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-3">
                    <div className="text-xs text-indigo-600 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      综合评分
                    </div>
                    <div className="font-bold text-gray-800 mt-1">
                      {batchNotes ? `${batchNotes.overallRating}/5` : '-'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                  <span>油品: {oilsSummary}{batch.recipe.oils.length > 3 ? ` 等${batch.recipe.oils.length}种` : ''}</span>
                  <span>温度: {batch.recipe.ambientTemp}°C / 目标{batch.recipe.targetTemp}°C</span>
                  <span>添加剂: {batch.recipe.additives.length}项</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCompare && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                批次对比分析
              </h3>
              <button
                onClick={() => setShowCompare(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 sticky left-0 bg-white">
                        指标
                      </th>
                      {compareBatches.map(({ batch }) => (
                        <th
                          key={batch.id}
                          className="text-left py-3 px-4 font-medium text-gray-800 min-w-[160px]"
                        >
                          {batch.recipe.name || `批次 ${batch.id.slice(-4)}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-white">状态</td>
                      {compareBatches.map(({ batch }) => (
                        <td key={batch.id} className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              statusLabels[batch.status]?.color
                            }`}
                          >
                            {statusLabels[batch.status]?.label}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-gray-50/50">总油量</td>
                      {compareBatches.map(({ batch, result }) => (
                        <td key={batch.id} className="py-3 px-4 font-medium">
                          {result.totalOilWeight}g
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-white">碱量(含超脂)</td>
                      {compareBatches.map(({ batch, result }) => (
                        <td key={batch.id} className="py-3 px-4 font-medium">
                          {result.lyeWeightWithSuperFat}g
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-gray-50/50">超脂比例</td>
                      {compareBatches.map(({ batch }) => (
                        <td key={batch.id} className="py-3 px-4 font-medium">
                          {batch.recipe.superFatPercent}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-white">环境温度</td>
                      {compareBatches.map(({ batch }) => (
                        <td key={batch.id} className="py-3 px-4 font-medium">
                          {batch.recipe.ambientTemp}°C
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-gray-50/50">INS值</td>
                      {compareBatches.map(({ result }) => (
                        <td
                          key={Math.random()}
                          className={`py-3 px-4 font-bold ${
                            result.soapProfile.ins >= 136 && result.soapProfile.ins <= 170
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {result.soapProfile.ins}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-white">硬度</td>
                      {compareBatches.map(({ result }) => (
                        <td key={Math.random()} className="py-3 px-4 font-medium">
                          {result.soapProfile.hardness}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-gray-50/50">清洁力</td>
                      {compareBatches.map(({ result }) => (
                        <td key={Math.random()} className="py-3 px-4 font-medium">
                          {result.soapProfile.cleansing}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-white">滋润度</td>
                      {compareBatches.map(({ result }) => (
                        <td key={Math.random()} className="py-3 px-4 font-medium">
                          {result.soapProfile.conditioning}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-gray-50/50">脱模窗口</td>
                      {compareBatches.map(({ result }) => (
                        <td key={Math.random()} className="py-3 px-4 font-medium">
                          {formatDuration(result.demoldWindow.minHours)}~
                          {formatDuration(result.demoldWindow.maxHours)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-white">预计熟成</td>
                      {compareBatches.map(({ result }) => (
                        <td key={Math.random()} className="py-3 px-4 font-medium">
                          {result.cureEstimateDays}天
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-500 sticky left-0 bg-gray-50/50">综合评分</td>
                      {compareBatches.map(({ batchNotes }) => (
                        <td key={Math.random()} className="py-3 px-4 font-medium">
                          {batchNotes ? `${batchNotes.overallRating}/5` : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
