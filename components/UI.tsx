import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ 
  className, variant = 'primary', ...props 
}) => {
  const base = "cursor-pointer px-5 py-2.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-gradient-to-r from-marien-500 to-marien-600 hover:from-marien-400 hover:to-marien-500 text-white shadow-lg shadow-marien-500/30",
    secondary: "bg-white hover:bg-base-50 text-marien-700 border border-marien-200 shadow-sm",
    danger: "bg-red-100 hover:bg-red-200 text-red-600 border border-red-200",
    ghost: "bg-transparent hover:bg-marien-100 text-marien-600"
  };

  return <button className={`${base} ${variants[variant]} ${className || ''}`} {...props} />;
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-bold text-marien-600 uppercase tracking-wider ml-1">{label}</label>}
    <input 
      className={`bg-white border border-base-200 text-base-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-marien-400 focus:border-transparent transition-all shadow-sm placeholder-gray-400 ${className || ''}`} 
      {...props} 
    />
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-bold text-marien-600 uppercase tracking-wider ml-1">{label}</label>}
    <textarea 
      className={`bg-white border border-base-200 text-base-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-marien-400 focus:border-transparent transition-all shadow-sm min-h-[100px] placeholder-gray-400 ${className || ''}`} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className, children, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-bold text-marien-600 uppercase tracking-wider ml-1">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full bg-white border border-base-200 text-base-800 rounded-xl p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-marien-400 focus:border-transparent transition-all appearance-none shadow-sm cursor-pointer ${className || ''}`} 
        {...props} 
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-marien-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
);

export const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className, ...props }) => (
  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-marien-50 transition-colors border border-transparent hover:border-marien-100 group">
    <input 
      type="checkbox" 
      className={`w-6 h-6 text-marien-500 rounded-md focus:ring-marien-500 border-gray-300 bg-white checked:bg-marien-500 transition-all ${className || ''}`} 
      {...props} 
    />
    <span className="text-base-800 font-medium select-none group-hover:text-marien-700">{label}</span>
  </label>
);