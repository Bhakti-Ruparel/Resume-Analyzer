import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface Props {
  value: string | number;
  label: string;
  icon?: ReactNode;
  color?: 'blue' | 'purple' | 'green' | 'amber';
  sub?: string;
}

const colorMap = {
  blue:   'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
  green:  'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  amber:  'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
};

export default function MetricCard({ value, label, icon, color = 'blue', sub }: Props) {
  return (
    <div className={clsx(
      'rounded-2xl border bg-gradient-to-br p-6 flex flex-col gap-3 animate-fade-in',
      colorMap[color],
    )}>
      {icon && (
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center bg-white/5', `text-${color === 'blue' ? 'blue' : color === 'purple' ? 'purple' : color === 'green' ? 'emerald' : 'amber'}-400`)}>
          {icon}
        </div>
      )}
      <div>
        <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
        <div className="text-sm text-slate-400 mt-1">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
