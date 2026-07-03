import { useEffect, useState } from 'react';
import TvChat from './TvChat';

export default function TvVoting({ session, participants, lastActiveItemId, socket }) {
  const openItem = session.items.find(i => i.voting_status === 'open');
  const fallbackClosedItem = [...session.items].reverse().find(i => i.voting_status === 'closed' && (i.vote_count > 0 || Boolean(i.revealed)));
  const locallyTrackedItem = lastActiveItemId ? session.items.find(i => i.id === lastActiveItemId) : null;
  const activeItem = openItem || locallyTrackedItem || fallbackClosedItem;
  
  if (!activeItem) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(170,59,255,0.05),transparent_70%)]" />
        <h2 className="text-6xl font-bold text-zinc-600 animate-pulse relative z-10">Waiting for the host to start...</h2>
      </div>
    );
  }

  const isClosed = activeItem.voting_status === 'closed';
  const showResults = isClosed && session.results_mode === 'per_item';

  const [showBars, setShowBars] = useState(false);

  useEffect(() => {
    if (showResults) {
      const timer = setTimeout(() => setShowBars(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowBars(false);
    }
  }, [showResults]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-20 flex flex-col relative overflow-hidden">
      {/* Common Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(170,59,255,0.1),transparent_50%)]" />
      {isClosed && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.1),transparent_50%)] animate-in fade-in duration-1000" />}

      {isClosed ? (
        <header className="mb-20 flex items-end justify-between relative z-10">
          <div>
            <p className="text-brand-500 font-bold tracking-widest text-3xl mb-4 uppercase flex items-center gap-4">
              Voting Closed
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </p>
            <h1 className="text-[7rem] font-black tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] leading-none">
              {activeItem.public_name}
            </h1>
            {(!session.blind_mode || Boolean(activeItem.revealed)) && activeItem.real_name && (
              <div className="animate-in slide-in-from-bottom-10 fade-in duration-1000">
                <h2 className="text-[5rem] font-bold text-emerald-400 mt-4 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  {activeItem.real_name}
                </h2>
              </div>
            )}
            {activeItem.attributes && activeItem.attributes.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-6 animate-in slide-in-from-bottom-10 fade-in duration-1000">
                {activeItem.attributes.filter(a => a.key || a.value).map((attr, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-lg">
                    {attr.key && <span className="text-zinc-300 uppercase tracking-widest text-lg font-semibold">{attr.key}:</span>}
                    {attr.value && <span className="text-3xl font-black text-white">{attr.value}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>
      ) : null}

      <div className="flex-1 relative z-10 flex flex-col">
        {showResults ? (
          <div className="grid grid-cols-2 gap-20">
            {/* Results Column */}
            <div className="space-y-10">
              {session.categories.map((cat, idx) => {
                const max = cat.scale === '1-5' ? 5 : 10;
                const avg = activeItem.category_averages?.[cat.id] || 0;
                const pct = (avg / max) * 100;
                
                return (
                  <div key={cat.id} className="relative animate-in slide-in-from-left-10 fade-in duration-700 fill-mode-both" style={{ animationDelay: `${idx * 150}ms` }}>
                    <div className="flex justify-between mb-4 text-3xl font-bold">
                      <span className="text-zinc-200">{cat.name}</span>
                      <span style={{ color: `hsl(${pct * 1.2}, 85%, 60%)` }}>{avg.toFixed(1)} <span className="text-zinc-600 text-2xl">/ {max}</span></span>
                    </div>
                    <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden shadow-inner p-1">
                      <div 
                        className="h-full rounded-full transition-all duration-[2000ms] ease-out shadow-lg" 
                        style={{ 
                          width: showBars ? `${pct}%` : '0%', 
                          transitionDelay: `${400 + (idx * 200)}ms`,
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
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[3rem] p-12 flex flex-col justify-center animate-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
              <h3 className="text-4xl font-bold text-center text-zinc-400 mb-12 uppercase tracking-widest">The Panel</h3>
              <div className="flex flex-wrap justify-center gap-6">
                {participants.map(p => (
                  <div key={p.id} className="relative group">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-700 overflow-hidden shadow-xl">
                      {p.avatar?.startsWith('data:image') ? (
                        <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">{p.avatar || '👤'}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isClosed && session.results_mode === 'end' ? (
          <div className="h-full flex items-center justify-center animate-in zoom-in duration-700">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-[4rem] p-24 text-center max-w-4xl shadow-2xl">
              <div className="text-[8rem] mb-8">🔒</div>
              <h2 className="text-6xl font-black mb-6 text-brand-500">Votes Locked</h2>
              <p className="text-4xl text-zinc-400 font-medium leading-relaxed">Results will be revealed at the end of the session!</p>
            </div>
          </div>
        ) : (
          /* Live Voting Layout */
          <div className="flex-1 flex gap-16">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div>
                <p className="text-brand-500 font-bold tracking-widest text-3xl mb-4 uppercase flex items-center gap-4">
                  Now Tasting
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                </p>
                <h1 className="text-[7rem] font-black tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] leading-none">
                  {activeItem.public_name}
                </h1>
                {(!session.blind_mode || Boolean(activeItem.revealed)) && activeItem.real_name && (
                  <div className="animate-in slide-in-from-bottom-10 fade-in duration-1000">
                    <h2 className="text-[5rem] font-bold text-emerald-400 mt-4 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                      {activeItem.real_name}
                    </h2>
                  </div>
                )}
                {activeItem.attributes && activeItem.attributes.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-6 animate-in slide-in-from-bottom-10 fade-in duration-1000">
                    {activeItem.attributes.filter(a => a.key || a.value).map((attr, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-lg">
                        {attr.key && <span className="text-zinc-300 uppercase tracking-widest text-lg font-semibold">{attr.key}:</span>}
                        {attr.value && <span className="text-3xl font-black text-white">{attr.value}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {session.category_mode === 'single' && activeItem.active_category_id && (
                  <div className="mt-8 inline-block bg-brand-500/20 border border-brand-500/50 text-brand-400 px-6 py-3 rounded-2xl text-2xl font-bold animate-in zoom-in">
                    {session.categories.find(c => c.id === activeItem.active_category_id)?.name || ''}
                  </div>
                )}
              </div>
              <TvChat socket={socket} />
            </div>

            <div className="w-[450px] shrink-0 flex flex-col">
              <div className="text-right mb-8">
                <div className="text-2xl text-zinc-500 font-medium uppercase tracking-widest mb-2">Voters</div>
                <div className="text-6xl font-black text-brand-400 flex items-baseline gap-2 justify-end drop-shadow-[0_0_20px_rgba(170,59,255,0.5)]">
                  {participants.filter(p => p.has_voted_active_item).length} <span className="text-4xl text-zinc-600">/ {participants.length}</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-4 custom-scrollbar">
                {participants.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className="flex items-center gap-6 p-4 rounded-3xl transition-all duration-700 animate-in fade-in slide-in-from-right-10 fill-mode-both"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className={`w-20 h-20 shrink-0 rounded-full border-4 overflow-hidden shadow-lg transition-all duration-700 ${p.has_voted_active_item ? 'border-emerald-500 shadow-emerald-500/30' : 'border-zinc-800'}`}>
                      {p.avatar?.startsWith('data:image') ? (
                        <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-zinc-900">{p.avatar || '👤'}</div>
                      )}
                    </div>
                    <div className={`flex-1 text-4xl font-bold truncate transition-colors duration-700 ${p.has_voted_active_item ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {p.username}
                    </div>
                    {p.has_voted_active_item && (
                      <div className="text-5xl animate-in zoom-in spin-in-12 duration-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        👍
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
