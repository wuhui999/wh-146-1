import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  ThermometerSun,
  Play,
  Pause,
  RefreshCw,
  Bell,
  BellOff,
  AlertCircle,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import { useSoapStore } from '@/store/soapStore';
import { calculateSaponification, formatDuration, formatCountdown, getSaponificationProgress } from '@/lib/saponification';
import type { Batch } from '@/types';

export default function CalculatePage() {
  const {
    recipes,
    activeRecipeId,
    getRecipe,
    batches,
    updateBatch,
    calcConfig,
    reminderEnabled,
    setReminderEnabled,
    setActiveBatch,
    activeBatchId,
    addBatch,
  } = useSoapStore();

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const recipe = useMemo(() => {
    if (activeRecipeId) return getRecipe(activeRecipeId);
    if (recipes.length > 0) return recipes[0];
    return null;
  }, [activeRecipeId, recipes, getRecipe]);

  const result = useMemo(() => {
    if (!recipe) return null;
    return calculateSaponification(recipe, calcConfig);
  }, [recipe, calcConfig]);

  const activeBatch: Batch | undefined = useMemo(() => {
    if (activeBatchId) return batches.find((b) => b.id === activeBatchId);
    if (batches.length > 0) return batches[batches.length - 1];
    return undefined;
  }, [activeBatchId, batches, tick]);

  const progress = useMemo(() => {
    if (!activeBatch || !activeBatch.startTimestamp || !result) return 0;
    return getSaponificationProgress(activeBatch.startTimestamp, result);
  }, [activeBatch, result, tick]);

  const demoldMinDate = useMemo(() => {
    if (!activeBatch?.startTimestamp || !result) return null;
    return activeBatch.startTimestamp + result.demoldWindow.minHours * 3600 * 1000;
  }, [activeBatch, result, tick]);

  const demoldMaxDate = useMemo(() => {
    if (!activeBatch?.startTimestamp || !result) return null;
    return activeBatch.startTimestamp + result.demoldWindow.maxHours * 3600 * 1000;
  }, [activeBatch, result, tick]);

  const startBatch = () => {
    if (!recipe || !result) return;
    const batch: Batch = {
      id: `batch-${Date.now()}`,
      recipe: JSON.parse(JSON.stringify(recipe)),
      startTimestamp: Date.now(),
      status: 'mixing',
    };
    addBatch(batch);
    setActiveBatch(batch.id);
  };

  const markDemolded = () => {
    if (!activeBatch) return;
    updateBatch({ ...activeBatch, status: 'curing' });
  };

  const markCompleted = () => {
    if (!activeBatch) return;
    updateBatch({ ...activeBatch, status: 'completed' });
  };

  const requestNotification = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    setReminderEnabled(!reminderEnabled);
  };

  const getProfileColor = (value: number, optimal: [number, number]) => {
    if (value >= optimal[0] && value <= optimal[1]) return 'bg-emerald-500';
    if (value < optimal[0] * 0.8 || value > optimal[1] * 1.2) return 'bg-rose-500';
    return 'bg-amber-500';
  };

  if (!recipe || !result) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-amber-100">
        <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">请先创建配方</h3>
        <p className="text-gray-500">前往配方页创建一个新的手工皂配方</p>
      </div>
    );
  }

  const profiles = [
    { name: '硬度', value: result.soapProfile.hardness, optimal: [29, 54] as [number, number], max: 100 },
    { name: '清洁力', value: result.soapProfile.cleansing, optimal: [12, 22] as [number, number], max: 100 },
    { name: '滋润度', value: result.soapProfile.conditioning, optimal: [44, 69] as [number, number], max: 100 },
    { name: '起泡度', value: result.soapProfile.bubbly, optimal: [14, 46] as [number, number], max: 100 },
    { name: '奶油感', value: result.soapProfile.creamy, optimal: [16, 48] as [number, number], max: 100 },
  ];

  return (
    <div className="space-y-6">
      {activeBatch && (
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Timer className="w-5 h-5" />
                当前批次进行中
              </h2>
              <p className="text-indigo-200 text-sm mt-1">
                {activeBatch.recipe.name || '未命名配方'} · 开始于{' '}
                {activeBatch.startTimestamp
                  ? new Date(activeBatch.startTimestamp).toLocaleString('zh-CN')
                  : '-'}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={activeBatchId || ''}
                onChange={(e) => setActiveBatch(e.target.value || null)}
                className="px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 text-sm focus:outline-none"
              >
                <option value="">选择批次...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id} className="text-gray-800">
                    {b.recipe.name || b.id.slice(-6)} ·{' '}
                    {b.startTimestamp
                      ? new Date(b.startTimestamp).toLocaleDateString('zh-CN')
                      : '未开始'}
                  </option>
                ))}
              </select>
              <button
                onClick={requestNotification}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
                title={reminderEnabled ? '关闭提醒' : '开启提醒'}
              >
                {reminderEnabled ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>皂化进度</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-1000 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-xs text-indigo-200 mb-1">搅拌终点</p>
              <p className="text-lg font-bold">
                ~{result.stirEndEstimateMinutes} 分钟
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-xs text-indigo-200 mb-1">预计凝胶</p>
              <p className="text-lg font-bold">
                ~{formatDuration(result.gelPointEstimateHours)}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-xs text-indigo-200 mb-1">最早脱模</p>
              <p className="text-lg font-bold">
                {demoldMinDate ? formatCountdown(demoldMinDate) : '-'}
              </p>
              {demoldMinDate && (
                <p className="text-xs text-indigo-200 mt-1">
                  {new Date(demoldMinDate).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-xs text-indigo-200 mb-1">建议最晚脱模</p>
              <p className="text-lg font-bold">
                {demoldMaxDate ? formatCountdown(demoldMaxDate) : '-'}
              </p>
              {demoldMaxDate && (
                <p className="text-xs text-indigo-200 mt-1">
                  {new Date(demoldMaxDate).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {activeBatch.status === 'mixing' && (
              <button
                onClick={() =>
                  updateBatch({ ...activeBatch, status: 'gelling' })
                }
                className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition shadow-lg flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                已入模，进入保温
              </button>
            )}
            {activeBatch.status === 'gelling' && (
              <button
                onClick={markDemolded}
                className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition shadow-lg flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                已脱模，开始熟成
              </button>
            )}
            {(activeBatch.status === 'curing' || activeBatch.status === 'gelling') && (
              <button
                onClick={markCompleted}
                className="px-5 py-2.5 bg-emerald-400 text-emerald-900 font-bold rounded-xl hover:bg-emerald-300 transition shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                标记完成
              </button>
            )}
            {activeBatch.status === 'completed' && (
              <span className="px-5 py-2.5 bg-emerald-400/30 text-emerald-100 font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                已完成
              </span>
            )}
          </div>
        </div>
      )}

      {!activeBatch && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">开始新批次</h2>
              <p className="text-gray-500 text-sm">
                记录制作时间，系统将自动计算脱模窗口
              </p>
            </div>
            <button
              onClick={startBatch}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition shadow-lg flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              开始计时
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <ThermometerSun className="w-5 h-5 text-amber-500" />
            皂化计算结果
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">总油量</span>
              <span className="font-bold text-gray-800">{result.totalOilWeight} g</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">
                {recipe.lyeType} 量 (不含超脂)
              </span>
              <span className="font-bold text-blue-600">{result.lyeWeight} g</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">
                {recipe.lyeType} 量 (含 {recipe.superFatPercent}% 超脂)
              </span>
              <span className="font-bold text-emerald-600">
                {result.lyeWeightWithSuperFat} g
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">水量 ({(recipe.waterRatio * 100).toFixed(0)}%)</span>
              <span className="font-bold text-cyan-600">{result.waterWeight} g</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">总批次重量</span>
              <span className="font-bold text-gray-800">
                {result.totalBatchWeight} g
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">碘值</span>
              <span
                className={`font-bold ${
                  result.soapProfile.iodine < 70
                    ? 'text-emerald-600'
                    : result.soapProfile.iodine > 100
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {result.soapProfile.iodine}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">INS值</span>
              <span
                className={`font-bold ${
                  result.soapProfile.ins >= 136 && result.soapProfile.ins <= 170
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {result.soapProfile.ins}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  (理想 136-170)
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-amber-500" />
            皂性质雷达
          </h2>
          <div className="space-y-3">
            {profiles.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{p.name}</span>
                  <span className="font-bold text-gray-800">
                    {p.value}
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      (理想 {p.optimal[0]}-{p.optimal[1]})
                    </span>
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProfileColor(p.value, p.optimal)} transition-all rounded-full`}
                    style={{ width: `${Math.min(100, p.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                预计熟成期
              </span>
              <span className="font-bold text-purple-600">
                约 {result.cureEstimateDays} 天
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          安全提示
        </h3>
        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>碱液具有强腐蚀性，请佩戴护目镜、手套，在通风环境下操作</li>
          <li>始终将碱加入水中，切勿将水加入碱中</li>
          <li>脱模前请用pH试纸测试，确保pH值在安全范围（8-10）</li>
          <li>以上时间为估算值，实际皂化进度受环境湿度、模具材质等多种因素影响</li>
        </ul>
      </div>
    </div>
  );
}
