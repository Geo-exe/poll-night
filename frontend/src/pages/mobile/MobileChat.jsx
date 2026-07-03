import { useState } from 'react';
import { Send } from 'lucide-react';

export default function MobileChat({ session, participant, socket }) {
  const [text, setText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('chat_message', {
      sessionId: session.id,
      userId: participant.id,
      username: participant.username,
      avatar: participant.avatar,
      text: text.trim(),
    });
    setText('');
  };

  return (
    <div className="mt-8 animate-in slide-in-from-bottom fade-in duration-500 pb-32">
      <div className="bg-brand-500/10 border border-brand-500/30 rounded-3xl p-6">
        <h3 className="text-xl font-bold text-brand-400 mb-4 flex items-center gap-2">
          <span>💬</span> Chat with the Panel
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Send a stupid message while you wait! It will appear on the TV.
        </p>
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something..."
            maxLength={60}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 pr-14 text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:bg-zinc-800 rounded-xl text-white transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
