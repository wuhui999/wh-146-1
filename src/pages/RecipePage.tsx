import { useState, useMemo } from 'react';
import { Plus, Trash2, Droplets, Thermometer, FlaskConical, Sparkles } from 'lucide-react';
import { useSoapStore } from '@/store/soapStore';
import { OIL_DATABASE, getOilById } from '@/data/oils';
import { calculateSaponification, formatDuration } from '@/lib/saponification';
import { useNavigate } from 'react-router-dom';
import type { Additive, RecipeOil } from '@/types';

export default function RecipePage() {
  const navigate = useNavigate();
  const {
    recipes,
    activeRecipeId,
    getRecipe,
    updateRecipe,
    createNewRecipe,
    setActiveRecipe,
    calcConfig,
    addBatch,
  } = useSoapStore();

  const [showConfig, setShowConfig] = useState(false);

  const recipe = useMemo(() => {
    if (activeRecipeId) {
      const r = getRecipe(activeRecipeId);
      if (r) return r;
    }
    if (recipes.length > 0) {
      setActiveRecipe(recipes[0].id);
      return recipes[0];
    }
    return createNewRecipe();
  }, [activeRecipeId, recipes, getRecipe, createNewRecipe, setActiveRecipe]);

  const result = useMemo(() => {
    if (!recipe) return null;
    return calculateSaponification(recipe, calcConfig);
  }, [recipe, calcConfig]);

  if (!recipe) return null;

  const totalWeight = recipe.oils.reduce((sum, o) => sum + o.weight, 0);

  const updateRecipeData = (updates: Partial<typeof recipe>) => {
    updateRecipe({ ...recipe, ...updates });
  };

  const updateOil = (index: number, updates: Partial<RecipeOil>) => {
    const newOils = [...recipe.oils];
    newOils[index] = { ...newOils[index], ...updates };
    updateRecipeData({ oils: newOils });
  };

  const addOil = () => {
    const available = OIL_DATABASE.filter(
      (o) => !recipe.oils.some((ro) => ro.oilId === o.id)
    );
    if (available.length > 0) {
      updateRecipeData({
        oils: [...recipe.oils, { oilId: available[0].id, weight: 50 }],
      });
    }
  };

  const removeOil = (index: number) => {
    if (recipe.oils.length <= 1) return;
    updateRecipeData({ oils: recipe.oils.filter((_, i) => i !== index) });
  };

  const addAdditive = () => {
    const newAdditive: Additive = {
      id: `add-${Date.now()}`,
      name: '',
      type: 'fragrance',
      amount: 0,
      unit: 'g',
      note: '',
    };
    updateRecipeData({ additives: [...recipe.additives, newAdditive] });
  };

  const updateAdditive = (index: number, updates: Partial<Additive>) => {
    const newAdditives = [...recipe.additives];
    newAdditives[index] = { ...newAdditives[index], ...updates };
    updateRecipeData({ additives: newAdditives });
  };

  const removeAdditive = (index: number) => {
    updateRecipeData({
      additives: recipe.additives.filter((_, i) => i !== index),
    });
  };

  const startBatch = () => {
    if (!result) return;
    const batch = {
      id: `batch-${Date.now()}`,
      recipe: JSON.parse(JSON.stringify(recipe)),
      startTimestamp: Date.now(),
      status: 'mixing' as const,
    };
    addBatch(batch);
    navigate('/calculate');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-500" />
            配方基础信息
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              配方名称
            </label>
            <input
              type="text"
              value={recipe.name}
              onChange={(e) => updateRecipeData({ name: e.target.value })}
              placeholder="例如：经典橄榄椰子皂"
              className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              碱液类型
            </label>
            <select
              value={recipe.lyeType}
              onChange={(e) =>
                updateRecipeData({ lyeType: e.target.value as 'NaOH' | 'KOH' })
              }
              className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="NaOH">NaOH (氢氧化钠 - 固体皂)</option>
              <option value="KOH">KOH (氢氧化钾 - 液体皂)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-amber-500" />
            油品配方
          </h2>
          <button
            onClick={addOil}
            className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            添加油品
          </button>
        </div>
        <div className="space-y-3">
          {recipe.oils.map((ro, index) => {
            const oil = getOilById(ro.oilId);
            const percent = totalWeight > 0 ? (ro.weight / totalWeight) * 100 : 0;
            return (
              <div
                key={index}
                className="flex flex-wrap gap-3 items-center p-3 bg-gradient-to-r from-amber-50 to-rose-50 rounded-xl"
              >
                <select
                  value={ro.oilId}
                  onChange={(e) => updateOil(index, { oilId: e.target.value })}
                  className="flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                >
                  {OIL_DATABASE.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.category})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ro.weight}
                    onChange={(e) =>
                      updateOil(index, {
                        weight: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-24 px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-right"
                    min="0"
                    step="1"
                  />
                  <span className="text-sm text-gray-500">g</span>
                </div>
                <div className="w-20 px-3 py-2 bg-white rounded-lg text-center text-sm text-gray-600">
                  {percent.toFixed(1)}%
                </div>
                {oil && (
                  <div className="text-xs text-gray-500 hidden md:block">
                    INS: {oil.ins} | 硬度: {oil.hardness}
                  </div>
                )}
                <button
                  onClick={() => removeOil(index)}
                  disabled={recipe.oils.length <= 1}
                  className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="px-4 py-2 bg-amber-100 rounded-lg">
            总油量: <span className="font-bold text-amber-700">{totalWeight}g</span>
          </div>
          {result && (
            <>
              <div className="px-4 py-2 bg-blue-100 rounded-lg">
                碱量:{' '}
                <span className="font-bold text-blue-700">
                  {result.lyeWeightWithSuperFat}g
                </span>
              </div>
              <div className="px-4 py-2 bg-cyan-100 rounded-lg">
                水量:{' '}
                <span className="font-bold text-cyan-700">{result.waterWeight}g</span>
              </div>
              <div className="px-4 py-2 bg-emerald-100 rounded-lg">
                INS值:{' '}
                <span className="font-bold text-emerald-700">
                  {result.soapProfile.ins}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Thermometer className="w-5 h-5 text-amber-500" />
            温度与参数
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                超脂比例: {recipe.superFatPercent}%
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={recipe.superFatPercent}
                onChange={(e) =>
                  updateRecipeData({ superFatPercent: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                推荐范围 3-8%，越高越滋润但皂化越慢
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                水油比: {(recipe.waterRatio * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.25"
                max="0.5"
                step="0.01"
                value={recipe.waterRatio}
                onChange={(e) =>
                  updateRecipeData({ waterRatio: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                环境温度: {recipe.ambientTemp}°C
              </label>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={recipe.ambientTemp}
                onChange={(e) =>
                  updateRecipeData({ ambientTemp: parseInt(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                目标保温温度: {recipe.targetTemp}°C
              </label>
              <input
                type="range"
                min="25"
                max="55"
                step="1"
                value={recipe.targetTemp}
                onChange={(e) =>
                  updateRecipeData({ targetTemp: parseInt(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              添加剂
            </h2>
            <button
              onClick={addAdditive}
              className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
          <div className="space-y-3 max-h-[340px] overflow-y-auto">
            {recipe.additives.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                暂无添加剂，点击添加按钮添加香精、色粉、磨砂颗粒等
              </p>
            )}
            {recipe.additives.map((additive, index) => (
              <div
                key={additive.id}
                className="p-3 bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl space-y-2"
              >
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={additive.name}
                    onChange={(e) =>
                      updateAdditive(index, { name: e.target.value })
                    }
                    placeholder="名称，如：薰衣草精油"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                  />
                  <select
                    value={additive.type}
                    onChange={(e) =>
                      updateAdditive(index, {
                        type: e.target.value as Additive['type'],
                      })
                    }
                    className="px-2 py-1.5 rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                  >
                    <option value="fragrance">香精</option>
                    <option value="colorant">色粉</option>
                    <option value="exfoliant">磨砂</option>
                    <option value="other">其他</option>
                  </select>
                  <button
                    onClick={() => removeAdditive(index)}
                    className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={additive.amount}
                    onChange={(e) =>
                      updateAdditive(index, {
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-3 py-1.5 rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm text-right"
                    min="0"
                    step="0.1"
                  />
                  <select
                    value={additive.unit}
                    onChange={(e) =>
                      updateAdditive(index, { unit: e.target.value })
                    }
                    className="px-2 py-1.5 rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="滴">滴</option>
                    <option value="%">%</option>
                  </select>
                  <input
                    type="text"
                    value={additive.note || ''}
                    onChange={(e) =>
                      updateAdditive(index, { note: e.target.value })
                    }
                    placeholder="备注"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold">快速预览</h3>
              <p className="text-sm text-emerald-100">
                搅拌终点: ~{result.stirEndEstimateMinutes}分钟 · 凝胶: ~
                {formatDuration(result.gelPointEstimateHours)} · 脱模:{' '}
                {formatDuration(result.demoldWindow.minHours)} ~{' '}
                {formatDuration(result.demoldWindow.maxHours)}
              </p>
            </div>
            <button
              onClick={startBatch}
              className="px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition shadow-lg"
            >
              开始制作 →
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-sm text-gray-500 hover:text-amber-600 underline"
        >
          {showConfig ? '隐藏' : '显示'}计算参数配置
        </button>
      </div>

      {showConfig && (
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4">计算公式参数（可调整）</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {Object.entries(calcConfig).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{key}</label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) =>
                    useSoapStore
                      .getState()
                      .setCalcConfig({
                        ...calcConfig,
                        [key]: parseFloat(e.target.value),
                      })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
