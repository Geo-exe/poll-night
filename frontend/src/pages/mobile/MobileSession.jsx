import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { fetchSessionDetails, fetchActiveSession } from '../../api';
import JoinFlow from './JoinFlow';
import VotingFlow from './VotingFlow';

export default function MobileSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (session?.status === 'archived') {
      window.location.href = '/join';
    }
  }, [session?.status]);

  useEffect(() => {
    let timeoutId;
    
    const loadSession = () => {
      const fetchSession = id ? fetchSessionDetails(id) : fetchActiveSession();
      
      fetchSession.then(data => {
        setSession(data);
        const saved = localStorage.getItem(`poll-night-${data.id}`);
        if (saved) {
          setParticipant(JSON.parse(saved));
        }

        const newSocket = io(`${window.location.protocol}//${window.location.hostname}:3001`);
        setSocket(newSocket);

        newSocket.on('session_state_changed', (msg) => {
          setSession(s => s ? { ...s, status: msg.status || s.status, closed_view: msg.closed_view || s.closed_view } : s);
        });

        newSocket.on('session_config_updated', (data) => {
          setSession(data);
        });

        newSocket.on('active_item_changed', (msg) => {
          setSession(s => s ? {
            ...s,
            items: s.items.map(it => {
              if (it.id === msg.itemId) {
                return { 
                  ...it, 
                  voting_status: msg.voting_status,
                  active_category_id: msg.active_category_id,
                  voting_opened_at: msg.voting_opened_at
                };
              }
              return msg.voting_status === 'open' ? { ...it, voting_status: 'closed' } : it;
            })
          } : s);
        });

        newSocket.on('participant_status_update', (msg) => {
          setSession(s => s ? { ...s, participants: msg.participants } : s);
        });

        newSocket.on('session_deleted', () => {
          setSession(s => s ? { ...s, status: 'deleted' } : s);
          localStorage.removeItem(`poll-night-${data.id}`);
        });

        newSocket.on('participant_kicked', (msg) => {
          const stored = localStorage.getItem(`poll-night-${data.id}`);
          if (stored && JSON.parse(stored).id === msg.participantId) {
            localStorage.removeItem(`poll-night-${data.id}`);
            setParticipant(null);
            newSocket.emit('join_session', { sessionId: data.id, role: 'guest' });
          }
        });
      }).catch(err => {
        console.error('Session not found, retrying in 3s...');
        timeoutId = setTimeout(loadSession, 3000);
      });
    };

    loadSession();

    return () => {
      clearTimeout(timeoutId);
      setSocket(s => {
        if (s) s.close();
        return null;
      });
    };
  }, [id]);

  useEffect(() => {
    if (socket && session?.id) {
      const handleConnect = () => {
        socket.emit('join_session', { 
          sessionId: session.id, 
          role: participant ? 'participant' : 'guest', 
          userId: participant?.id 
        });
      };

      if (socket.connected) {
        handleConnect();
      }

      socket.on('connect', handleConnect);

      return () => {
        socket.off('connect', handleConnect);
      };
    }
  }, [socket, participant, session?.id]);

  const handleJoin = (userData) => {
    setParticipant(userData);
    localStorage.setItem(`poll-night-${session.id}`, JSON.stringify(userData));
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-brand-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Looking for active event...</h2>
        <p className="text-zinc-500">Waiting for the host to create a session</p>
      </div>
    );
  }

  if (session.status === 'deleted') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="bg-zinc-900 p-8 rounded-3xl max-w-sm w-full border border-red-900/30">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Event Deleted</h2>
          <p className="text-zinc-400">The host has permanently deleted this session.</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return <JoinFlow session={session} onJoin={handleJoin} />;
  }

  const liveParticipant = session.participants?.find(p => p.id === participant.id) || participant;

  return <VotingFlow session={session} participant={liveParticipant} socket={socket} />;
}
