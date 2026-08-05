import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantClasses: Record<string, string> = {
  primary:   'bg-brand hover:bg-brand-hover text-white border border-brand shadow-xs shadow-brand/20',
  secondary: 'bg-secondary-light hover:bg-secondary/25 text-slate-800 border border-secondary/40',
  outline:   'bg-transparent hover:bg-brand-light text-brand border border-brand/40',
  danger:    'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  icon,
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const sizeClass = size === 'sm'
    ? 'h-8 px-3 text-xs'
    : 'h-10 px-4 text-sm';

  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
        'transition-all duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClass,
        variantClasses[variant],
        className,
      ].join(' ')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
