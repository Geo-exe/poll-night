import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSessionDetails, updateSessionStatus, updateSessionClosedView, updateSessionClosedSlide, updateItemVotingStatus, revealItem, removeParticipant } from '../../api';
import { io } from 'socket.io-client';
import { ArrowLeft, Play, Square, Eye, Users, CheckCircle2, ChevronLeft, ChevronRight, Lock, UserX, List, BarChart2, Pencil, LayoutGrid, Monitor, RotateCcw } from 'lucide-react';
import { mergeAttributes } from '../../utils/attributes';
import { isImageSource, mediaUrl } from '../../utils/media';
import { getReviewSlideCount, getReviewSlideLabels } from '../../utils/reviewSlides';

export default function SessionLive() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchSessionDetails(id).then(data => {
      setSession(data);
      setParticipants(data.participants);
    });

    const newSocket = io(`${window.location.protocol}//${window.location.hostname}:3001`);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_session', { sessionId: id, role: 'admin' });
    });

    newSocket.on('participant_status_update', (data) => {
      setParticipants(data.participants);
    });

    newSocket.on('session_config_updated', (data) => {
      setSession(data);
      setParticipants(data.participants || []);
    });

    newSocket.on('session_state_changed', (msg) => {
      setSession(s => s ? { ...s, ...msg } : s);
    });

    newSocket.on('active_item_changed', (data) => {
      setSession(s => ({
        ...s,
        items: s.items.map(it => {
          if (it.id === data.itemId) {
            return { 
              ...it, 
              voting_status: data.voting_status,
              active_category_id: data.active_category_id,
              vote_count: data.vote_count !== undefined ? data.vote_count : it.vote_count
            };
          }
          return data.voting_status === 'open' ? { ...it, voting_status: 'closed' } : it;
        })
      }));
    });

    newSocket.on('item_revealed', (data) => {
      setSession(s => ({
        ...s,
        items: s.items.map(it => it.id === data.itemId ? { ...it, revealed: 1, voting_status: 'closed' } : it)
      }));
    });

    newSocket.on('session_deleted', () => {
      window.location.href = '/admin';
    });

    return () => newSocket.close();
  }, [id]);

  if (!session) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading session...</div>;

  const handleStatusChange = async (newStatus) => {
    await updateSessionStatus(id, newStatus);
  };

  const isArchived = session.status === 'archived';

  const handleReactivate = async () => {
    if (!confirm('Riaprire questa sessione? Tornerà nello stato "closed" e sarà di nuovo visibile tra le sessioni attive.')) return;
    await updateSessionStatus(id, 'closed');
    setSession(current => current ? { ...current, status: 'closed' } : current);
  };

  const recapSlideCount = getReviewSlideCount(session);
  const recapSlideLabels = getReviewSlideLabels(session);
  const recapSlide = Math.min(
    Math.max(Number(session.closed_slide) || 0, 0),
    recapSlideCount - 1
  );
  const recapLocked = Boolean(session.closed_slide_locked);

  const handleRecapSlide = async (nextSlide) => {
    const safeSlide = Math.min(Math.max(nextSlide, 0), recapSlideCount - 1);
    setSession(current => current ? { ...current, closed_slide: safeSlide, closed_slide_locked: 1 } : current);
    await updateSessionClosedSlide(id, safeSlide, true);
  };

  const handleRecapAuto = async () => {
    setSession(current => current ? { ...current, closed_slide_locked: 0 } : current);
    await updateSessionClosedSlide(id, recapSlide, false);
  };

  const handleItemOpen = async (itemId) => {
    if (isArchived) return;
    const firstCatId = session.category_mode === 'single' && session.categories.length > 0 ? session.categories[0].id : null;
    await updateItemVotingStatus(id, itemId, 'open', firstCatId);
  };

  const handleItemClose = async (itemId) => {
    if (isArchived) return;
    await updateItemVotingStatus(id, itemId, 'closed', null);
  };

  const handleNextCategory = async (itemId) => {
    if (isArchived) return;
    const item = session.items.find(i => i.id === itemId);
    const currentIdx = session.categories.findIndex(c => c.id === item.active_category_id);
    if (currentIdx < session.categories.length - 1) {
      await updateItemVotingStatus(id, itemId, 'open', session.categories[currentIdx + 1].id);
    } else {
      await updateItemVotingStatus(id, itemId, 'closed', null);
    }
  };

  const isLastCategory = (categoryId) => {
    if (!session.categories || session.categories.length === 0) return true;
    return session.categories[session.categories.length - 1].id === categoryId;
  };

  const handleReveal = async (itemId) => {
    if (isArchived) return;
    if (!confirm('Are you sure you want to reveal this item? It cannot be reopened.')) return;
    await revealItem(id, itemId);
  };

  const handleKickParticipant = async (participantId) => {
    if (isArchived) return;
    if (!confirm('Are you sure you want to remove this participant? They will be immediately logged out and lose their votes.')) return;
    await removeParticipant(id, participantId);
  };

  const nextStatusMap = {
    'setup': { next: 'joining', label: 'Open Waiting Room' },
    'joining': { next: 'voting', label: 'Start Event' },
    'voting': { next: 'closed', label: 'See Results' },
    'closed': { next: 'archived', label: 'End Event' }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-3 bg-white dark:bg-zinc-900 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm border border-zinc-200 dark:border-zinc-800">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{session.name}</h1>
              <div className="flex gap-2 items-center text-sm font-mono mt-1 text-zinc-500">
                <span className="bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded">ID: {id}</span>
              </div>
              <div className="flex gap-3 items-center mt-3">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-semibold">
                  <Eye size={14} className={session.blind_mode ? "text-brand-500" : ""} /> 
                  Blind: {session.blind_mode ? 'ON' : 'OFF'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-semibold">
                  <List size={14} className={session.category_mode === 'single' ? "text-brand-500" : ""} /> 
                  Voting: {session.category_mode === 'single' ? 'One by One' : 'All at Once'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-semibold">
                  <BarChart2 size={14} className={session.results_mode === 'per_item' ? "text-brand-500" : ""} /> 
                  Results: {session.results_mode === 'per_item' ? 'Per Item' : 'At End'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {['setup', 'joining'].includes(session.status) && (
              <Link
                to={`/admin/session/${id}/edit`}
                className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-brand-500/60 text-zinc-700 dark:text-zinc-200 px-5 py-3 rounded-xl font-medium transition-all"
              >
                <Pencil size={18} /> Edit Session
              </Link>
            )}
            {nextStatusMap[session.status] && (
              <button 
                onClick={() => handleStatusChange(nextStatusMap[session.status].next)}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/20"
              >
                {nextStatusMap[session.status].label} <ChevronRight size={18} />
              </button>
            )}
            {['closed', 'archived'].includes(session.status) && session.closed_view === 'review' && (
              <button 
                onClick={() => updateSessionClosedView(id, 'podium')}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-amber-500/20"
              >
                Show Podium <ChevronRight size={18} />
              </button>
            )}
            {['closed', 'archived'].includes(session.status) && session.closed_view === 'podium' && (
              <button 
                onClick={() => updateSessionClosedView(id, 'review')}
                className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg"
              >
                <ArrowLeft size={18} /> Back to Analysis
              </button>
            )}
            {['closed', 'archived'].includes(session.status) && (
              <a
                href={`/tv/${id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 text-zinc-700 dark:text-zinc-200 px-5 py-3 rounded-xl font-medium transition-all"
              >
                <Monitor size={18} /> TV Recap
              </a>
            )}
            {isArchived && (
              <button
                onClick={handleReactivate}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
              >
                <RotateCcw size={18} /> Riapri
              </button>
            )}
            <button 
              onClick={() => { localStorage.removeItem('pollnight_token'); window.location.href = '/admin'; }}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-4 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
            >
              Logout
            </button>
            <div className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest ${
              session.status === 'setup' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              session.status === 'voting' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {session.status}
            </div>
          </div>
        </header>

        {isArchived && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <p className="font-semibold">Sessione archiviata · sola lettura</p>
              <p className="text-sm text-zinc-500">Puoi consultare il recap e il podio, oppure riaprire la sessione per renderla di nuovo attiva.</p>
            </div>
          </div>
        )}

        {['closed', 'archived'].includes(session.status) && session.closed_view === 'review' && (
          <div className="mb-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
                <LayoutGrid size={20} />
              </div>
              <div>
                <h2 className="font-semibold">TV Recap Carousel</h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {recapLocked
                    ? 'Bloccato su una schermata. La TV non si muove finché non riprendi l’auto.'
                    : 'Scorre ogni 10 secondi. Usa le frecce per bloccare la schermata che vuoi analizzare.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleRecapSlide(recapSlide - 1)}
                disabled={recapSlide === 0}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                title="Slide precedente"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="min-w-28 text-center">
                <div className="text-sm font-bold tabular-nums">Slide {recapSlide + 1} / {recapSlideCount}</div>
                <div className={`text-[10px] font-bold uppercase tracking-widest truncate max-w-[14rem] ${recapLocked ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {recapSlideLabels[recapSlide] || 'Recap'} · {recapLocked ? 'Bloccato' : 'Auto'}
                </div>
              </div>
              <button
                onClick={() => handleRecapSlide(recapSlide + 1)}
                disabled={recapSlide === recapSlideCount - 1}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                title="Slide successiva"
              >
                <ChevronRight size={18} />
              </button>
              {recapLocked ? (
                <button
                  onClick={handleRecapAuto}
                  className="ml-2 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  title="Riprendi lo scorrimento automatico"
                >
                  <Play size={16} /> Auto
                </button>
              ) : (
                <button
                  onClick={() => handleRecapSlide(recapSlide)}
                  className="ml-2 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  title="Blocca la slide selezionata"
                >
                  <Lock size={16} /> Blocca
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls (Items) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Items</h2>
            {session.items.map(item => {
              const connectedVoters = participants.filter(p => p.connected);
              const unvotedCount = connectedVoters.filter(p => !p.has_voted_active_item).length;
              const canAdvance = connectedVoters.length === 0 || unvotedCount === 0;

              return (
                <div key={item.id} className={`p-6 rounded-2xl border transition-all ${item.voting_status === 'open' ? 'bg-brand-500/10 border-brand-500/50 shadow-[0_0_30px_-5px_rgba(170,59,255,0.3)]' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {item.image_url && (
                      <img src={mediaUrl(item.image_url)} alt={item.public_name} className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                    )}
                    <div className="min-w-0">
                    <h3 className="text-xl font-bold">{item.public_name}</h3>
                    {!session.blind_mode ? (
                      <p className="text-zinc-500 font-medium mt-1">{item.real_name}</p>
                    ) : item.revealed ? (
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">Revealed: {item.real_name}</p>
                    ) : (
                      <p className="text-zinc-500 font-medium mt-1">Hidden: {item.real_name}</p>
                    )}
                    {mergeAttributes(session.shared_attributes, item.attributes).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mergeAttributes(session.shared_attributes, item.attributes).map((attr, i) => (
                          <span key={i} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold px-2 py-1 rounded-md">
                            {attr.key && `${attr.key}: `}{attr.value}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-3 uppercase tracking-wider">
                      <Users size={14} />
                      {item.voting_status === 'open' 
                        ? `${participants.filter(p => p.has_voted_active_item).length} Votes Cast (Live)${session.category_mode === 'single' ? ` - ${session.categories.find(c => c.id === item.active_category_id)?.name || ''}` : ''}`
                        : `${item.vote_count || 0} Votes Cast`}
                    </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.revealed ? (
                      <span className="flex items-center gap-2 text-zinc-500 font-medium px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <Lock size={18} /> Locked
                      </span>
                    ) : (
                      <>
                        {item.voting_status === 'closed' ? (
                          <button onClick={() => handleItemOpen(item.id)} disabled={session.status !== 'voting'} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
                            <Play size={18} /> {item.vote_count > 0 ? 'Reopen Voting' : 'Open Voting'}
                          </button>
                        ) : (
                          session.category_mode === 'single' ? null : (
                            <button 
                              onClick={() => handleItemClose(item.id)} 
                              disabled={!canAdvance}
                              title={!canAdvance ? `Waiting for ${unvotedCount} voter(s)` : ''}
                              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors animate-pulse"
                            >
                              <Square size={18} /> Close Voting
                            </button>
                          )
                        )}
                        {!!session.blind_mode && (
                          <button onClick={() => handleReveal(item.id)} disabled={item.voting_status === 'open' || session.status !== 'voting'} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-900 dark:text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
                            <Eye size={18} /> Reveal
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {session.category_mode === 'single' && item.voting_status === 'open' && (
                  <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center justify-between relative px-8">
                        <div className="absolute top-1/2 left-8 right-8 h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0 rounded-full" />
                        {session.categories.map((cat, i) => {
                          const activeIndex = session.categories.findIndex(c => c.id === item.active_category_id);
                          const isCompleted = i < activeIndex;
                          const isActive = i === activeIndex;
                          
                          return (
                            <div key={cat.id} className="relative z-10 flex flex-col items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-brand-500 border-brand-500 text-white' 
                                  : isActive 
                                    ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-500 shadow-[0_0_20px_rgba(170,59,255,0.4)]' 
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                              }`}>
                                {isCompleted ? <CheckCircle2 size={20} /> : (i + 1)}
                              </div>
                              <span className={`text-xs font-bold uppercase tracking-wider absolute top-14 whitespace-nowrap ${
                                isActive ? 'text-brand-500' : isCompleted ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-600'
                              }`}>
                                {cat.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pl-12 border-l border-zinc-200 dark:border-zinc-800 min-w-48 text-right">
                        <button 
                          onClick={() => handleNextCategory(item.id)} 
                          disabled={!canAdvance}
                          title={!canAdvance ? `Waiting for ${unvotedCount} voter(s)` : ''}
                          className="flex items-center justify-center w-full gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 disabled:shadow-none text-white px-6 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-brand-500/20"
                        >
                          {isLastCategory(item.active_category_id) ? <><Square size={20} /> Close Voting</> : <>Next <ChevronRight size={20} /></>}
                        </button>
                      </div>
                    </div>
                    <div className="h-6" /> {/* spacer for absolute labels */}
                  </div>
                )}
              </div>
            )})}
          </div>

          {/* Sidebar (Participants) */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-fit sticky top-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users size={20} className="text-brand-500" />
                Live Voters
              </h2>
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-full text-sm font-medium">
                {participants.length} total
              </span>
            </div>
            
            <div className="space-y-3">
              {participants.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">No one has joined yet.</div>
              ) : (
                participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${p.connected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                      <span className="font-medium flex items-center gap-2">
                        {isImageSource(p.avatar) ? (
                          <img src={mediaUrl(p.avatar)} alt={p.username} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                        ) : (
                          p.avatar || '👤'
                        )}
                        {p.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.has_voted_active_item && (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      )}
                      <button onClick={() => handleKickParticipant(p.id)} className="text-red-500/50 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="Remove participant">
                        <UserX size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Connect URL:</p>
              <div className="bg-zinc-100 dark:bg-zinc-950 p-3 rounded-xl font-mono text-sm text-center border border-zinc-200 dark:border-zinc-800 truncate">
                {`${window.location.protocol}//${window.location.hostname}:${window.location.port}/join`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
