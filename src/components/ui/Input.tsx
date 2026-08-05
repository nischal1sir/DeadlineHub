import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400',
          'bg-white border border-slate-200',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
          'transition duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-rose-300 focus:ring-rose-400/30' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
};
