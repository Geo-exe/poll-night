import { useState, useEffect } from 'react';
import { isImageSource, mediaUrl } from '../../utils/media';

export default function TvChat({ socket }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages(prev => {
        const newMsgs = [...prev, msg];
        if (newMsgs.length > 20) return newMsgs.slice(newMsgs.length - 20); // Keep last 20
        return newMsgs;
      });
    };

    socket.on('chat_message', handleMessage);
    return () => socket.off('chat_message', handleMessage);
  }, [socket]);

  if (messages.length === 0) return null;

  return (
    <div className="flex-1 flex flex-col justify-end relative mt-[clamp(0.75rem,2vh,2.5rem)] min-h-0 overflow-hidden">
      <div className="flex flex-col justify-end gap-[clamp(0.35rem,1vh,1rem)] p-[clamp(0.35rem,1vw,1rem)] overflow-hidden">
        {messages.map((msg, index) => {
          const isLatest = index === messages.length - 1;
          return (
            <div
              key={msg.uniqueId || msg.id}
              className={`flex gap-[clamp(0.6rem,1.1vw,1.4rem)] items-center rounded-[clamp(0.9rem,1.4vw,1.75rem)] px-[clamp(0.4rem,0.9vw,1rem)] py-[clamp(0.3rem,0.7vh,0.8rem)] shrink-0 animate-in slide-in-from-left-5 fade-in duration-300 ${
                isLatest ? 'bg-white/5 ring-1 ring-brand-500/30' : ''
              }`}
            >
              <div className="w-[clamp(2.25rem,3.2vw,4.25rem)] h-[clamp(2.25rem,3.2vw,4.25rem)] shrink-0 rounded-full bg-zinc-800 border-2 border-brand-500 overflow-hidden shadow-lg flex items-center justify-center text-[clamp(1rem,1.5vw,2rem)]">
                {isImageSource(msg.avatar) ? <img src={mediaUrl(msg.avatar)} alt="" className="w-full h-full object-cover" /> : msg.avatar}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="block text-[clamp(0.7rem,0.85vw,1.1rem)] text-brand-400 font-bold mb-0.5 opacity-90 drop-shadow-md">{msg.username}</span>
                <p className="text-[clamp(1.05rem,1.65vw,2.15rem)] font-black text-white drop-shadow-lg leading-tight break-words">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
