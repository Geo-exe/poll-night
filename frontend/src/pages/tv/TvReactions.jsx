import { useEffect, useRef, useState } from 'react';

export default function TvReactions({ socket }) {
  const [reactions, setReactions] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = (reaction) => {
      const id = reaction.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const item = {
        id,
        emoji: reaction.emoji,
        username: reaction.username,
        left: 8 + Math.random() * 78,
        duration: 2.9 + Math.random() * 1.4,
        scale: 0.85 + Math.random() * 0.5
      };

      setReactions(current => [...current.slice(-18), item]);
      const timer = setTimeout(() => {
        setReactions(current => current.filter(entry => entry.id !== id));
      }, item.duration * 1000 + 200);
      timers.current.push(timer);
    };

    socket.on('reaction', handleReaction);
    return () => {
      socket.off('reaction', handleReaction);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [socket]);

  if (reactions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {reactions.map(reaction => (
        <div
          key={reaction.id}
          className="absolute bottom-0 float-up"
          style={{
            left: `${reaction.left}%`,
            animationDuration: `${reaction.duration}s`,
            fontSize: `clamp(2.5rem, 4.5vw, 5.5rem)`
          }}
        >
          <div
            className="drop-shadow-[0_0_30px_rgba(170,59,255,0.5)]"
            style={{ transform: `scale(${reaction.scale})` }}
          >
            {reaction.emoji}
          </div>
        </div>
      ))}
    </div>
  );
}
