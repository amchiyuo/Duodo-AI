import React, { useState, useEffect } from 'react';
import { Message, Role } from '../types';
import { BotIcon, UserIcon, CopyIcon, CheckIcon, RefreshIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: (message: Message) => void;
}

// Timer Component
const CreativeTimer: React.FC<{ startTime: number; endTime?: number }> = ({ startTime, endTime }) => {
  const [duration, setDuration] = useState('0.0');

  useEffect(() => {
    if (endTime) {
        const diff = (endTime - startTime) / 1000;
        setDuration(diff.toFixed(1));
        return;
    }
    let animationFrameId: number;
    const updateTimer = () => {
      const now = Date.now();
      const diff = (now - startTime) / 1000;
      setDuration(diff.toFixed(1));
      animationFrameId = requestAnimationFrame(updateTimer);
    };
    updateTimer();
    return () => { if (animationFrameId) cancelAnimationFrame(animationFrameId); };
  }, [startTime, endTime]);

  if (endTime) {
      return (
        <div className="flex items-center gap-1 opacity-60">
            <span className="text-[10px] font-medium text-zinc-400 font-mono">
                {duration}s
            </span>
        </div>
      );
  }

  return (
    <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
        <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
        </span>
        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 font-mono tracking-wide">
            {duration}s
        </span>
    </div>
  );
};

// Markdown Renderer (Only for Model)
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose dark:prose-invert max-w-none text-[15px] leading-relaxed text-slate-700 dark:text-zinc-300">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          const lang = match?.[1] || 'text';
          const code = match?.[2] || part.slice(3, -3);

          return (
            <div key={index} className="relative group my-4 rounded-xl overflow-hidden bg-[#1e1e2e] dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 bg-[#27273a] dark:bg-[#27272a] border-b border-white/10 dark:border-zinc-800/50">
                <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">{lang}</span>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                  <pre className="p-4 m-0 text-zinc-100 font-mono text-[13px] leading-relaxed whitespace-pre w-full min-w-full">
                    {code}
                  </pre>
              </div>
            </div>
          );
        } else {
          return (
             <div key={index} className="whitespace-pre-wrap">
               {part.split('\n').map((line, lineIdx) => {
                 if (line.startsWith('### ')) return <h3 key={lineIdx} className="text-sm font-bold mt-6 mb-3 text-slate-900 dark:text-zinc-100">{line.replace('### ', '')}</h3>;
                 if (line.startsWith('## ')) return <h2 key={lineIdx} className="text-base font-bold mt-8 mb-4 text-slate-900 dark:text-zinc-100">{line.replace('## ', '')}</h2>;
                 if (line.startsWith('# ')) return <h1 key={lineIdx} className="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-zinc-100 pb-1">{line.replace('# ', '')}</h1>;
                 
                 if (line.trim().startsWith('- ')) {
                    return (
                        <div key={lineIdx} className="flex gap-2 ml-1 my-2">
                            <span className="text-slate-400 dark:text-zinc-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
                            <span>{processInline(line.replace('- ', ''))}</span>
                        </div>
                    );
                 }
                 
                 if (/^\d+\.\s/.test(line.trim())) {
                     const [num, ...rest] = line.trim().split('.');
                     return (
                        <div key={lineIdx} className="flex gap-2 ml-1 my-2">
                            <span className="text-slate-500 dark:text-zinc-500 font-mono text-xs pt-1">{num}.</span>
                            <span>{processInline(rest.join('.').trim())}</span>
                        </div>
                     );
                 }

                 if (line.trim() === '') return <br key={lineIdx} />;

                 return <div key={lineIdx} className="min-h-[1.5em] mb-1.5">{processInline(line)}</div>;
               })}
             </div>
          );
        }
      })}
    </div>
  );
};

const processInline = (text: string) => {
    return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((subPart, i) => {
        if (subPart.startsWith('`') && subPart.endsWith('`')) {
            return <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-[13px] text-pink-600 dark:text-pink-400 border border-slate-200 dark:border-zinc-700/50">{subPart.slice(1, -1)}</code>;
        }
        if (subPart.startsWith('**') && subPart.endsWith('**')) {
            return <strong key={i} className="font-bold text-slate-900 dark:text-white">{subPart.slice(2, -2)}</strong>;
        }
        return subPart;
    });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === Role.USER;
  const isError = message.isError;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      
      <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[85%] ${isUser ? 'flex-row-reverse items-end' : 'flex-row items-start'} gap-2 group`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm
          ${isUser 
            ? 'bg-indigo-600 text-white mb-0.5' 
            : isError 
              ? 'bg-red-500 text-white mt-1'
              : 'bg-transparent text-indigo-600 dark:text-indigo-400 mt-1'
          }
        `}>
          {isUser ? <UserIcon className="w-5 h-5" /> : <BotIcon className="w-6 h-6" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col gap-1.5 w-full ${isUser ? 'items-end' : 'items-start'}`}>
            
            <div className={`
              relative max-w-full
              ${isUser
                ? 'px-5 py-3.5 bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-sm'
                : isError
                  ? 'px-5 py-4 bg-red-50 border border-red-100 text-red-800 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-300 rounded-xl'
                  : 'px-0 py-0 bg-transparent text-slate-800 dark:text-zinc-200'
              }
            `}>
              {isUser ? (
                  // User Message: Pure text, no markdown processing to avoid color conflicts
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white">
                      {message.text}
                  </div>
              ) : (
                  // Model Message: Full Markdown support
                  <MarkdownRenderer content={message.text} />
              )}
            </div>

            {/* Footer Actions */}
            <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row' : 'flex-row'}`}>
                {!isUser && (
                   <>
                       {message.startTime && (
                         <div className="mr-2">
                             <CreativeTimer startTime={message.startTime} endTime={message.endTime} />
                         </div>
                       )}
                       
                       <button 
                           onClick={handleCopy}
                           className="flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 transition-all"
                           title={copied ? "已复制" : "复制内容"}
                       >
                           {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                       </button>

                       {isLast && onRegenerate && (
                           <button
                                onClick={() => onRegenerate(message)}
                                className="flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 transition-all"
                                title="重新生成"
                           >
                               <RefreshIcon className="w-4 h-4" />
                           </button>
                       )}
                   </>
                )}

                {isUser && (
                   <div className="flex w-full justify-start"> 
                       <button 
                           onClick={handleCopy}
                           className="flex items-center justify-center p-1.5 rounded-md text-indigo-200 hover:text-white transition-all"
                           title={copied ? "已复制" : "复制内容"}
                       >
                           {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                       </button>
                   </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;