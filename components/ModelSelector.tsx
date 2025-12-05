import React, { useState, useEffect, useRef } from 'react';
import { SettingsIcon } from './Icons';
import { SUGGESTED_MODELS } from '../constants';

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onModelChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectModel = (model: string) => {
    onModelChange(model);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 border ${isOpen ? 'bg-zinc-100 dark:bg-zinc-800 border-indigo-500/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 bg-transparent border-transparent'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">当前模型</span>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate max-w-[120px]">{currentModel}</span>
        </div>
        <SettingsIcon className="w-4 h-4 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-indigo-500/10 z-50 overflow-hidden ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
           <div className="max-h-64 overflow-y-auto py-1">
             <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider opacity-80">建议模型</div>
             {SUGGESTED_MODELS.map((model) => (
               <button
                 key={model}
                 onClick={(e) => {
                    e.stopPropagation();
                    handleSelectModel(model);
                 }}
                 // Compact padding for items
                 className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                   currentModel === model 
                     ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-500/10' 
                     : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                 }`}
               >
                 {model}
                 {currentModel === model && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
               </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;