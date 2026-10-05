import { ServerOff } from 'lucide-react';

interface Props {
  message?: string;
}

export default function NotAvailable({ message = 'Not available — run training/analysis.' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
      <ServerOff className="w-10 h-10 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
