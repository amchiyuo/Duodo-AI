
import React, { useState, useEffect } from 'react';
import { Message, Role } from '../types';
import { BotIcon, UserIcon, CopyIcon, CheckIcon, RefreshIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: (message: Message) => void;
}

const CreativeTimer: React.FC<{ startTime: number; endTime?: number }> = ({ startTime, endTime }) => {
  const [duration, setDuration] = useState('0.0');
  useEffect(() => {
    if (endTime) { setDuration(((endTime - startTime) / 1000).toFixed(1)); return; }
    let id: number;
    const update = () => { setDuration(((Date.now() - startTime) / 1000).toFixed(1)); id = requestAnimationFrame(update); };
    update();
    return () => cancelAnimationFrame(id);
  }, [startTime, endTime]);

  return (
    <div className={`text-[10px] font-mono ${endTime ? 'text-zinc-400' : 'text-indigo-500 animate-pulse'}`}>
      {duration}s
    </div>
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const safeContent = typeof content === 'string' ? content : (content ? String(content) : '');
  const parts = safeContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose dark:prose-invert max-w-none text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          const lang = match?.[1] || 'text';
          const code = match?.[2] || part.slice(3, -3);
          return (
            <div key={index} className="relative group my-5 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-white/5">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">{lang}</span>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                  <pre className="p-4 m-0 text-zinc-100 font-mono text-[13px] leading-6 whitespace-pre">{code}</pre>
              </div>
            </div>
          );
        } else {
          return (
             <div key={index} className="whitespace-pre-wrap">
               {part.split('\n').map((line, lineIdx) => {
                 if (line.startsWith('### ')) return <h3 key={lineIdx} className="text-lg font-bold mt-6 mb-2 text-zinc-900 dark:text-zinc-100">{line.replace('### ', '')}</h3>;
                 if (line.trim().startsWith('- ')) return <div key={lineIdx} className="flex gap-2 ml-1 my-1"><span className="text-zinc-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0"></span><span>{processInline(line.replace('- ', ''))}</span></div>;
                 if (line.trim() === '') return <div key={lineIdx} className="h-2" />;
                 return <div key={lineIdx} className="min-h-[1.5em]">{processInline(line)}</div>;
               })}
             </div>
          );
        }
      })}
    </div>
  );
};

const processInline = (text: string) => {
    if (typeof text !== 'string') return text;
    return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((subPart, i) => {
        if (subPart.startsWith('`') && subPart.endsWith('`')) return <code key={i} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[13px] text-indigo-600 dark:text-indigo-400">{subPart.slice(1, -1)}</code>;
        if (subPart.startsWith('**') && subPart.endsWith('**')) return <strong key={i} className="font-bold text-zinc-900 dark:text-white">{subPart.slice(2, -2)}</strong>;
        return subPart;
    });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === Role.USER;
  const isError = message.isError;

  const handleCopy = () => {
    navigator.clipboard.writeText(String(message.text));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-500`}>
      <div className={`flex w-full ${isUser ? 'flex-row-reverse max-w-[85%]' : 'flex-row max-w-full'} gap-4 group`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-400 bg-transparent border border-zinc-200 dark:border-zinc-800'}`}>
          {isUser ? <UserIcon className="w-4 h-4" /> : <BotIcon className="w-5 h-5" />}
        </div>

        <div className={`flex flex-col gap-2 w-full ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`w-full ${isUser ? 'bg-zinc-100 dark:bg-zinc-800/50 px-5 py-3 rounded-2xl rounded-tr-sm text-zinc-800 dark:text-zinc-200 max-w-fit' : 'bg-transparent'}`}>
              {isUser ? <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{String(message.text)}</div> : <MarkdownRenderer content={message.text} />}
            </div>

            {!isUser && (
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                    {message.startTime && <CreativeTimer startTime={message.startTime} endTime={message.endTime} />}
                    <button onClick={handleCopy} className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">{copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}</button>
                    {isLast && onRegenerate && <button onClick={() => onRegenerate(message)} className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"><RefreshIcon className="w-3.5 h-3.5" /></button>}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
