import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Calculator,
  NotebookPen,
  History,
  Download,
  ArrowRight,
  Sparkles,
  Thermometer,
  Clock,
  Shield,
} from 'lucide-react';
import { useSoapStore } from '@/store/soapStore';

export default function Home() {
  const navigate = useNavigate();
  const { recipes, batches, notes, createNewRecipe } = useSoapStore();

  const cards = [
    {
      title: '配方设计',
      description: '油品配比、超脂设置、添加剂管理',
      icon: FlaskConical,
      color: 'from-amber-500 to-orange-500',
      path: '/',
      stats: `${recipes.length} 个配方`,
    },
    {
      title: '皂化计算',
      description: '碱量计算、进度追踪、脱模倒计时',
      icon: Calculator,
      color: 'from-emerald-500 to-teal-500',
      path: '/calculate',
      stats: `${batches.length} 个批次`,
    },
    {
      title: '批次笔记',
      description: '香气硬度评分、问题记录、成功经验',
      icon: NotebookPen,
      color: 'from-purple-500 to-pink-500',
      path: '/notes',
      stats: `${notes.length} 条笔记`,
    },
    {
      title: '历史对比',
      description: '多批次横向对比、数据可视化',
      icon: History,
      color: 'from-indigo-500 to-blue-500',
      path: '/history',
      stats: '最多3项对比',
    },
    {
      title: '导入导出',
      description: 'JSON格式备份、配方分享迁移',
      icon: Download,
      color: 'from-rose-500 to-red-500',
      path: '/export',
      stats: '完整数据',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 rounded-3xl shadow-2xl p-8 md:p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Cold Process Soap Calculator
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            手工皂批次计算器
          </h1>
          <p className="text-white/90 text-base md:text-lg leading-relaxed mb-6">
            专业级冷制皂配方设计与皂化进度追踪工具。精确计算碱量、智能估算脱模窗口、
            记录每一批次的成长轨迹，让制皂更科学、更有乐趣。
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                createNewRecipe();
                navigate('/');
              }}
              className="px-6 py-3 bg-white text-gray-800 font-bold rounded-xl hover:bg-white/90 transition shadow-lg flex items-center gap-2"
            >
              开始新配方
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/calculate')}
              className="px-6 py-3 bg-white/20 backdrop-blur text-white font-bold rounded-xl hover:bg-white/30 transition border border-white/30"
            >
              查看计算示例
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-amber-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Thermometer className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">温度智能校正</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              根据环境温度与保温目标动态调整皂化时间估算
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-amber-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">脱模窗口提醒</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              实时倒计时 + 浏览器通知，不错过最佳脱模时机
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-amber-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">数据本地存储</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              所有配方批次保存在浏览器，支持 JSON 导入导出备份
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">功能模块</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100 text-left hover:shadow-xl hover:-translate-y-1 transition group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                  {card.title}
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {card.stats}
                  </span>
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {card.description}
                </p>
                <div className="mt-4 text-sm font-medium text-amber-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  进入
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
        <h2 className="text-xl font-bold mb-4">快速入门</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold mb-3">
              1
            </div>
            <h4 className="font-bold mb-1">设计配方</h4>
            <p className="text-white/60">
              选择油品组合，设置超脂比例和温度参数
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold mb-3">
              2
            </div>
            <h4 className="font-bold mb-1">开始批次</h4>
            <p className="text-white/60">
              点击开始制作，系统自动计时并追踪皂化进度
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold mb-3">
              3
            </div>
            <h4 className="font-bold mb-1">脱模熟成</h4>
            <p className="text-white/60">
              根据倒计时提醒脱模，记录批次笔记评分
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold mb-3">
              4
            </div>
            <h4 className="font-bold mb-1">对比优化</h4>
            <p className="text-white/60">
              多批次横向对比，总结经验优化下一次配方
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
