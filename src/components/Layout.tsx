import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Calculator,
  NotebookPen,
  History,
  Download,
  Droplets,
} from 'lucide-react';
import { useSoapStore } from '@/store/soapStore';

const navItems = [
  { to: '/', label: '配方', icon: FlaskConical },
  { to: '/calculate', label: '计算', icon: Calculator },
  { to: '/notes', label: '笔记', icon: NotebookPen },
  { to: '/history', label: '历史', icon: History },
  { to: '/export', label: '导出', icon: Download },
];

export default function Layout() {
  const navigate = useNavigate();
  const { recipes, activeRecipeId, createNewRecipe, setActiveRecipe } = useSoapStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center shadow-md">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">手工皂计算器</h1>
              <p className="text-xs text-gray-500">Cold Process Soap Calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeRecipeId || ''}
              onChange={(e) => setActiveRecipe(e.target.value || null)}
              className="text-sm px-3 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 max-w-[200px]"
            >
              <option value="">选择配方...</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name || `未命名 ${r.id.slice(-4)}`}
                </option>
              ))}
            </select>
            <button
              onClick={createNewRecipe}
              className="px-3 py-2 text-sm bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg hover:from-amber-600 hover:to-rose-600 transition shadow-md"
            >
              + 新配方
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white/60 backdrop-blur-sm border-b border-amber-100 sticky top-[68px] z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-amber-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="text-center py-6 text-gray-400 text-xs">
        手工皂批次计算器 · 请谨慎操作碱液，注意安全防护
      </footer>
    </div>
  );
}
