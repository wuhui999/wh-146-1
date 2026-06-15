import { useMemo, useState } from 'react';
import {
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  Copy,
  Trash2,
  FolderUp,
} from 'lucide-react';
import { useSoapStore } from '@/store/soapStore';
import type { Recipe } from '@/types';
import { calculateSaponification } from '@/lib/saponification';

export default function ExportPage() {
  const {
    recipes,
    batches,
    notes,
    calcConfig,
    addRecipe,
    setActiveRecipe,
    addBatch,
    addNotes,
  } = useSoapStore();

  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'all' | 'recipes' | 'batches' | 'config'>('all');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const exportData = useMemo(() => {
    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    if (exportFormat === 'all' || exportFormat === 'config') {
      data.calcConfig = calcConfig;
    }
    if (exportFormat === 'all' || exportFormat === 'recipes') {
      if (selectedRecipes.length > 0) {
        data.recipes = recipes.filter((r) => selectedRecipes.includes(r.id));
      } else {
        data.recipes = recipes;
      }
    }
    if (exportFormat === 'all' || exportFormat === 'batches') {
      const relevantRecipeIds =
        selectedRecipes.length > 0 ? selectedRecipes : recipes.map((r) => r.id);
      data.batches = batches.filter((b) =>
        relevantRecipeIds.includes(b.recipe.id)
      );
      data.notes = notes.filter((n) =>
        relevantRecipeIds.includes(n.recipeId)
      );
    }
    return data;
  }, [recipes, batches, notes, calcConfig, selectedRecipes, exportFormat]);

  const jsonString = useMemo(() => JSON.stringify(exportData, null, 2), [exportData]);

  const toggleRecipe = (id: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const downloadJSON = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soap-calculator-${exportFormat}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        let importedCount = 0;

        if (Array.isArray(data.recipes)) {
          for (const r of data.recipes as Recipe[]) {
            const existing = recipes.find((x) => x.id === r.id);
            if (existing) continue;
            const newRecipe: Recipe = {
              ...r,
              id: r.id && !recipes.find((x) => x.id === r.id)
                ? r.id
                : `recipe-imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: r.name ? `${r.name} (导入)` : `导入配方`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            addRecipe(newRecipe);
            setActiveRecipe(newRecipe.id);
            importedCount++;
          }
        }

        if (Array.isArray(data.batches)) {
          for (const b of data.batches) {
            addBatch(b);
          }
        }

        if (Array.isArray(data.notes)) {
          for (const n of data.notes) {
            addNotes(n);
          }
        }

        setImportStatus({
          type: 'success',
          message: `成功导入 ${importedCount} 个配方${Array.isArray(data.batches) ? `，${data.batches.length} 个批次` : ''}`,
        });
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: '导入失败：JSON格式不正确',
        });
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-amber-500" />
            导出数据
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                导出内容
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: '全部数据' },
                  { value: 'recipes', label: '仅配方' },
                  { value: 'batches', label: '批次&笔记' },
                  { value: 'config', label: '计算配置' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExportFormat(opt.value as typeof exportFormat)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border-2 ${
                      exportFormat === opt.value
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {(exportFormat === 'all' || exportFormat === 'recipes') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-600">
                    选择配方（不选则导出全部）
                  </label>
                  <button
                    onClick={() => setSelectedRecipes([])}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    清空选择
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {recipes.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      暂无配方
                    </p>
                  )}
                  {recipes.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipes.includes(r.id)}
                        onChange={() => toggleRecipe(r.id)}
                        className="accent-amber-500"
                      />
                      <span className="text-gray-700 truncate">
                        {r.name || `未命名 ${r.id.slice(-4)}`}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {r.oils.length}种油
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={downloadJSON}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-rose-600 transition shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                下载 JSON
              </button>
              <button
                onClick={copyJSON}
                className={`px-4 py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    复制
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-emerald-500" />
            导入数据
          </h2>

          {importStatus && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
              ) : (
                <Trash2 className="w-4 h-4 inline mr-1" />
              )}
              {importStatus.message}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-emerald-400 transition">
            <FolderUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">上传 JSON 文件导入配方数据</p>
            <p className="text-xs text-gray-400 mb-4">
              支持本应用导出的 JSON 格式文件
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="hidden"
              />
              <span className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition shadow-md cursor-pointer">
                选择文件
              </span>
            </label>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-700 text-sm mb-2">统计信息</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">配方</div>
                <div className="font-bold text-gray-700 text-lg">{recipes.length}</div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">批次</div>
                <div className="font-bold text-gray-700 text-lg">{batches.length}</div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">笔记</div>
                <div className="font-bold text-gray-700 text-lg">{notes.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-500" />
            JSON 预览
          </h3>
          <span className="text-xs text-gray-400">
            {(new Blob([jsonString]).size / 1024).toFixed(2)} KB
          </span>
        </div>
        <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-auto max-h-80 text-xs font-mono leading-relaxed">
          {jsonString}
        </pre>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-bold text-blue-800 mb-2">数据导出格式说明</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>
            <strong>配方数据：</strong>包含所有油品比例、超脂、添加剂、温度参数等
          </p>
          <p>
            <strong>批次数据：</strong>包含制作时间戳、状态、关联配方快照
          </p>
          <p>
            <strong>笔记数据：</strong>包含香气评分、硬度评分、问题记录等
          </p>
          <p>
            <strong>计算配置：</strong>皂化时间估算公式的可调参数
          </p>
          {recipes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="font-medium">示例配方计算结果（{recipes[0].name || '首个配方'}）：</p>
              <pre className="mt-2 bg-white/50 rounded-lg p-3 text-xs overflow-auto">
                {JSON.stringify(calculateSaponification(recipes[0], calcConfig), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
