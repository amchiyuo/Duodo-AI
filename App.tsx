import React, { useState, useRef, useEffect } from 'react';
import { Role, Message, ChatSession } from './types';
import { DEFAULT_MODEL } from './constants';
import { streamMessageToGemini, generateChatTitle } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ModelSelector from './components/ModelSelector';
import SystemPromptModal from './components/SystemPromptModal';
import Sidebar from './components/Sidebar';
import { SendIcon, ChatPlusIcon, TuneIcon, MenuIcon, StopIcon } from './components/Icons';

// --- Constants ---
const STORAGE_KEY = 'gemini_chat_sessions_v1';
const DEFAULT_WELCOME_MESSAGE: Message = {
    id: 'welcome-default',
    role: Role.MODEL,
    text: "你好！我是 Duodo AI。我可以帮你写代码、分析数据，或者一起探索创意。",
    timestamp: Date.now(),
    excludeFromHistory: true // Mark as system message
};

const createNewSession = (model: string): ChatSession => ({
    id: Date.now().toString(),
    title: '新对话',
    messages: [ { ...DEFAULT_WELCOME_MESSAGE, id: `welcome-${Date.now()}` } ],
    createdAt: Date.now(),
    model: model
});

const App: React.FC = () => {
  // --- State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // System Instruction State
  const [systemInstruction, setSystemInstruction] = useState('');
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<boolean>(false); // Simple ref for cancellation loop

  // --- Derived State ---
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  const currentModel = currentSession?.model || DEFAULT_MODEL;

  // --- Initialization & Persistence ---
  useEffect(() => {
    // Session Load
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsedSessions = JSON.parse(saved);
            if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
                setSessions(parsedSessions);
                setCurrentSessionId(parsedSessions[0].id);
            } else {
                const newSession = createNewSession(DEFAULT_MODEL);
                setSessions([newSession]);
                setCurrentSessionId(newSession.id);
            }
        } catch (e) {
            console.error("Failed to parse sessions", e);
            const newSession = createNewSession(DEFAULT_MODEL);
            setSessions([newSession]);
            setCurrentSessionId(newSession.id);
        }
    } else {
        const newSession = createNewSession(DEFAULT_MODEL);
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
    }

    // Theme Load
    const shouldUseDark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (shouldUseDark) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }

  }, []);

  useEffect(() => {
      if (sessions.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      }
  }, [sessions]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, currentSessionId]);

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

  // --- Handlers ---

  const handleNewChat = () => {
      const newSession = createNewSession(DEFAULT_MODEL);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setSystemInstruction(''); // Reset system instruction for new chat
      setIsSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
      // Logic handled in Sidebar, but we update state here
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      
      if (newSessions.length === 0) {
          const fresh = createNewSession(DEFAULT_MODEL);
          setSessions([fresh]);
          setCurrentSessionId(fresh.id);
      } else if (sessionId === currentSessionId) {
          setCurrentSessionId(newSessions[0].id);
      }
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: newTitle } : s
      ));
  };

  const handleModelChange = (newModel: string) => {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, model: newModel } : s
      ));
  };

  const updateCurrentSessionMessages = (updateFn: (msgs: Message[]) => Message[]) => {
      setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
              return { ...s, messages: updateFn(s.messages) };
          }
          return s;
      }));
  };

  const handleStopGeneration = () => {
      abortControllerRef.current = true;
      setIsLoading(false);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputValue.trim();
    if (!textToSend || (isLoading && !overrideText)) return;

    if (!overrideText) {
        setInputValue('');
        if (inputRef.current) inputRef.current.style.height = 'auto';
    }

    // If we are overriding (regenerating), we assume the history has already been cleaned
    // If regular send, append user message
    if (!overrideText) {
        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: Role.USER,
            text: textToSend,
            timestamp: Date.now()
        };
        updateCurrentSessionMessages(prev => [...prev, newUserMessage]);
        
        // --- Intelligent Title Generation (Flash) ---
        // Trigger if this is the first *user* message in the session
        const isFirstUserMessage = messages.filter(m => m.role === Role.USER).length === 0;
        if (isFirstUserMessage) {
            generateChatTitle(textToSend).then(title => {
                setSessions(prev => prev.map(s => 
                    s.id === currentSessionId ? { ...s, title: title } : s
                ));
            });
        }
    }

    setIsLoading(true);
    abortControllerRef.current = false;

    const botMessageId = (Date.now() + 1).toString();
    const newBotMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      text: "",
      timestamp: Date.now(),
      startTime: Date.now(),
      isStreaming: true
    };
    
    updateCurrentSessionMessages(prev => [...prev, newBotMessage]);

    try {
      // Re-fetch fresh state to get history, but excluding the bot message we just added
      // We rely on 'sessions' state ref updating in the next render cycle, but inside async, 
      // we need to be careful. Ideally we pass history to the function.
      // For now, let's grab the latest from the session find, bearing in mind the update above might not be flushed yet in 'messages'.
      // Better way: calculate history here.
      
      const currentMsgs = sessions.find(s => s.id === currentSessionId)?.messages || [];
      const historyForStream = overrideText 
            ? currentMsgs // If regenerating, currentMsgs already has the user message (cleaned)
            : [...currentMsgs, { id: Date.now().toString(), role: Role.USER, text: textToSend, timestamp: Date.now() }]; // Approximate for now, relying on stream service to handle it cleanly? 
            // Actually, best to wait for state update or use local variable.
            // Let's rely on the fact that `updateCurrentSessionMessages` runs.
      
      // Filter out error messages and system messages, and crucially, the empty bot message we just added
      const validHistory = (overrideText ? currentMsgs : [...currentMsgs, { role: Role.USER, text: textToSend } as Message])
        .filter(m => !m.isError && !m.excludeFromHistory && m.id !== botMessageId);
      
      let accumulatedText = "";
      const stream = streamMessageToGemini(currentModel, validHistory, textToSend, systemInstruction);

      for await (const chunk of stream) {
        if (abortControllerRef.current) {
            break;
        }
        accumulatedText += chunk;
        updateCurrentSessionMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, text: accumulatedText } : msg
        ));
      }

      // Success (or stopped)
      updateCurrentSessionMessages(prev => prev.map(msg => 
        msg.id === botMessageId ? { ...msg, isStreaming: false, endTime: Date.now() } : msg
      ));

    } catch (error) {
      updateCurrentSessionMessages(prev => prev.filter(msg => msg.id !== botMessageId));
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: Role.MODEL,
        text: `Error: ${error instanceof Error ? error.message : '连接失败。'}`,
        timestamp: Date.now(),
        isError: true,
        endTime: Date.now()
      };
      updateCurrentSessionMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = false;
    }
  };

  const handleRegenerate = (message: Message) => {
      // Find the index of this bot message
      const msgIndex = messages.findIndex(m => m.id === message.id);
      if (msgIndex === -1) return;

      // Find the previous user message
      const prevUserMsg = messages[msgIndex - 1];
      if (!prevUserMsg || prevUserMsg.role !== Role.USER) return;

      // Clean history: Remove the bot message and anything after it
      updateCurrentSessionMessages(prev => prev.slice(0, msgIndex));
      
      // Trigger send with the previous user text
      handleSendMessage(prevUserMsg.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`; // Increased max height
  };

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-white dark:bg-[#09090b]">
      <SystemPromptModal 
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        instruction={systemInstruction}
        onSave={setSystemInstruction}
      />

      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Compact Header */}
        <header className="flex-none fixed md:absolute top-0 w-full z-40 backdrop-blur-md bg-white/80 dark:bg-[#09090b]/90 border-b border-slate-100 dark:border-zinc-800/50 transition-all duration-300">
            <div className="w-full px-4 h-14 flex items-center justify-between">
                
                {/* LEFT: Menu (Mobile) & Model Selector (Desktop) */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-2 -ml-2 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Model Selector Moved Here */}
                    <ModelSelector currentModel={currentModel} onModelChange={handleModelChange} disabled={isLoading} />
                </div>
                
                {/* RIGHT: Actions (System, New Chat) - Removed Logo/Divider */}
                <div className="flex items-center gap-1 md:gap-3">
                    
                    {/* System Prompt */}
                    <button 
                        onClick={() => setIsSystemModalOpen(true)} 
                        className={`p-2 rounded-lg transition-all duration-200 ${systemInstruction ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'}`} 
                        title="系统提示词配置"
                    >
                        <TuneIcon className="w-5 h-5" />
                    </button>
                    
                    {/* New Chat Button (Desktop) */}
                    <button 
                        onClick={handleNewChat} 
                        className="hidden md:flex p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="新对话"
                    >
                        <ChatPlusIcon className="w-5 h-5" />
                    </button>

                     {/* New Chat Button (Mobile) */}
                     <button 
                        onClick={handleNewChat} 
                        className="md:hidden p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                        <ChatPlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto pt-20 pb-4 px-4 scroll-smooth w-full">
            <div className="max-w-4xl mx-auto min-h-[calc(100vh-160px)] flex flex-col justify-end">
                {systemInstruction && messages.length <= 1 && (
                    <div className="flex justify-center mb-8 animate-in fade-in zoom-in duration-500">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2 shadow-sm">
                            <TuneIcon className="w-3 h-3" />
                            <span>系统提示词已启用</span>
                        </div>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <ChatMessage 
                        key={msg.id} 
                        message={msg} 
                        isLast={idx === messages.length - 1}
                        onRegenerate={handleRegenerate}
                    />
                ))}
                <div ref={messagesEndRef} className="h-4" />
            </div>
        </main>

        <footer className="flex-none p-4 pb-6 z-20">
            <div className="max-w-4xl mx-auto">
                <div className="relative group bg-white dark:bg-[#18181b] rounded-[26px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 transition-all duration-300 ring-1 ring-slate-200/60 dark:ring-white/5 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:shadow-[0_8px_30px_rgb(99,102,241,0.15)]">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={handleInputResize}
                        onKeyDown={handleKeyDown}
                        placeholder="今天想聊点什么？"
                        rows={1}
                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-slate-800 dark:text-zinc-100 resize-none max-h-[200px] py-4 pl-6 pr-14 min-h-[56px] placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-[15px] leading-relaxed"
                        style={{ overflow: 'hidden' }}
                    />
                    <div className="absolute right-2 bottom-2">
                        {isLoading ? (
                             <button
                                onClick={handleStopGeneration}
                                className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-80 transition-all active:scale-95"
                                title="停止生成"
                             >
                                <StopIcon className="w-4 h-4" />
                             </button>
                        ) : (
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputValue.trim()}
                                className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${!inputValue.trim() ? 'bg-slate-100 dark:bg-[#27272a] text-slate-300 dark:text-zinc-600' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95'}`}
                            >
                                {/* Removed ml-0.5 to fix centering */}
                                <SendIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center mt-3 px-2">
                    <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 tracking-wide">Duodo AI 可能会生成不准确的信息，请核对重要内容。</p>
                    <div className="hidden md:flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[9px]">Enter</span> 发送</span>
                        <span className="flex items-center gap-1"><span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[9px]">Shift + Enter</span> 换行</span>
                    </div>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;