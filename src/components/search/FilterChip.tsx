import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  color?: 'purple' | 'blue' | 'green' | 'orange';
}

export function FilterChip({ label, value, onRemove, color = 'purple' }: FilterChipProps) {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    blue: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    green: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    orange: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        border transition-all ${colorClasses[color]}
      `}
    >
      <span className="text-xs opacity-70">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:opacity-70 transition-opacity rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label={`Remove ${label} filter: ${value}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}
