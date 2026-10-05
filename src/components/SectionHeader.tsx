interface Props {
  step: number;
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ step, title, subtitle }: Props) {
  const pad = String(step).padStart(2, '0');
  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 mb-3">
        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
          {pad}
        </span>
        <div className="h-px w-8 bg-gradient-to-r from-blue-500/40 to-transparent" />
      </div>
      <h1 className="text-3xl font-bold text-gradient leading-tight">{title}</h1>
      {subtitle && <p className="text-slate-400 mt-2 text-base max-w-2xl">{subtitle}</p>}
    </div>
  );
}
