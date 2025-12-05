import React, { useState } from 'react';
import { ChatSession } from '../types';
import { MessageSquareIcon, TrashIcon, ChatPlusIcon, XIcon, EditIcon, CheckIcon, SearchIcon, DuodoLogo, SunIcon, MoonIcon } from './Icons';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onNewChat,
  isOpen,
  onCloseMobile,
  isDarkMode,
  onToggleTheme
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const saveEditing = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    if (editingId && editValue.trim()) {
        onRenameSession(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          saveEditing(e);
      }
  };

  // Filter sessions based on search
  const filteredSessions = sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-50 dark:bg-[#18181b] border-r border-slate-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out transform flex flex-col shadow-xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header Area */}
        <div className="flex flex-col gap-4 p-5 pb-2">
            
            {/* Logo Area */}
            <div className="flex items-center justify-between pl-1">
                <div className="flex items-center gap-2.5">
                    <DuodoLogo className="w-7 h-7" />
                    <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-zinc-100 font-display">Duodo AI</span>
                </div>
                <button 
                    onClick={onCloseMobile}
                    className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            {/* New Chat Button */}
            <button
                onClick={() => {
                    onNewChat();
                    onCloseMobile();
                }}
                className="group flex items-center gap-3 w-full bg-white dark:bg-[#27272a] hover:bg-white hover:shadow-md border border-slate-200 dark:border-zinc-700/50 hover:border-indigo-200 dark:hover:border-zinc-600 text-slate-700 dark:text-zinc-200 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                    <ChatPlusIcon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">开启新对话</span>
            </button>

            {/* Search Box */}
            <div className="relative group">
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text"
                    placeholder="搜索历史记录..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-[#09090b] focus:border-indigo-500/30 focus:shadow-sm rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
            </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
          {filteredSessions.length > 0 && (
             <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                 {searchQuery ? '搜索结果' : '历史记录'}
             </div>
          )}

          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                if (editingId !== session.id) {
                    onSelectSession(session.id);
                    onCloseMobile();
                }
              }}
              className={`
                group/item relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                ${session.id === currentSessionId 
                  ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-zinc-100 font-medium shadow-sm' 
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-[#27272a]/50'
                }
              `}
            >
              <MessageSquareIcon className={`w-4 h-4 flex-shrink-0 transition-colors ${session.id === currentSessionId ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-zinc-600 group-hover/item:text-slate-400'}`} />
              
              <div className="flex-1 overflow-hidden min-h-[20px] flex items-center relative">
                {editingId === session.id ? (
                    <div className="flex items-center gap-1 w-full animate-in fade-in duration-200">
                        <input 
                            type="text" 
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            onBlur={() => saveEditing()}
                            className="w-full text-xs bg-white dark:bg-black border border-indigo-500 rounded px-1 py-0.5 outline-none text-slate-900 dark:text-white"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col w-full pr-8">
                        <span className="text-xs truncate">{session.title || '新对话'}</span>
                    </div>
                )}
              </div>

              {/* Seamless Action Buttons */}
              {editingId !== session.id && (
                <div className={`
                    absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pr-1
                    opacity-0 group-hover/item:opacity-100 transition-opacity duration-200
                    ${session.id === currentSessionId 
                        ? 'bg-white dark:bg-[#27272a]' 
                        : 'bg-slate-50 dark:bg-[#18181b] group-hover/item:bg-slate-50 dark:group-hover/item:bg-[#18181b]' 
                    }
                `}>
                    <button
                        onClick={(e) => startEditing(e, session)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="重命名"
                    >
                        <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(e, session.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="删除对话"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
              )}
            </div>
          ))}
          
          {filteredSessions.length === 0 && (
             <div className="flex flex-col items-center justify-center mt-12 text-slate-400 gap-2">
                 <SearchIcon className="w-8 h-8 opacity-20" />
                 <span className="text-xs opacity-60">无相关对话</span>
             </div>
          )}
        </div>

        {/* Footer Info & Dark Mode Toggle */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800/50 flex items-center justify-between">
           <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-[#27272a]">
                  <span className="font-bold text-[10px]">D</span>
              </div>
              <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Duodo AI</span>
                  <span className="text-[10px] text-slate-400">Pro Workspace</span>
              </div>
           </div>
           
           <button 
             onClick={onToggleTheme}
             className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-[#27272a] transition-colors"
             title={isDarkMode ? "切换亮色模式" : "切换暗黑模式"}
           >
             {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
           </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;