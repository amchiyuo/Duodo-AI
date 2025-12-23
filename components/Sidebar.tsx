
import React, { useState } from 'react';
import { ChatSession } from '../types';
import { 
  TrashIcon, 
  ChatPlusIcon, 
  XIcon, 
  EditIcon, 
  SearchIcon, 
  ZenavaSmallLogo, 
  SunIcon, 
  MoonIcon,
  PanelLeftIcon
} from './Icons';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onNewChat: () => void;
  isOpen: boolean; // Mobile
  isCollapsed: boolean; // Desktop
  setIsCollapsed: (v: boolean) => void;
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
  isCollapsed,
  setIsCollapsed,
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
      if (e.key === 'Enter') saveEditing(e);
      if (e.key === 'Escape') setEditingId(null);
  };

  const filteredSessions = sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden" onClick={onCloseMobile} />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-[70] bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out flex flex-col overflow-hidden
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-0 md:opacity-0 md:border-r-0' : 'md:w-72'}
      `}>
        
        <div className="flex-none p-4 pb-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ZenavaSmallLogo className="w-6 h-6" />
                    <span className="text-sm font-bold tracking-widest text-zinc-800 dark:text-zinc-100 uppercase">ZENAVA AI</span>
                </div>
                <button onClick={onCloseMobile} className="md:hidden p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            <button onClick={onNewChat} className="flex items-center gap-2.5 w-full bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl transition-all text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm">
                <ChatPlusIcon className="w-4 h-4 text-indigo-500" />
                <span>新对话</span>
            </button>
        </div>

        <div className="px-4 py-2">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                <input 
                    type="text"
                    placeholder="搜索对话..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-200/50 dark:bg-zinc-900 border-none rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500/30 placeholder:text-zinc-400"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
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
                group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs
                ${session.id === currentSessionId 
                  ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                }
              `}
            >
              <div className="flex-1 truncate">
                {editingId === session.id ? (
                    <input 
                        type="text" value={editValue} autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown} onBlur={() => saveEditing()}
                        className="w-full bg-transparent outline-none border-b border-indigo-500 py-0.5"
                    />
                ) : (
                    session.title || '未命名对话'
                )}
              </div>

              {editingId !== session.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => startEditing(e, session)} className="p-1 text-zinc-400 hover:text-indigo-500"><EditIcon className="w-3 h-3" /></button>
                    <button onClick={(e) => onDeleteSession(e, session.id)} className="p-1 text-zinc-400 hover:text-red-500"><TrashIcon className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
           <button onClick={onToggleTheme} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
             {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
           </button>
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-zinc-400 font-mono">ZENAVA V1.2</span>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
