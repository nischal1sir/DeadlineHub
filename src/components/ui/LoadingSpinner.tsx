import React from 'react';

export const LoadingSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center w-full h-full min-h-[calc(100vh-3.5rem)]">
    <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
    {text && <p className="mt-3 text-sm text-slate-400">{text}</p>}
  </div>
);
