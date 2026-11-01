import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { fetchSessionDetails, fetchActiveSession } from '../../api';
import TvJoining from './TvJoining';
import TvVoting from './TvVoting';
import TvClosed from './TvClosed';
import TvReview from './TvReview';
import TvReactions from './TvReactions';

export default function TvDisplay() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [lastActiveItemId, setLastActiveItemId] = useState(null);

  useEffect(() => {
    let activeSocket = null;
    let timeoutId;

    const loadSession = () => {
      const fetchSession = id ? fetchSessionDetails(id) : fetchActiveSession();
      
      fetchSession.then(data => {
        setSession(data);

        const newSocket = io(`${window.location.protocol}//${window.location.hostname}:3001`);
        activeSocket = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
          newSocket.emit('join_session', { sessionId: data.id, role: 'tv' });
        });

        newSocket.on('participant_status_update', (msg) => {
          setSession(s => s ? { ...s, participants: msg.participants } : s);
        });

        newSocket.on('session_deleted', () => {
          setSession(s => s ? { ...s, status: 'deleted' } : s);
        });

        newSocket.on('session_state_changed', (msg) => {
          setSession(s => s ? { ...s, ...msg } : s);
        });

        newSocket.on('session_config_updated', (data) => {
          setSession(data);
        });

        newSocket.on('active_item_changed', (msg) => {
          setLastActiveItemId(msg.itemId);
          setSession(s => s ? {
            ...s,
            items: s.items.map(it => {
              if (it.id === msg.itemId) {
                return { 
                  ...it, 
                  voting_status: msg.voting_status, 
                  active_category_id: msg.active_category_id,
                  category_averages: msg.category_averages || it.category_averages
                };
              }
              return msg.voting_status === 'open' ? { ...it, voting_status: 'closed' } : it;
            })
          } : s);
        });

        newSocket.on('item_revealed', (data) => {
          setSession(s => s ? {
            ...s,
            items: s.items.map(it => it.id === data.itemId ? { ...it, revealed: 1, voting_status: 'closed' } : it)
          } : s);
        });
      }).catch(err => {
        console.error('Session not found, retrying in 3s...');
        timeoutId = setTimeout(loadSession, 3000);
      });
    };

    loadSession();

    return () => {
      clearTimeout(timeoutId);
      if (activeSocket) activeSocket.close();
    };
  }, [id]);

  let content;

  if (!session) {
    content = (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-12 text-center text-white">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-brand-500 rounded-full animate-spin mb-8"></div>
        <h2 className="text-4xl font-bold mb-4">Looking for active event...</h2>
        <p className="text-2xl text-zinc-500">Waiting for the host to create a session</p>
      </div>
    );
  } else if (session.status === 'deleted') {
    content = (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_50%)]" />
        <h1 className="text-6xl font-bold text-red-500 animate-pulse relative z-10">Event Deleted</h1>
      </div>
    );
  } else if (session.status === 'setup' || session.status === 'joining') {
    content = <TvJoining session={session} participants={session.participants || []} />;
  } else if (session.status === 'closed' || session.status === 'archived') {
    content = session.closed_view === 'review'
      ? <TvReview session={session} />
      : <TvClosed session={session} />;
  } else {
    content = <TvVoting session={session} participants={session.participants || []} lastActiveItemId={lastActiveItemId} socket={socket} />;
  }

  return (
    <>
      <TvReactions socket={socket} />
      {content}
    </>
  );
}
