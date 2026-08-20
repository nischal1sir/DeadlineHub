import React from 'react';

interface ContentLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({ 
  text, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  return (
    <div className={`relative flex items-center justify-center min-h-[calc(100vh-3.5rem)] w-full ${className}`}>
      <div className="flex flex-col items-center justify-center">
        <svg className={`animate-spin text-brand ${sizeClasses[size]}`} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        {text && <p className="mt-3 text-sm text-slate-400">{text}</p>}
      </div>
    </div>
  );
};