import { useState, useEffect, useRef } from 'react';

export default function TvChat({ socket }) {
  const [messages, setMessages] = useState([]);
  const chatRef = useRef(null);

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

  useEffect(() => {
    if (chatRef.current) {
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="flex-1 flex flex-col justify-end relative mt-8">
      <div 
        ref={chatRef}
        className="flex flex-col gap-6 p-4 overflow-y-auto max-h-[70vh] custom-scrollbar"
      >
        {messages.map(msg => (
          <div key={msg.uniqueId || msg.id} className="flex gap-6 items-center animate-in slide-in-from-left-5 fade-in duration-300">
            <div className="w-14 h-14 shrink-0 rounded-full bg-zinc-800 border-2 border-brand-500 overflow-hidden shadow-lg flex items-center justify-center text-xl">
              {msg.avatar?.startsWith('data:') ? <img src={msg.avatar} alt="" className="w-full h-full object-cover"/> : msg.avatar}
            </div>
            <div className="flex flex-col">
              <span className="block text-sm text-brand-400 font-bold mb-1 opacity-90 drop-shadow-md">{msg.username}</span>
              <p className="text-2xl font-black text-white drop-shadow-lg">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
