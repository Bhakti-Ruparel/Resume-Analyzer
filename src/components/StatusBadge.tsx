import clsx from 'clsx'

type Variant = 'used' | 'excluded' | 'target' | 'warning' | 'good'

interface StatusBadgeProps {
  variant: Variant
  label: string
}

const variantMap: Record<Variant, string> = {
  used:     'bg-green-500/15 text-green-400 border border-green-500/25',
  excluded: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
  target:   'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  warning:  'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  good:     'bg-green-500/15 text-green-400 border border-green-500/25',
}

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variantMap[variant])}>
      {label}
    </span>
  )
}
