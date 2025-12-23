
import React, { useState, useRef, useEffect } from 'react';
import { Role, Message, ChatSession, DifyModelConfig } from './types';
import { STORAGE_KEY_SESSIONS, STORAGE_KEY_MODELS, STORAGE_KEY_USER_ID } from './constants';
import { chatWithBot, generateChatTitle } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ModelSelector from './components/ModelSelector';
import ModelManagerModal from './components/ModelManagerModal';
import Sidebar from './components/Sidebar';
import SnowOverlay from './components/SnowOverlay';
import { SendIcon, ChatPlusIcon, StopIcon, PanelLeftIcon, ZenavaLogo } from './components/Icons';

const DEFAULT_WELCOME_MESSAGE: Message = {
    id: 'welcome-default',
    role: Role.MODEL,
    text: "您今天在想什么？", 
    timestamp: Date.now(),
    excludeFromHistory: true
};

const createNewSession = (modelId: string): ChatSession => ({
    id: Date.now().toString(),
    title: '新对话',
    messages: [ { ...DEFAULT_WELCOME_MESSAGE, id: `welcome-${Date.now()}` } ],
    createdAt: Date.now(),
    modelId: modelId,
    difyConversationId: '',
    innerConversationId: '' 
});

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isCollapsed, setIsCollapsed] = useState(false); 
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSnowing, setIsSnowing] = useState(false);
  
  const [models, setModels] = useState<DifyModelConfig[]>([]);
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  const currentModelId = currentSession?.modelId || '';

  const isHomeView = messages.length === 1 && messages[0].excludeFromHistory;

  useEffect(() => {
    let storedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
    if (!storedUserId) {
        storedUserId = `user_zenava_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(STORAGE_KEY_USER_ID, storedUserId);
    }
    setUserId(storedUserId);

    const savedModels = localStorage.getItem(STORAGE_KEY_MODELS);
    if (savedModels) {
        try { setModels(JSON.parse(savedModels)); } catch (e) {}
    }

    const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    let loadedSessions: ChatSession[] = [];
    if (savedSessions) {
        try { loadedSessions = JSON.parse(savedSessions); } catch (e) {}
    }

    if (loadedSessions.length > 0) {
        setSessions(loadedSessions);
        setCurrentSessionId(loadedSessions[0].id);
    } else {
        const initialSession = createNewSession('');
        setSessions([initialSession]);
        setCurrentSessionId(initialSession.id);
    }

    const shouldUseDark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (shouldUseDark) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    }

    if (localStorage.getItem('isSnowing') === 'true') {
      setIsSnowing(true);
    }
    
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '\\' || e.key === 'b')) {
        e.preventDefault();
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentModelId, models, sessions]);

  useEffect(() => {
    if (!isHomeView) {
        scrollToBottom();
    }
  }, [messages, isLoading, isHomeView]);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isLoading]);

  useEffect(() => {
      if (sessions.length > 0) {
          localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      }
  }, [sessions]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(models));
  }, [models]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleTheme = () => {
      if (isDarkMode) {
          document.documentElement.classList.remove('dark');
          localStorage.theme = 'light';
          setIsDarkMode(false);
      } else {
          document.documentElement.classList.add('dark');
          localStorage.theme = 'dark';
          setIsDarkMode(true);
      }
  };

  const toggleSnow = () => {
    const newState = !isSnowing;
    setIsSnowing(newState);
    localStorage.setItem('isSnowing', newState.toString());
  };

  const handleNewChat = () => {
      const defaultModelId = currentModelId || (models.length > 0 ? models[0].id : '');
      const newSession = createNewSession(defaultModelId);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setIsSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputValue.trim();
    if (!textToSend || (isLoading && !overrideText)) return;
    
    const activeModelConfig = models.find(m => m.id === currentModelId);
    if (!activeModelConfig) {
        setIsModelManagerOpen(true);
        return;
    }

    const targetSessionId = currentSessionId;
    const curInnerId = sessions.find(s => s.id === targetSessionId)?.innerConversationId || "";

    if (!overrideText) {
        setInputValue('');
        if (inputRef.current) inputRef.current.style.height = 'auto';
    }

    const isFirstRealMessage = isHomeView;

    const newUserMessage: Message = {
        id: Date.now().toString(),
        role: Role.USER,
        text: textToSend,
        timestamp: Date.now()
    };
    
    setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
            const filteredMessages = isFirstRealMessage ? [] : s.messages;
            return { ...s, messages: [...filteredMessages, newUserMessage] };
        }
        return s;
    }));
    
    if (isFirstRealMessage) {
        generateChatTitle(textToSend).then(title => {
            setSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, title: title } : s));
        });
    }

    setIsLoading(true);
    const botMessageId = (Date.now() + 1).toString();
    const newBotMessage: Message = {
      id: botMessageId, role: Role.MODEL, text: "", timestamp: Date.now(), startTime: Date.now(), isStreaming: true
    };
    
    setSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, newBotMessage] } : s));

    try {
      const result = await chatWithBot(activeModelConfig, textToSend, userId, curInnerId);
      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
            return { 
                ...s, 
                messages: s.messages.map(msg => msg.id === botMessageId ? { ...msg, text: result.text, isStreaming: false, endTime: Date.now() } : msg),
                innerConversationId: result.innerId
            };
        }
        return s;
      }));
    } catch (error: any) {
      setSessions(prev => prev.map(s => {
          if (s.id === targetSessionId) {
              return { ...s, messages: [...s.messages.filter(msg => msg.id !== botMessageId), { id: Date.now().toString(), role: Role.MODEL, text: `错误: ${error.message}`, timestamp: Date.now(), isError: true }] };
          }
          return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-white dark:bg-zinc-950 transition-all">
      {isSnowing && <SnowOverlay />}
      <ModelManagerModal 
        isOpen={isModelManagerOpen} onClose={() => setIsModelManagerOpen(false)} models={models} onUpdateModels={setModels} 
        currentModelId={currentModelId} onSelectModel={(id) => setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, modelId: id } : s))}
      />

      <Sidebar 
        sessions={sessions} currentSessionId={currentSessionId} onSelectSession={setCurrentSessionId}
        onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if (id === currentSessionId && sessions.length > 1) setCurrentSessionId(sessions[0].id); }}
        onRenameSession={(id, title) => setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))}
        onNewChat={handleNewChat} isOpen={isSidebarOpen} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}
        onCloseMobile={() => setIsSidebarOpen(false)} isDarkMode={isDarkMode} onToggleTheme={toggleTheme}
        isSnowing={isSnowing} onToggleSnow={toggleSnow}
      />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className={`flex-none h-14 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between px-4 z-30 transition-all ${isHomeView ? 'bg-transparent border-transparent' : 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md'}`}>
            <div className="flex items-center gap-2">
                <button onClick={() => isCollapsed ? setIsCollapsed(false) : setIsSidebarOpen(true)} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg">
                  <PanelLeftIcon className="w-5 h-5" />
                </button>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden md:block"></div>
                <ModelSelector models={models} currentModelId={currentModelId} onModelChange={(id) => setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, modelId: id } : s))} onManageModels={() => setIsModelManagerOpen(true)} disabled={isLoading} />
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleNewChat} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg" title="新建对话 (Alt+N)">
                  <ChatPlusIcon className="w-5 h-5" />
                </button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar bg-[#fdfdfe] dark:bg-zinc-950">
            {isHomeView ? (
                <div className="h-full flex flex-col items-center justify-center max-w-5xl mx-auto px-6 animate-in fade-in duration-700">
                    <div className="mb-8 flex flex-col items-center">
                        <div className="w-full flex justify-center mb-10 overflow-visible">
                            <ZenavaLogo className="w-72 md:w-80 h-auto" />
                        </div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-center">
                            {messages[0].text}
                        </h1>
                        <p className="mt-3 text-zinc-400 text-sm font-medium tracking-wide uppercase opacity-60">灵动智能，至简致远</p>
                    </div>
                    
                    {models.length === 0 && (
                         <button onClick={() => setIsModelManagerOpen(true)} className="mt-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-zinc-500/10 active:scale-95 transition-all">
                            配置智能体以开始
                         </button>
                    )}
                </div>
            ) : (
                <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
                    <div className="space-y-6">
                    {messages.map((msg, idx) => (
                        <ChatMessage 
                            key={msg.id} message={msg} isLast={idx === messages.length - 1}
                            onRegenerate={(m) => {
                            const idx = messages.findIndex(x => x.id === m.id);
                            const prevUser = messages[idx-1];
                            if (prevUser?.role === Role.USER) {
                                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.slice(0, idx) } : s));
                                handleSendMessage(prevUser.text);
                            }
                            }}
                        />
                    ))}
                    </div>
                    <div ref={messagesEndRef} className="h-32" />
                </div>
            )}
        </main>

        <footer className={`flex-none pb-6 px-4 md:px-8 bg-gradient-to-t transition-colors ${isHomeView ? 'from-transparent' : 'from-[#fdfdfe] dark:from-zinc-950 via-[#fdfdfe] dark:via-zinc-950 to-transparent'}`}>
            <div className={`max-w-5xl mx-auto transition-transform duration-500 ${isHomeView ? 'translate-y-[-20vh]' : 'translate-y-0'}`}>
                <div className="relative group bg-white dark:bg-zinc-900/90 backdrop-blur-sm rounded-[24px] shadow-sm border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-zinc-900/5 dark:focus-within:ring-white/5 focus-within:border-zinc-400 dark:focus-within:border-zinc-700 transition-all">
                    <textarea
                        ref={inputRef} value={inputValue} rows={1}
                        onChange={(e) => { setInputValue(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 400)}px`; }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder={models.length > 0 ? "在 Zenava 开始探索..." : "请先配置智能体"}
                        disabled={models.length === 0 || isLoading}
                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-zinc-800 dark:text-zinc-100 resize-none py-4 pl-6 pr-14 min-h-[56px] text-[16px] leading-relaxed"
                    />
                    <div className="absolute right-3 bottom-2.5">
                        {isLoading ? (
                             <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center animate-pulse"><StopIcon className="w-4 h-4" /></div>
                        ) : (
                            <button onClick={() => handleSendMessage()} disabled={!inputValue.trim() || models.length === 0} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${!inputValue.trim() ? 'bg-transparent text-zinc-300' : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95'}`}><SendIcon className="w-4 h-4" /></button>
                        )}
                    </div>
                </div>
                {!isHomeView && (
                    <div className="mt-2.5 px-1 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                        <div className="flex gap-4">
                            <span>Alt + N 新对话</span>
                            <span>Ctrl + B 侧边栏</span>
                        </div>
                        <span className="opacity-60">Zenava Intelligence Engine</span>
                    </div>
                )}
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
