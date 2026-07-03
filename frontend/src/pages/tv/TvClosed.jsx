import { useEffect, useState } from 'react';
import { fetchSessionVotes } from '../../api';

export default function TvClosed({ session }) {
  const [results, setResults] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchSessionVotes(session.id).then(votes => {
      const res = session.items.map(item => {
        const itemVotes = votes.filter(v => v.item_id === item.id);
        
        let totalScore = 0;
        
        session.categories.forEach(cat => {
          const catVotes = itemVotes.filter(v => v.category_id === cat.id);
          let avg = 0;
          if (catVotes.length > 0) {
             const sum = catVotes.reduce((acc, v) => acc + v.value, 0);
             avg = sum / catVotes.length;
          }
          totalScore += avg * (cat.weight || 1);
        });

        return {
          ...item,
          score: totalScore
        };
      }).sort((a, b) => b.score - a.score);

      setResults(res);
    });
  }, [session]);

  useEffect(() => {
    if (results.length > 0) {
      setTimeout(() => setMounted(true), 100);
    }
  }, [results]);

  if (results.length === 0) return null;

  // Build pyramid order: Left side (odd ranks descending), Middle (1st), Right side (even ranks ascending)
  const pyramidOrder = [];
  for (let i = results.length - 1; i >= 0; i--) {
    if (i % 2 !== 0) pyramidOrder.push({ ...results[i], rank: i });
  }
  if (results.length > 0) pyramidOrder.push({ ...results[0], rank: 0 });
  for (let i = 2; i < results.length; i += 2) {
    pyramidOrder.push({ ...results[i], rank: i });
  }

  const maxScore = results[0].score || 1;

  const getColors = (rank) => {
    if (rank === 0) return { bg: 'bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_0_100px_rgba(251,191,36,0.5)]', text: 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]', num: 'text-amber-950', inset: 'bg-gradient-to-b from-white/30 to-transparent' };
    if (rank === 1) return { bg: 'bg-zinc-400 shadow-[0_0_60px_rgba(161,161,170,0.4)]', text: 'text-zinc-300', num: 'text-zinc-900', inset: 'bg-gradient-to-b from-white/20 to-transparent' };
    if (rank === 2) return { bg: 'bg-amber-800/80 shadow-[0_0_50px_rgba(146,64,14,0.4)]', text: 'text-amber-700/80', num: 'text-amber-950', inset: 'bg-gradient-to-b from-white/10 to-transparent' };
    return { bg: 'bg-zinc-800/80 border-t border-zinc-700', text: 'text-zinc-500', num: 'text-zinc-900', inset: 'bg-gradient-to-b from-white/5 to-transparent' };
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-12 flex flex-col items-center justify-center overflow-hidden">
      <h1 className="text-[7rem] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 mb-20 drop-shadow-[0_0_50px_rgba(251,191,36,0.3)] shrink-0">
        Final Rankings
      </h1>
      
      <div className="flex items-end justify-center w-full max-w-[95vw] h-[500px] shrink-0" style={{ gap: results.length > 6 ? '1rem' : results.length > 4 ? '1.5rem' : '3rem' }}>
        {pyramidOrder.map((item, idx) => {
          const colors = getColors(item.rank);
          
          // Calculate height purely based on rank to guarantee a perfect staircase shape
          const stepSize = 400 / Math.max(1, results.length - 1);
          const targetHeight = Math.max(80, 480 - (item.rank * stepSize));
          const heightPx = mounted ? targetHeight : 0;
          
          const delay = (item.rank === 0 ? 1000 : item.rank === 1 ? 500 : item.rank === 2 ? 150 : 0) + (item.rank > 2 ? item.rank * 100 : 0);
          const isFirst = item.rank === 0;

          return (
            <div key={item.id} className={`flex flex-col items-center animate-in fade-in duration-1000 fill-mode-both flex-1 ${isFirst ? 'max-w-[16rem] z-10' : 'max-w-[14rem]'}`} style={{ animationDelay: `${delay}ms` }}>
              <span className={`font-bold mb-4 text-center line-clamp-2 px-2 ${isFirst ? 'text-5xl' : item.rank < 3 ? 'text-4xl' : 'text-2xl'} ${colors.text} transition-opacity duration-1000`} style={{ opacity: mounted ? 1 : 0, transitionDelay: `${delay + 500}ms` }}>
                {item.real_name || item.public_name}
              </span>
              <div 
                className={`w-full rounded-t-[2.5rem] flex items-start justify-center pt-8 relative overflow-hidden transition-all ease-out ${colors.bg}`} 
                style={{ height: `${heightPx}px`, transitionDuration: '1500ms', transitionDelay: `${delay}ms` }}
              >
                <div className={`absolute inset-0 ${colors.inset}`} />
                <span className={`font-black relative ${isFirst ? 'text-8xl' : item.rank < 3 ? 'text-7xl' : 'text-5xl'} ${colors.num} transition-opacity duration-1000`} style={{ opacity: mounted ? 1 : 0, transitionDelay: `${delay + 800}ms` }}>
                  {item.rank + 1}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
