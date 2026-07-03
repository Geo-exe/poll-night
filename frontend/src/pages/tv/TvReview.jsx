import { useEffect, useState } from 'react';
import { fetchSessionVotes } from '../../api';

export default function TvReview({ session }) {
  const [results, setResults] = useState([]);
  const [categoryWinners, setCategoryWinners] = useState([]);
  const [mostPolarizing, setMostPolarizing] = useState(null);
  const [showBars, setShowBars] = useState(false);

  useEffect(() => {
    fetchSessionVotes(session.id).then(votes => {
      const res = session.items.map(item => {
        const itemVotes = votes.filter(v => v.item_id === item.id);
        const uniqueVoters = new Set(itemVotes.map(v => v.participant_id)).size;
        
        let totalScore = 0;
        const catAverages = {};
        
        session.categories.forEach(cat => {
          const catVotes = itemVotes.filter(v => v.category_id === cat.id);
          let avg = 0;
          if (catVotes.length > 0) {
             const sum = catVotes.reduce((acc, v) => acc + v.value, 0);
             avg = sum / catVotes.length;
          }
          catAverages[cat.id] = avg;
          totalScore += avg * (cat.weight || 1);
        });

        // Compute polarization (standard dev of normalized vote percentages)
        let polarization = 0;
        if (itemVotes.length > 0) {
          const meanPct = itemVotes.reduce((acc, v) => {
            const catScale = session.categories.find(c => c.id === v.category_id)?.scale === '1-5' ? 5 : 10;
            return acc + (v.value / catScale) * 100;
          }, 0) / itemVotes.length;
          const variance = itemVotes.reduce((acc, v) => {
            const catScale = session.categories.find(c => c.id === v.category_id)?.scale === '1-5' ? 5 : 10;
            const pct = (v.value / catScale) * 100;
            return acc + Math.pow(pct - meanPct, 2);
          }, 0) / itemVotes.length;
          polarization = Math.sqrt(variance);
        }

        return {
          ...item,
          totalScore,
          catAverages,
          polarization,
          voteCount: uniqueVoters
        };
      }).sort((a, b) => b.totalScore - a.totalScore);

      const catWins = session.categories.map(cat => {
        let max = -1;
        let winner = null;
        res.forEach(item => {
          if (item.catAverages[cat.id] > max) {
            max = item.catAverages[cat.id];
            winner = item;
          }
        });
        return { category: cat, winner, score: max };
      });

      const polarizingWinner = [...res].sort((a, b) => b.polarization - a.polarization)[0];

      setResults(res);
      setCategoryWinners(catWins);
      setMostPolarizing(polarizingWinner);
      setTimeout(() => setShowBars(true), 100);
    });
  }, [session]);

  if (results.length === 0) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-12">
      <h1 className="text-[5rem] font-black mb-16 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
        Detailed Analysis
      </h1>
      
      <div className="grid grid-cols-12 gap-12 max-w-[95vw] mx-auto">
        
        {/* Left Column: Awards & Insights */}
        <div className="col-span-4 space-y-6">
          
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-left-10 duration-1000">
            <h2 className="text-3xl font-bold mb-4 text-zinc-300 uppercase tracking-widest border-b border-zinc-800 pb-4">Category Winners</h2>
            <div className="space-y-3">
              {categoryWinners.map((cw, idx) => {
                const pct = (cw.score / (cw.category.scale === '1-5' ? 5 : 10)) * 100;
                return (
                  <div key={cw.category.id} className="flex justify-between items-center bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50" style={{ animationDelay: `${idx * 200}ms` }}>
                    <div>
                      <h3 className="text-xl font-bold text-brand-400">{cw.category.name}</h3>
                      <p className="text-2xl font-black text-white">{(!session.blind_mode || cw.winner?.revealed) ? (cw.winner?.real_name || cw.winner?.public_name) : cw.winner?.public_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black drop-shadow-md" style={{ color: `hsl(${pct * 1.2}, 85%, 60%)` }}>
                        {cw.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {mostPolarizing && mostPolarizing.polarization > 0 && (
            <div className="bg-gradient-to-br from-rose-900/40 to-orange-900/40 border border-rose-500/30 rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-left-10 duration-1000 delay-500 fill-mode-both">
              <h2 className="text-2xl font-bold mb-2 text-rose-300 uppercase tracking-widest">Most Polarizing</h2>
              <p className="text-zinc-400 text-sm mb-6 font-medium">The item with the highest variance in votes (loved by some, hated by others).</p>
              <div className="flex justify-between items-center">
                <p className="text-4xl font-black text-white">
                  {(!session.blind_mode || mostPolarizing.revealed) ? (mostPolarizing.real_name || mostPolarizing.public_name) : mostPolarizing.public_name}
                </p>
                <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center">
                  <span className="text-rose-400 font-bold text-xl">🔥</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Breakdown Grid */}
        <div className="col-span-8">
          <div className={`grid gap-6 ${
            results.length > 10 ? 'grid-cols-4' : 
            results.length > 8 ? 'grid-cols-3' : 
            'grid-cols-2'
          }`}>
            {results.map((item, idx) => {
              const isDense = results.length > 10;
              const isCompact = results.length > 8;
              
              return (
              <div 
                key={item.id} 
                style={{ animationDelay: `${idx * 150}ms` }}
                className={`bg-zinc-900 border border-zinc-800 rounded-[2rem] flex flex-col shadow-xl animate-in slide-in-from-right-16 fade-in duration-1000 fill-mode-both ${
                  isDense ? 'p-4 justify-center gap-2' : isCompact ? 'p-6 justify-center gap-2' : 'p-6 justify-center gap-4'
                }`}
              >
                <div className="w-full flex-shrink-0">
                  <div className={`flex justify-between items-start ${isDense ? 'mb-2' : isCompact ? 'mb-3' : 'mb-4'}`}>
                    <h2 className={`font-bold text-zinc-200 line-clamp-2 leading-tight ${
                      isDense ? 'text-xl' : isCompact ? 'text-2xl' : 'text-3xl'
                    }`}>
                      {(!session.blind_mode || item.revealed) ? (item.real_name || item.public_name) : item.public_name}
                    </h2>
                    <div className={`${isDense ? 'w-10 h-10 text-xl rounded-xl' : isCompact ? 'w-12 h-12 text-2xl rounded-2xl' : 'w-14 h-14 text-2xl rounded-2xl'} bg-zinc-800 flex items-center justify-center font-black text-zinc-500 shrink-0 ml-2`}>
                      #{idx + 1}
                    </div>
                  </div>
                  
                  <div className={`flex gap-1 h-3 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 relative p-0.5 ${isDense ? 'mb-2' : isCompact ? 'mb-4' : 'mb-8'}`}>
                    {session.categories.map((cat, i) => {
                       const max = cat.scale === '1-5' ? 5 : 10;
                       const pct = (item.catAverages[cat.id] / max) * 100;
                       return (
                         <div 
                           key={cat.id} 
                           style={{ 
                             width: showBars ? `${pct}%` : '0%', 
                             transitionDelay: `${(idx * 150) + 400 + (i * 100)}ms`,
                             backgroundColor: `hsl(${pct * 1.2}, 85%, 50%)`
                           }} 
                           className="transition-all duration-[1500ms] ease-out h-full rounded-full opacity-90" 
                           title={cat.name} 
                         />
                       )
                    })}
                  </div>
                </div>

                <div className={`flex flex-wrap items-center ${isDense ? 'gap-x-3 gap-y-1' : isCompact ? 'gap-x-4 gap-y-2' : 'gap-x-6 gap-y-3'}`}>
                   {session.categories.map((cat, i) => {
                      const pct = (item.catAverages[cat.id] / (cat.scale === '1-5' ? 5 : 10)) * 100;
                      return (
                        <div key={cat.id} className="flex flex-col">
                          <span className={`text-zinc-500 uppercase font-bold tracking-widest ${isDense ? 'text-[9px]' : isCompact ? 'text-[10px]' : 'text-[11px]'}`}>{cat.name}</span>
                          <span className={`font-bold drop-shadow-md ${isDense ? 'text-lg' : isCompact ? 'text-xl' : 'text-2xl'}`} style={{ color: `hsl(${pct * 1.2}, 85%, 60%)` }}>
                            {item.catAverages[cat.id].toFixed(1)}
                          </span>
                        </div>
                      );
                   })}
                   <div className={`flex flex-col ml-auto text-right bg-zinc-950 rounded-2xl border border-zinc-800/50 ${isDense ? 'px-3 py-1.5' : isCompact ? 'px-4 py-2' : 'px-5 py-2'}`}>
                      <span className={`text-brand-500 uppercase font-bold tracking-widest ${isDense ? 'text-[9px] mb-0' : isCompact ? 'text-[10px] mb-0' : 'text-[11px] mb-1'}`}>Total</span>
                      <span className={`font-black text-white ${isDense ? 'text-2xl' : isCompact ? 'text-2xl' : 'text-3xl'}`}>{item.totalScore.toFixed(1)}</span>
                   </div>
                </div>
              </div>
            )})}
          </div>
        </div>
        
      </div>
    </div>
  );
}
