import React, { useState, useEffect, useRef } from 'react';
import { SavedSystemPrompt } from '../types';
import { TrashIcon, PlusIcon, ChevronDownIcon, CheckIcon } from './Icons';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  instruction: string;
  onSave: (newInstruction: string) => void;
}

const STORAGE_KEY_PROMPTS = 'gemini_saved_prompts_v1';

const SystemPromptModal: React.FC<SystemPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  instruction, 
  onSave 
}) => {
  const [prompts, setPrompts] = useState<SavedSystemPrompt[]>([]);
  
  // Editor State
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROMPTS);
    if (saved) {
      try {
        setPrompts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved prompts");
      }
    }
  }, []);

  // Initialize state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setContent(instruction);
      
      // Try to find if this instruction matches a saved one
      const match = prompts.find(p => p.content === instruction);
      if (match) {
        setActivePromptId(match.id);
        setTitle(match.title);
      } else {
        // If no match and empty instruction, it's a fresh state (no preset selected)
        // If instruction is not empty but not saved, it's a draft
        setActivePromptId(null);
        setTitle(instruction ? '' : ''); 
      }
    }
    setIsDropdownOpen(false);
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Auto-save logic
  useEffect(() => {
    const saveToLibrary = () => {
        // We only save to library if there is a Title. 
        if (!title.trim()) return;

        let newPrompts = [...prompts];
        
        if (activePromptId) {
            // Update existing
            newPrompts = newPrompts.map(p => 
                p.id === activePromptId 
                ? { ...p, title: title.trim(), content: content, createdAt: Date.now() } 
                : p
            );
        } else {
            // Create new
            const newId = Date.now().toString();
            const newPrompt: SavedSystemPrompt = {
                id: newId,
                title: title.trim(),
                content: content,
                createdAt: Date.now()
            };
            newPrompts = [newPrompt, ...newPrompts];
            setActivePromptId(newId);
        }

        setPrompts(newPrompts);
        localStorage.setItem(STORAGE_KEY_PROMPTS, JSON.stringify(newPrompts));
    };

    // Real-time update to App state (always)
    if (content !== instruction) {
        onSave(content);
    }

    // Debounced save to library
    const timeoutId = setTimeout(saveToLibrary, 500);
    return () => clearTimeout(timeoutId);

  }, [title, content, activePromptId]);

  // Handlers
  const handleSelectPrompt = (prompt: SavedSystemPrompt) => {
    setActivePromptId(prompt.id);
    setTitle(prompt.title);
    setContent(prompt.content);
    setIsDropdownOpen(false);
  };

  const handleCreateNew = () => {
    setActivePromptId(null);
    setTitle('');
    setContent('');
    setIsDropdownOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newPrompts = prompts.filter(p => p.id !== id);
    setPrompts(newPrompts);
    localStorage.setItem(STORAGE_KEY_PROMPTS, JSON.stringify(newPrompts));
    
    if (activePromptId === id) {
      handleCreateNew();
    }
  };

  return (
    <>
        {/* Backdrop */}
        <div 
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        {/* Drawer */}
        <div 
            className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-[#18181b] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            
            {/* Header */}
            <div className="flex-none px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-[#fbfbfe] dark:bg-[#18181b]">
                <div>
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-white">系统提示词</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">预设 AI 的行为模式和角色设定</p>
                </div>
                {/* Close Button or similar action could go here, but clicking outside works */}
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 flex flex-col gap-6">
                    
                    {/* Control Bar: Dropdown + New Button */}
                    <div className="flex items-center gap-2 relative z-20">
                         <div className="relative flex-1" ref={dropdownRef}>
                             <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                                    activePromptId 
                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                                    : 'bg-white dark:bg-[#27272a] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-indigo-300 dark:hover:border-zinc-700'
                                }`}
                             >
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">
                                        {activePromptId ? "已选预设" : "当前状态"}
                                    </span>
                                    <span className="font-medium truncate text-sm">
                                        {activePromptId 
                                            ? prompts.find(p => p.id === activePromptId)?.title 
                                            : (title || content ? "未保存草稿 (Custom Draft)" : "无预设 (Empty)")}
                                    </span>
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ${activePromptId ? 'text-indigo-500' : 'text-zinc-400'}`} />
                             </button>
                             
                             {/* Dropdown Menu */}
                             {isDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#27272a] border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-xl max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                   <div className="p-1">
                                        {prompts.length > 0 ? (
                                            prompts.map(prompt => (
                                                <button
                                                    key={prompt.id}
                                                    onClick={() => handleSelectPrompt(prompt)}
                                                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                                                        activePromptId === prompt.id 
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    <span className="text-sm font-medium truncate">{prompt.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        {activePromptId === prompt.id && <CheckIcon className="w-4 h-4" />}
                                                        <div 
                                                            onClick={(e) => handleDelete(e, prompt.id)}
                                                            className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-zinc-400 text-xs">
                                                暂无保存的预设，输入标题后自动保存
                                            </div>
                                        )}
                                   </div>
                                </div>
                             )}
                         </div>

                         {/* Create New Button - Placed right next to dropdown */}
                         <button 
                             onClick={handleCreateNew}
                             className="flex-none p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#27272a] text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-zinc-700 transition-all shadow-sm active:scale-95"
                             title="新建空白指令"
                         >
                             <PlusIcon className="w-5 h-5" />
                         </button>
                    </div>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full"></div>

                    {/* Editor Area */}
                    <div className="flex flex-col gap-5 flex-1">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">标题 / 名称</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="为该指令起个名字..." 
                                className="w-full bg-transparent text-lg font-bold text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none border-b border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors py-1"
                            />
                        </div>

                        <div className="flex flex-col gap-2 flex-1 min-h-[300px]">
                            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                指令内容
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="输入详细的系统指令，例如：你是一个专业的翻译官..."
                                className="flex-1 w-full bg-zinc-50 dark:bg-[#27272a] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="flex-none p-4 text-center border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#18181b]">
                    <p className="text-[10px] text-zinc-400">点击遮罩即可关闭抽屉。</p>
                </div>
            </div>
        </div>
    </>
  );
};

export default SystemPromptModal;