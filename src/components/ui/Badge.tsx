import React from 'react';

interface BadgeProps {
  type: 'status' | 'priority';
  value: string;
  className?: string;
}

const statusMap: Record<string, string> = {
  todo:        'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-accent/30 text-slate-800 border-accent/50',
  done:        'bg-brand/15 text-brand border-brand/30',
};

const priorityMap: Record<string, string> = {
  low:    'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-cream text-amber-900 border-cream-hover',
  high:   'bg-rose-50 text-rose-700 border-rose-200',
};

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  const displayValue = value.replace('_', ' ');
  const colorClass = type === 'priority'
    ? (priorityMap[value.toLowerCase()] ?? priorityMap.medium)
    : (statusMap[value.toLowerCase()] ?? statusMap.todo);

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        'border capitalize',
        colorClass,
        className,
      ].join(' ')}
    >
      {displayValue}
    </span>
  );
};
