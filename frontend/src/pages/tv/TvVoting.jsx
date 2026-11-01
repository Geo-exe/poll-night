import { useEffect, useRef, useState } from 'react';
import TvChat from './TvChat';
import { mergeAttributes } from '../../utils/attributes';
import { isImageSource, mediaUrl } from '../../utils/media';

function ItemAttributes({ attributes }) {
  if (!attributes || attributes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-[clamp(0.4rem,0.8vw,1rem)] mt-[clamp(0.6rem,1.4vh,1.5rem)] animate-in slide-in-from-bottom-10 fade-in duration-1000">
      {attributes.map((attribute, index) => (
        <div
          key={index}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[clamp(0.55rem,1vw,1.25rem)] px-[clamp(0.6rem,1.2vw,1.5rem)] py-[clamp(0.3rem,0.7vh,0.75rem)] flex items-center gap-[clamp(0.3rem,0.6vw,0.75rem)] shadow-lg"
        >
          {attribute.key && (
            <span className="text-zinc-300 uppercase tracking-widest text-[clamp(0.65rem,0.9vw,1.15rem)] font-semibold">{attribute.key}:</span>
          )}
          {attribute.value && (
            <span className="text-[clamp(0.95rem,1.5vw,2rem)] font-black text-white">{attribute.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ActiveItemHero({ item, session, eyebrow, live }) {
  const attributes = mergeAttributes(session.shared_attributes, item.attributes);
  const showRealName = (!session.blind_mode || Boolean(item.revealed)) && item.real_name;
  const activeCategory = session.category_mode === 'single' && item.active_category_id
    ? session.categories.find(category => category.id === item.active_category_id)
    : null;

  return (
    <div className="flex items-start gap-[clamp(1rem,2.5vw,3rem)] min-w-0">
      {item.image_url && (
        <div className="shrink-0 animate-in zoom-in-95 fade-in duration-700">
          <img
            src={mediaUrl(item.image_url)}
            alt={item.public_name}
            className="h-[clamp(140px,30vh,400px)] w-auto max-w-[clamp(110px,22vw,320px)] object-cover rounded-[clamp(0.8rem,1.6vw,2rem)] border-4 border-white/10 shadow-[0_0_60px_rgba(170,59,255,0.25)]"
          />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-brand-500 font-bold tracking-widest text-[clamp(0.85rem,1.2vw,1.6rem)] mb-[clamp(0.4rem,1vh,0.9rem)] uppercase flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
          {eyebrow}
          {live ? (
            <span className="w-[clamp(0.45rem,0.7vw,0.75rem)] h-[clamp(0.45rem,0.7vw,0.75rem)] bg-emerald-500 rounded-full animate-ping" />
          ) : (
            <span className="w-[clamp(0.45rem,0.7vw,0.75rem)] h-[clamp(0.45rem,0.7vw,0.75rem)] bg-red-500 rounded-full animate-pulse" />
          )}
        </p>
        <h1 className="text-[clamp(2.3rem,5.4vw,6.5rem)] font-black tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] leading-[0.95] break-words">
          {item.public_name}
        </h1>
        {showRealName && (
          <div className="animate-in slide-in-from-bottom-10 fade-in duration-1000">
            <h2 className="text-[clamp(1.6rem,3.4vw,4.25rem)] font-bold text-emerald-400 mt-[clamp(0.4rem,1vh,1rem)] drop-shadow-[0_0_30px_rgba(16,185,129,0.5)] leading-tight">
              {item.real_name}
            </h2>
          </div>
        )}
        <ItemAttributes attributes={attributes} />
        {activeCategory && (
          <div className="mt-[clamp(0.6rem,1.5vh,1.5rem)] inline-block bg-brand-500/20 border border-brand-500/50 text-brand-400 px-[clamp(0.7rem,1vw,1.5rem)] py-[clamp(0.3rem,0.6vh,0.6rem)] rounded-[clamp(0.6rem,1vw,1rem)] text-[clamp(0.85rem,1.2vw,1.5rem)] font-bold animate-in zoom-in">
            {activeCategory.name}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TvVoting({ session, participants, lastActiveItemId, socket }) {
  const openItem = session.items.find(i => i.voting_status === 'open');
  const fallbackClosedItem = [...session.items].reverse().find(i => i.voting_status === 'closed' && (i.vote_count > 0 || Boolean(i.revealed)));
  const locallyTrackedItem = lastActiveItemId ? session.items.find(i => i.id === lastActiveItemId) : null;
  const activeItem = openItem || locallyTrackedItem || fallbackClosedItem;

  const isClosed = activeItem?.voting_status === 'closed';
  const showResults = Boolean(activeItem) && isClosed && session.results_mode === 'per_item';

  const [showBars, setShowBars] = useState(false);
  const [voteSpotlight, setVoteSpotlight] = useState(null);
  const prevVotedRef = useRef(null);

  useEffect(() => {
    if (showResults) {
      const timer = setTimeout(() => setShowBars(true), 100);
      return () => clearTimeout(timer);
    }
    setShowBars(false);
  }, [showResults]);

  useEffect(() => {
    const currentVoters = new Set(participants.filter(p => p.has_voted_active_item).map(p => p.id));
    if (prevVotedRef.current) {
      const newlyVoted = participants.filter(p => p.has_voted_active_item && !prevVotedRef.current.has(p.id));
      if (newlyVoted.length > 0) {
        setVoteSpotlight(newlyVoted[newlyVoted.length - 1]);
      }
    }
    prevVotedRef.current = currentVoters;
  }, [participants]);

  useEffect(() => {
    if (!voteSpotlight) return;
    const timer = setTimeout(() => setVoteSpotlight(null), 3200);
    return () => clearTimeout(timer);
  }, [voteSpotlight]);

  useEffect(() => {
    setVoteSpotlight(null);
  }, [activeItem?.id]);

  if (!activeItem) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-[clamp(1rem,3vw,4rem)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(170,59,255,0.05),transparent_70%)]" />
        <h2 className="text-[clamp(2rem,5vw,5rem)] font-bold text-zinc-600 animate-pulse relative z-10 text-center">Waiting for the host to start...</h2>
      </div>
    );
  }

  const votedCount = participants.filter(p => p.has_voted_active_item).length;
  const voterRow = `min(calc(62vh / ${Math.max(participants.length, 1)}), 5.5rem)`;
  const panelAvatarClass = participants.length > 24
    ? 'w-[clamp(1.5rem,2.2vw,2.5rem)] h-[clamp(1.5rem,2.2vw,2.5rem)]'
    : participants.length > 14
      ? 'w-[clamp(2rem,3.2vw,3.5rem)] h-[clamp(2rem,3.2vw,3.5rem)]'
      : 'w-[clamp(3rem,5vw,6rem)] h-[clamp(3rem,5vw,6rem)]';

  return (
    <div className="h-screen bg-zinc-950 text-white p-[clamp(1.25rem,3vw,4.5rem)] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(170,59,255,0.1),transparent_50%)]" />
      {isClosed && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.1),transparent_50%)] animate-in fade-in duration-1000" />}

      {isClosed ? (
        <header className="mb-[clamp(1rem,3vh,3.5rem)] relative z-10">
          <ActiveItemHero item={activeItem} session={session} eyebrow="Voting Closed" live={false} />
        </header>
      ) : null}

      <div className="flex-1 relative z-10 flex flex-col min-h-0">
        {showResults ? (
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-[clamp(1rem,3vw,4.5rem)]">
            {/* Results Column */}
            <div className="space-y-[clamp(0.8rem,2.2vh,2.25rem)]">
              {session.categories.map((category, index) => {
                const max = category.scale === '1-5' ? 5 : 10;
                const avg = activeItem.category_averages?.[category.id] || 0;
                const pct = (avg / max) * 100;

                return (
                  <div key={category.id} className="relative animate-in slide-in-from-left-10 fade-in duration-700 fill-mode-both" style={{ animationDelay: `${index * 150}ms` }}>
                    <div className="flex justify-between mb-[clamp(0.4rem,1vh,1rem)] text-[clamp(1rem,1.5vw,2rem)] font-bold">
                      <span className="text-zinc-200">{category.name}</span>
                      <span style={{ color: `hsl(${pct * 1.2}, 85%, 60%)` }}>
                        {avg.toFixed(1)} <span className="text-zinc-600 text-[clamp(0.75rem,1.1vw,1.5rem)]">/ {max}</span>
                      </span>
                    </div>
                    <div className="h-[clamp(0.6rem,2vh,1.5rem)] bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden shadow-inner p-[2px]">
                      <div
                        className="h-full rounded-full transition-all duration-[2000ms] ease-out shadow-lg"
                        style={{
                          width: showBars ? `${pct}%` : '0%',
                          transitionDelay: `${400 + (index * 200)}ms`,
                          backgroundColor: `hsl(${pct * 1.2}, 85%, 50%)`,
                          boxShadow: `0 0 20px hsla(${pct * 1.2}, 85%, 50%, 0.4)`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Voters Summary Column */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[clamp(1.25rem,2.5vw,3rem)] p-[clamp(1rem,2vw,3rem)] flex flex-col justify-center overflow-hidden animate-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
              <h3 className="text-[clamp(1rem,1.6vw,2.25rem)] font-bold text-center text-zinc-400 mb-[clamp(0.75rem,2vh,2.5rem)] uppercase tracking-widest">The Panel</h3>
              <div className="flex flex-wrap justify-center gap-[clamp(0.5rem,1.2vw,1.5rem)] overflow-hidden">
                {participants.map(participant => (
                  <div key={participant.id} className="relative group">
                    <div className={`${panelAvatarClass} rounded-full bg-zinc-800 border-4 border-zinc-700 overflow-hidden shadow-xl`}>
                      {isImageSource(participant.avatar) ? (
                        <img src={mediaUrl(participant.avatar)} alt={participant.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[clamp(0.8rem,1.6vw,2rem)]">{participant.avatar || '👤'}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isClosed && session.results_mode === 'end' ? (
          <div className="h-full flex items-center justify-center animate-in zoom-in duration-700">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-[clamp(1.5rem,3vw,4rem)] p-[clamp(1.5rem,4vw,6rem)] text-center max-w-[min(90vw,60rem)] shadow-2xl">
              <div className="text-[clamp(3rem,8vw,8rem)] mb-[clamp(0.5rem,2vh,2rem)]">🔒</div>
              <h2 className="text-[clamp(2rem,4.5vw,5rem)] font-black mb-[clamp(0.5rem,1.5vh,1.5rem)] text-brand-500">Votes Locked</h2>
              <p className="text-[clamp(1.1rem,2.4vw,3rem)] text-zinc-400 font-medium leading-relaxed">Results will be revealed at the end of the session!</p>
            </div>
          </div>
        ) : (
          /* Live Voting Layout */
          <div className="flex-1 grid grid-cols-[minmax(0,1fr)_clamp(250px,23vw,440px)] gap-[clamp(1rem,2.5vw,3.5rem)] min-h-0">
            <div className="flex flex-col justify-between min-h-0">
              <div>
                <ActiveItemHero item={activeItem} session={session} eyebrow="Now Tasting" live />
              </div>
              <TvChat socket={socket} />
            </div>

            <aside className="flex flex-col min-h-0">
              <div className="text-right mb-[clamp(0.5rem,1.5vh,1.5rem)]">
                <div className="text-[clamp(0.75rem,1vw,1.5rem)] text-zinc-500 font-medium uppercase tracking-widest mb-1">Voters</div>
                <div className="text-[clamp(2rem,3.6vw,4.5rem)] font-black text-brand-400 flex items-baseline gap-2 justify-end drop-shadow-[0_0_20px_rgba(170,59,255,0.5)]">
                  {votedCount} <span className="text-[clamp(1.2rem,2.2vw,2.75rem)] text-zinc-600">/ {participants.length}</span>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col gap-[2px] pr-2 overflow-hidden" style={{ '--voter-row': voterRow }}>
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-[clamp(0.4rem,0.9vw,1.1rem)] px-[clamp(0.25rem,0.6vw,0.75rem)] rounded-[clamp(0.6rem,1.2vw,1.4rem)] transition-all duration-700 animate-in fade-in slide-in-from-right-10 fill-mode-both shrink-0"
                    style={{ animationDelay: `${index * 50}ms`, height: 'var(--voter-row)' }}
                  >
                    <div
                      className={`shrink-0 rounded-full border-2 overflow-hidden shadow-lg transition-all duration-700 ${participant.has_voted_active_item ? 'border-emerald-500 shadow-emerald-500/30' : 'border-zinc-800'}`}
                      style={{
                        width: 'min(clamp(2rem, 5vw, 6rem), calc(var(--voter-row) * 0.72))',
                        height: 'min(clamp(2rem, 5vw, 6rem), calc(var(--voter-row) * 0.72))'
                      }}
                    >
                      {isImageSource(participant.avatar) ? (
                        <img src={mediaUrl(participant.avatar)} alt={participant.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900" style={{ fontSize: 'calc(var(--voter-row) * 0.42)' }}>{participant.avatar || '👤'}</div>
                      )}
                    </div>
                    <div
                      className={`flex-1 font-bold truncate leading-tight transition-colors duration-700 ${participant.has_voted_active_item ? 'text-emerald-400' : 'text-zinc-500'}`}
                      style={{ fontSize: 'min(clamp(0.8rem, 1.9vw, 2.75rem), calc(var(--voter-row) * 0.45))' }}
                    >
                      {participant.username}
                    </div>
                    {participant.has_voted_active_item && (
                      <div
                        className="shrink-0 animate-in zoom-in spin-in-12 duration-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        style={{ fontSize: 'min(clamp(1rem, 2.4vw, 3rem), calc(var(--voter-row) * 0.5))' }}
                      >
                        👍
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>

      {voteSpotlight && (
        <div className="fixed bottom-[clamp(1rem,4vh,3rem)] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="flex items-center gap-[clamp(0.6rem,1vw,1.25rem)] bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-full pl-[clamp(0.4rem,0.7vw,0.75rem)] pr-[clamp(1.25rem,2vw,2.5rem)] py-[clamp(0.35rem,0.7vh,0.75rem)] shadow-[0_0_50px_rgba(16,185,129,0.35)]">
            <div className="w-[clamp(3rem,5vw,6rem)] h-[clamp(3rem,5vw,6rem)] shrink-0 rounded-full border-2 border-emerald-500 overflow-hidden shadow-lg">
              {isImageSource(voteSpotlight.avatar) ? (
                <img src={mediaUrl(voteSpotlight.avatar)} alt={voteSpotlight.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[clamp(1.2rem,2vw,2.5rem)] bg-zinc-800">{voteSpotlight.avatar || '👤'}</div>
              )}
            </div>
            <div>
              <p className="text-emerald-400 text-[clamp(0.6rem,0.75vw,0.9rem)] font-bold uppercase tracking-widest">Vote locked</p>
              <p className="text-[clamp(1.1rem,1.6vw,2.25rem)] font-black leading-tight">{voteSpotlight.username}</p>
            </div>
            <span className="text-[clamp(1.4rem,2.4vw,3rem)]">👍</span>
          </div>
        </div>
      )}
    </div>
  );
}
