
import React, { useState, useEffect, useRef } from 'react';
import { SettingsIcon, PlusIcon, CheckIcon } from './Icons';
import { DifyModelConfig } from '../types';

interface ModelSelectorProps {
  models: DifyModelConfig[];
  currentModelId: string;
  onModelChange: (modelId: string) => void;
  onManageModels: () => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  models, 
  currentModelId, 
  onModelChange, 
  onManageModels,
  disabled 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentModel = models.find(m => m.id === currentModelId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectModel = (id: string) => {
    onModelChange(id);
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
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">当前智能体</span>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate max-w-[120px]">
             {currentModel ? currentModel.name : "未选择智能体"}
          </span>
        </div>
        <SettingsIcon className="w-4 h-4 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-indigo-500/10 z-50 overflow-hidden ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
           <div className="max-h-64 overflow-y-auto py-1">
             <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider opacity-80">可用智能体</div>
             {models.length === 0 ? (
                 <div className="px-3 py-2 text-xs text-slate-400">暂无本地智能体</div>
             ) : (
                 models.map((model) => (
                    <button
                        key={model.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSelectModel(model.id);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                        currentModelId === model.id 
                            ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-500/10' 
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                        }`}
                    >
                        {model.name}
                        {currentModelId === model.id && <CheckIcon className="w-3.5 h-3.5" />}
                    </button>
                 ))
             )}
           </div>
           
           <div className="border-t border-zinc-100 dark:border-zinc-800 p-1">
             <button
               onClick={() => {
                   setIsOpen(false);
                   onManageModels();
               }}
               className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
             >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>管理 / 添加智能体</span>
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
