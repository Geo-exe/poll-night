import { useEffect, useState } from 'react';
import { fetchSessionVotes } from '../../api';
import { mediaUrl } from '../../utils/media';

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
    <div className="h-screen bg-zinc-950 text-white p-[clamp(1rem,2.5vw,3rem)] flex flex-col items-center justify-center overflow-hidden">
      <h1 className="text-[clamp(2.4rem,5.5vw,7rem)] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 mb-[clamp(1rem,3vh,4rem)] drop-shadow-[0_0_50px_rgba(251,191,36,0.3)] shrink-0 leading-tight text-center">
        Final Rankings
      </h1>
      
      <div className="flex items-end justify-center w-full max-w-[96vw] h-[clamp(260px,55vh,620px)] shrink-0" style={{ gap: results.length > 6 ? '1rem' : results.length > 4 ? '1.5rem' : '3rem' }}>
        {pyramidOrder.map((item) => {
          const colors = getColors(item.rank);
          
          // Calculate height purely based on rank to guarantee a perfect staircase shape
          const stepSize = 28 / Math.max(1, results.length - 1);
          const targetHeight = Math.max(12, 40 - (item.rank * stepSize));
          const height = mounted ? `${targetHeight}vh` : '0vh';
          
          const delay = (item.rank === 0 ? 1000 : item.rank === 1 ? 500 : item.rank === 2 ? 150 : 0) + (item.rank > 2 ? item.rank * 100 : 0);
          const isFirst = item.rank === 0;

          return (
            <div key={item.id} className={`flex flex-col items-center animate-in fade-in duration-1000 fill-mode-both flex-1 min-w-0 ${isFirst ? 'max-w-[clamp(10rem,14vw,20rem)] z-10' : 'max-w-[clamp(8rem,11vw,16rem)]'}`} style={{ animationDelay: `${delay}ms` }}>
              <span className={`font-bold mb-[clamp(0.3rem,1vh,1rem)] text-center line-clamp-2 px-2 leading-tight ${isFirst ? 'text-[clamp(1.2rem,2.4vw,3rem)]' : item.rank < 3 ? 'text-[clamp(1rem,1.9vw,2.25rem)]' : 'text-[clamp(0.8rem,1.3vw,1.5rem)]'} ${colors.text} transition-opacity duration-1000`} style={{ opacity: mounted ? 1 : 0, transitionDelay: `${delay + 500}ms` }}>
                {item.real_name || item.public_name}
              </span>
              <div 
                className={`w-full rounded-t-[clamp(1rem,2.5vw,2.5rem)] flex items-start justify-center pt-[clamp(0.5rem,2vh,2rem)] relative overflow-hidden transition-all ease-out ${colors.bg}`}
                style={{ height, transitionDuration: '1500ms', transitionDelay: `${delay}ms` }}
              >
                {item.image_url && (
                  <img
                    src={mediaUrl(item.image_url)}
                    alt={item.public_name}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                )}
                <div className={`absolute inset-0 ${colors.inset}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span className={`font-black relative ${isFirst ? 'text-[clamp(2.5rem,5vw,6rem)]' : item.rank < 3 ? 'text-[clamp(2rem,4vw,4.5rem)]' : 'text-[clamp(1.5rem,3vw,3rem)]'} ${colors.num} transition-opacity duration-1000`} style={{ opacity: mounted ? 1 : 0, transitionDelay: `${delay + 800}ms` }}>
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
