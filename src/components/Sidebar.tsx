import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, AlertCircle, Database, ShieldCheck,
  BarChart2, Wrench, Cpu, Brain, Trophy, Search,
  GitBranch, Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { id: '01', label: 'Overview',       path: '/',            icon: LayoutDashboard },
  { id: '02', label: 'Dataset & EDA',  path: '/dataset',     icon: Database },
  { id: '03', label: 'Preprocessing',  path: '/preprocessing', icon: Wrench },
  { id: '04', label: 'Models',         path: '/models',      icon: Brain },
  { id: '05', label: 'Evaluation',     path: '/evaluation',  icon: Trophy },
  { id: '06', label: 'Error Analysis', path: '/errors',      icon: Search },
  { id: '07', label: 'Final Pipeline', path: '/pipeline',    icon: GitBranch },
  { id: '08', label: 'Predict',        path: '/predict',     icon: Zap },
];

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 bg-[#0d0d14] border-r border-[#1e1e2e] flex flex-col overflow-y-auto scrollbar-thin">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">ResumeForge</div>
            <div className="text-[10px] text-slate-500 leading-tight">SAMATRIX 2026</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <div className="relative">
          {/* vertical timeline line */}
          <div className="absolute left-[22px] top-3 bottom-3 w-px bg-gradient-to-b from-blue-500/20 via-purple-500/10 to-transparent" />

          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative',
                        isActive
                          ? 'bg-blue-500/15 text-white border border-blue-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={clsx(
                          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                          isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500 group-hover:text-slate-300',
                        )}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="flex-1 font-medium">{item.label}</span>
                        <span className={clsx(
                          'text-[10px] font-mono',
                          isActive ? 'text-blue-400' : 'text-slate-600',
                        )}>
                          {item.id}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer badge */}
      <div className="px-5 py-4 border-t border-[#1e1e2e]">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ML Pipeline Ready
        </div>
      </div>
    </aside>
  );
}
