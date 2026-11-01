import { useEffect, useState } from 'react';
import { fetchSessionVotes } from '../../api';
import { chunkList, getReviewSlideCount, REVIEW_SLIDES_PER_PAGE, DEVIATION_SLIDES_PER_PAGE } from '../../utils/reviewSlides';
import { mediaUrl } from '../../utils/media';

const AUTO_SLIDE_MS = 10000;

const sigmaLabel = (sigma) => (
  sigma >= 32.5 ? 'Estremamente divisivo'
    : sigma >= 22.5 ? 'Molto divisivo'
      : sigma >= 12.5 ? 'Divisivo'
        : 'Voti abbastanza vicini'
);

const sigmaColor = (sigma) => (
  sigma >= 32.5 ? 'text-rose-400'
    : sigma >= 22.5 ? 'text-orange-400'
      : sigma >= 12.5 ? 'text-amber-400'
        : 'text-emerald-400'
);

const displayName = (item, session) => (
  (!session.blind_mode || item?.revealed) ? (item?.real_name || item?.public_name) : item?.public_name
);

function SlideHeader({ title, subtitle, index, count, locked }) {
  return (
    <header className="flex items-start justify-between gap-4 shrink-0 mb-[clamp(0.6rem,1.8vh,1.5rem)]">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.8rem,3.8vw,4.5rem)] font-black tracking-tighter leading-none line-clamp-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[clamp(0.75rem,1.1vw,1.4rem)] text-zinc-500 font-medium mt-1 truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)] shrink-0">
        <span className={`px-[clamp(0.5rem,0.9vw,1rem)] py-[clamp(0.2rem,0.5vh,0.5rem)] rounded-full border text-[clamp(0.6rem,0.8vw,0.95rem)] font-bold uppercase tracking-widest ${
          locked
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {locked ? '🔒 Bloccato' : 'Auto'}
        </span>
        <span className="px-[clamp(0.5rem,0.9vw,1rem)] py-[clamp(0.2rem,0.5vh,0.5rem)] rounded-full bg-zinc-900 border border-zinc-800 text-[clamp(0.7rem,0.9vw,1.1rem)] font-bold text-zinc-400 tabular-nums">
          {index + 1} / {count}
        </span>
      </div>
    </header>
  );
}

export default function TvReview({ session }) {
  const [results, setResults] = useState([]);
  const [categoryWinners, setCategoryWinners] = useState([]);
  const [mostPolarizing, setMostPolarizing] = useState(null);
  const [showBars, setShowBars] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const locked = Boolean(session.closed_slide_locked);
  const slideCount = getReviewSlideCount(session);

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
        const distribution = [0, 0, 0, 0, 0];
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

          itemVotes.forEach(vote => {
            const catScale = session.categories.find(c => c.id === vote.category_id)?.scale === '1-5' ? 5 : 10;
            const pct = (vote.value / catScale) * 100;
            const bin = Math.min(4, Math.max(0, Math.floor(pct / 20)));
            distribution[bin] += 1;
          });
        }
        const distributionMax = Math.max(1, ...distribution);

        return {
          ...item,
          totalScore,
          catAverages,
          polarization,
          distribution,
          distributionMax,
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

  useEffect(() => {
    const requested = Math.max(0, Number(session.closed_slide) || 0);
    setSlideIndex(Math.min(requested, slideCount - 1));
  }, [session.closed_slide, slideCount]);

  useEffect(() => {
    if (locked || slideCount <= 1 || results.length === 0) return;
    const timer = setInterval(() => {
      setSlideIndex(current => (current + 1) % slideCount);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [locked, slideCount, session.closed_slide, results.length]);

  if (results.length === 0) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const deviationPages = chunkList([...results].sort((a, b) => b.polarization - a.polarization), DEVIATION_SLIDES_PER_PAGE);
  const awardPages = categoryWinners.map((categoryWinner, index) => {
    const ranking = results
      .map(item => ({
        ...item,
        categoryScore: item.catAverages[categoryWinner.category.id] || 0
      }))
      .sort((a, b) => b.categoryScore - a.categoryScore);

    return {
      categoryWinner,
      entries: ranking.slice(0, 8),
      average: ranking.length > 0
        ? ranking.reduce((sum, item) => sum + item.categoryScore, 0) / ranking.length
        : 0,
      page: index + 1,
      pages: categoryWinners.length
    };
  });
  const itemPages = chunkList(results, REVIEW_SLIDES_PER_PAGE);
  const slides = [
    { type: 'podium' },
    ...deviationPages.map((entries, index) => ({ type: 'deviation', entries, page: index + 1, pages: deviationPages.length })),
    ...awardPages.map(slide => ({ type: 'awards', ...slide })),
    ...itemPages.map((entries, index) => ({
      type: 'items',
      entries,
      page: index + 1,
      pages: itemPages.length,
      offset: index * REVIEW_SLIDES_PER_PAGE
    }))
  ];
  const safeIndex = Math.min(slideIndex, slides.length - 1);
  const podium = results.slice(0, 3);
  const mostDivisiveSigma = mostPolarizing?.polarization || 0;
  const mostDivisiveBar = Math.min(100, (mostDivisiveSigma / 50) * 100);
  const mostDivisiveLabel = sigmaLabel(mostDivisiveSigma);

  const renderPodiumSlide = () => (
    <section className="h-full shrink-0 overflow-hidden p-[clamp(1rem,2.6vw,3.5rem)] flex flex-col">
      <SlideHeader title="Serata Recap" subtitle={session.name} index={safeIndex} count={slides.length} locked={locked} />

      <div className="flex-1 min-h-0 grid grid-cols-3 gap-[clamp(0.5rem,1.4vw,1.5rem)]">
        {podium.map((item, index) => {
          const isWinner = index === 0;
          return (
            <div
              key={item.id}
              className={`min-h-0 flex flex-col rounded-[clamp(0.8rem,1.6vw,2rem)] overflow-hidden border-2 bg-zinc-900 shadow-2xl ${
                isWinner
                  ? 'border-amber-400/80 shadow-[0_0_60px_rgba(251,191,36,0.25)]'
                  : 'border-zinc-800'
              }`}
            >
              <div className="relative flex-1 min-h-0 overflow-hidden">
                {item.image_url ? (
                  <img src={mediaUrl(item.image_url)} alt={item.public_name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-[clamp(3rem,10vw,10rem)] font-black text-white/10">
                    {index + 1}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className={`absolute top-[clamp(0.4rem,0.9vw,0.9rem)] left-[clamp(0.4rem,0.9vw,0.9rem)] w-[clamp(1.8rem,3vw,3.5rem)] h-[clamp(1.8rem,3vw,3.5rem)] rounded-full flex items-center justify-center font-black text-[clamp(0.8rem,1.4vw,1.6rem)] ${
                  isWinner ? 'bg-amber-400 text-amber-950' : index === 1 ? 'bg-zinc-300 text-zinc-900' : 'bg-amber-700 text-amber-50'
                }`}>
                  {index + 1}
                </span>
              </div>
              <div className="shrink-0 p-[clamp(0.5rem,1.1vw,1.25rem)]">
                <h2 className="text-[clamp(0.95rem,1.7vw,2.25rem)] font-black leading-tight line-clamp-2">
                  {displayName(item, session)}
                </h2>
                <p className="text-[clamp(0.8rem,1.3vw,1.6rem)] font-black text-brand-400 mt-1 tabular-nums">
                  {item.totalScore.toFixed(1)} <span className="text-zinc-600 text-[0.7em]">pts</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {mostPolarizing && mostPolarizing.polarization > 0 && (
        <div className="shrink-0 mt-[clamp(0.5rem,1.4vh,1.25rem)] bg-gradient-to-r from-rose-900/40 to-orange-900/30 border border-rose-500/30 rounded-[clamp(0.7rem,1.4vw,1.5rem)] px-[clamp(0.75rem,1.5vw,1.75rem)] py-[clamp(0.4rem,1.2vh,1rem)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[clamp(0.6rem,0.8vw,0.95rem)] font-bold text-rose-300 uppercase tracking-widest">🔥 Più divisivo</p>
            <p className="text-[clamp(0.9rem,1.4vw,1.75rem)] font-black truncate">{displayName(mostPolarizing, session)}</p>
            <p className="text-[clamp(0.6rem,0.75vw,0.9rem)] text-zinc-400">σ = deviazione standard dei voti normalizzati</p>
          </div>
          <div className="shrink-0 w-[clamp(8rem,17vw,17rem)] text-right">
            <p className="text-[clamp(0.75rem,1.05vw,1.3rem)] font-black text-rose-200">{mostDivisiveLabel}</p>
            <div className="h-[clamp(0.25rem,0.5vh,0.5rem)] bg-black/40 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-1000"
                style={{ width: `${mostDivisiveBar}%` }}
              />
            </div>
            <p className="text-[clamp(0.55rem,0.7vw,0.85rem)] text-zinc-400 mt-1 tabular-nums">σ {mostDivisiveSigma.toFixed(1)} · dev. standard</p>
          </div>
        </div>
      )}
    </section>
  );

  const renderDeviationSlide = (slide) => (
    <section className="h-full shrink-0 overflow-hidden p-[clamp(1rem,2.6vw,3.5rem)] flex flex-col">
      <SlideHeader
        title="Deviazione dei voti"
        subtitle={`Pagina ${slide.page} di ${slide.pages} · σ 0–50 · le barrette mostrano la distribuzione dei voti`}
        index={safeIndex}
        count={slides.length}
        locked={locked}
      />
      <div className="flex-1 min-h-0 flex flex-col justify-center gap-[clamp(0.25rem,0.8vh,0.7rem)]">
        {slide.entries.map((item, index) => {
          const sigma = item.polarization || 0;
          const barWidth = Math.min(100, (sigma / 50) * 100);
          return (
            <div
              key={item.id}
              className="flex-1 max-h-[clamp(4rem,13vh,10rem)] min-h-0 flex items-center gap-[clamp(0.5rem,1.2vw,1.5rem)] bg-zinc-900 border border-zinc-800 rounded-[clamp(0.6rem,1.2vw,1.4rem)] px-[clamp(0.5rem,1.2vw,1.25rem)] py-[clamp(0.2rem,0.5vh,0.5rem)] overflow-hidden animate-in fade-in duration-700 fill-mode-both"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="w-[clamp(5rem,15vw,17rem)] shrink-0 min-w-0">
                <p className="font-black truncate text-[clamp(0.75rem,1.2vw,1.55rem)] leading-tight">
                  {displayName(item, session)}
                </p>
                <p className="text-zinc-500 text-[clamp(0.5rem,0.7vw,0.9rem)]">
                  {item.voteCount} {item.voteCount === 1 ? 'voto' : 'voti'}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="h-[clamp(0.5rem,1.3vh,1.1rem)] bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-[1200ms] ease-out"
                    style={{ width: `${showBars ? barWidth : 0}%` }}
                  />
                </div>
              </div>

              <div className="w-[clamp(6rem,11vw,13rem)] shrink-0 text-right">
                <p className="font-black tabular-nums text-[clamp(0.85rem,1.4vw,1.8rem)] leading-tight">σ {sigma.toFixed(1)}</p>
                <p className={`text-[clamp(0.5rem,0.72vw,0.9rem)] font-bold ${sigmaColor(sigma)}`}>{sigmaLabel(sigma)}</p>
              </div>

              <div
                className="w-[clamp(4rem,9vw,11rem)] h-[clamp(1.5rem,4.5vh,3rem)] shrink-0 flex items-end gap-[clamp(1px,0.2vw,3px)]"
                title="Distribuzione dei voti normalizzati"
              >
                {item.distribution.map((count, bin) => (
                  <div
                    key={bin}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-rose-500/40 to-rose-400/90"
                    style={{ height: `${Math.max(4, (count / item.distributionMax) * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderAwardsSlide = (slide) => {
    const category = slide.categoryWinner.category;
    const max = category.scale === '1-5' ? 5 : 10;
    const winner = slide.entries[0];
    const second = slide.entries[1];
    const gap = winner && second ? winner.categoryScore - second.categoryScore : 0;

    return (
      <section className="h-full shrink-0 overflow-hidden p-[clamp(1rem,2.6vw,3.5rem)] flex flex-col">
        <SlideHeader
          title={category.name}
          subtitle={`Premio categoria · Pagina ${slide.page} di ${slide.pages}`}
          index={safeIndex}
          count={slides.length}
          locked={locked}
        />

        <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)] gap-[clamp(0.6rem,1.6vw,1.5rem)]">
          {/* Category winner */}
          <div className="relative min-h-0 overflow-hidden rounded-[clamp(0.8rem,1.6vw,2rem)] border-2 border-amber-400/70 bg-zinc-900 shadow-[0_0_60px_rgba(251,191,36,0.18)]">
            {winner?.image_url ? (
              <img
                src={mediaUrl(winner.image_url)}
                alt={winner.public_name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.16),rgba(9,9,11,1))] flex items-center justify-center">
                <span className="text-[clamp(3rem,10vw,10rem)] opacity-20">🏆</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
            <span className="absolute top-[clamp(0.5rem,1.2vw,1rem)] left-[clamp(0.5rem,1.2vw,1rem)] bg-amber-400 text-amber-950 px-[clamp(0.5rem,1vw,0.9rem)] py-[clamp(0.15rem,0.4vh,0.35rem)] rounded-full text-[clamp(0.55rem,0.75vw,0.9rem)] font-black uppercase tracking-widest">
              🏆 Vincitore
            </span>
            <div className="absolute inset-x-0 bottom-0 p-[clamp(0.6rem,1.4vw,1.4rem)]">
              <p className="text-[clamp(0.55rem,0.75vw,0.9rem)] font-bold uppercase tracking-widest text-amber-300 truncate">
                Miglior {category.name}
              </p>
              <h2 className="text-[clamp(1.2rem,2.4vw,3rem)] font-black leading-tight line-clamp-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                {displayName(winner, session)}
              </h2>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[clamp(2rem,4.5vw,5rem)] font-black tabular-nums leading-none">
                  {winner?.categoryScore.toFixed(1)}
                </span>
                <span className="text-[clamp(0.8rem,1.2vw,1.5rem)] text-zinc-400 font-bold">/ {max}</span>
              </div>
              <p className="text-[clamp(0.55rem,0.75vw,0.9rem)] text-zinc-400 mt-1">
                {winner?.voteCount || 0} votanti
              </p>
            </div>
          </div>

          {/* Category ranking + stats */}
          <div className="min-h-0 flex flex-col gap-[clamp(0.35rem,1vh,0.75rem)]">
            <div className="shrink-0 flex items-center justify-between gap-2">
              <h3 className="text-[clamp(0.7rem,1vw,1.25rem)] font-bold uppercase tracking-widest text-zinc-400">
                Classifica categoria
              </h3>
              <span className="text-[clamp(0.55rem,0.75vw,0.9rem)] text-zinc-500 font-semibold">
                scala 1–{max}
              </span>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-[clamp(0.25rem,0.7vh,0.5rem)]">
              {slide.entries.map((entry, index) => {
                const pct = (entry.categoryScore / max) * 100;
                const isWinner = index === 0;
                return (
                  <div
                    key={entry.id}
                    className={`flex-1 min-h-0 flex items-center gap-[clamp(0.4rem,0.9vw,1rem)] rounded-[clamp(0.6rem,1.2vw,1.3rem)] border px-[clamp(0.45rem,0.9vw,0.9rem)] py-[clamp(0.2rem,0.5vh,0.45rem)] overflow-hidden animate-in fade-in duration-700 fill-mode-both ${
                      isWinner ? 'bg-amber-500/10 border-amber-500/40' : 'bg-zinc-900 border-zinc-800'
                    }`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <span className={`shrink-0 w-[clamp(1.5rem,2.4vw,2.6rem)] h-[clamp(1.5rem,2.4vw,2.6rem)] rounded-lg flex items-center justify-center font-black text-[clamp(0.65rem,0.95vw,1.1rem)] tabular-nums ${
                      isWinner ? 'bg-amber-400 text-amber-950' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {index + 1}
                    </span>

                    {entry.image_url && (
                      <img
                        src={mediaUrl(entry.image_url)}
                        alt={entry.public_name}
                        className="w-[clamp(2.2rem,4.2vw,4.5rem)] h-[clamp(2.2rem,4.2vw,4.5rem)] rounded-[clamp(0.4rem,0.8vw,0.8rem)] object-cover border border-white/10 shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-black text-[clamp(0.75rem,1.2vw,1.55rem)] leading-tight">
                          {displayName(entry, session)}
                        </p>
                        <p className="shrink-0 font-black text-[clamp(0.8rem,1.25vw,1.6rem)] tabular-nums" style={{ color: `hsl(${pct * 1.2}, 85%, 60%)` }}>
                          {entry.categoryScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="h-[clamp(0.35rem,0.9vh,0.7rem)] bg-zinc-950 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                          style={{
                            width: showBars ? `${pct}%` : '0%',
                            backgroundColor: `hsl(${pct * 1.2}, 85%, 50%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 grid grid-cols-3 gap-[clamp(0.35rem,0.8vw,0.75rem)]">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[clamp(0.5rem,1vw,0.9rem)] px-[clamp(0.45rem,0.9vw,0.9rem)] py-[clamp(0.3rem,0.8vh,0.6rem)]">
                <p className="text-[clamp(0.45rem,0.62vw,0.75rem)] uppercase tracking-widest font-bold text-zinc-500">Media</p>
                <p className="font-black text-[clamp(0.95rem,1.6vw,1.9rem)] tabular-nums leading-tight">{slide.average.toFixed(1)}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[clamp(0.5rem,1vw,0.9rem)] px-[clamp(0.45rem,0.9vw,0.9rem)] py-[clamp(0.3rem,0.8vh,0.6rem)]">
                <p className="text-[clamp(0.45rem,0.62vw,0.75rem)] uppercase tracking-widest font-bold text-zinc-500">Distacco 2°</p>
                <p className="font-black text-[clamp(0.95rem,1.6vw,1.9rem)] tabular-nums leading-tight">
                  {second ? gap.toFixed(1) : '—'}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[clamp(0.5rem,1vw,0.9rem)] px-[clamp(0.45rem,0.9vw,0.9rem)] py-[clamp(0.3rem,0.8vh,0.6rem)]">
                <p className="text-[clamp(0.45rem,0.62vw,0.75rem)] uppercase tracking-widest font-bold text-zinc-500">Votanti</p>
                <p className="font-black text-[clamp(0.95rem,1.6vw,1.9rem)] tabular-nums leading-tight">{winner?.voteCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderItemsSlide = (slide) => {
    const count = slide.entries.length;
    const gridClass = count === 1
      ? 'grid-cols-1 grid-rows-1'
      : count === 2
        ? 'grid-cols-2 grid-rows-1'
        : count <= 4
          ? 'grid-cols-2 grid-rows-2'
          : 'grid-cols-3 grid-rows-2';

    return (
      <section className="h-full shrink-0 overflow-hidden p-[clamp(1rem,2.6vw,3.5rem)] flex flex-col">
        <SlideHeader
          title="Classifica"
          subtitle={`Pagina ${slide.page} di ${slide.pages}`}
          index={safeIndex}
          count={slides.length}
          locked={locked}
        />
        <div className={`flex-1 min-h-0 grid ${gridClass} gap-[clamp(0.5rem,1.2vw,1.25rem)]`}>
          {slide.entries.map((item, index) => {
            const rank = slide.offset + index + 1;
            return (
              <div
                key={item.id}
                className="relative min-h-0 overflow-hidden bg-zinc-900 border border-zinc-800 rounded-[clamp(0.7rem,1.4vw,1.6rem)] flex flex-col animate-in fade-in duration-700 fill-mode-both"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="relative flex-1 min-h-0 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={mediaUrl(item.image_url)}
                      alt={item.public_name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(170,59,255,0.16),rgba(9,9,11,1))] flex items-center justify-center">
                      <span className="text-[clamp(3rem,10vw,10rem)] font-black text-white/[0.06] tabular-nums">#{rank}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <span className="absolute top-[clamp(0.35rem,0.8vw,0.75rem)] left-[clamp(0.35rem,0.8vw,0.75rem)] min-w-[clamp(1.6rem,2.6vw,2.8rem)] h-[clamp(1.6rem,2.6vw,2.8rem)] px-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-black text-[clamp(0.65rem,1vw,1.15rem)] tabular-nums">
                    #{rank}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-[clamp(0.5rem,1.1vw,1.1rem)]">
                    <h2 className="text-[clamp(0.9rem,1.6vw,2rem)] font-black leading-tight line-clamp-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                      {displayName(item, session)}
                    </h2>
                  </div>
                </div>

                <div className="shrink-0 bg-zinc-950/70 border-t border-white/10 p-[clamp(0.5rem,1.1vw,1.1rem)] flex flex-col gap-[clamp(0.25rem,0.7vh,0.55rem)]">
                  <div className="flex gap-1 h-[clamp(0.4rem,1.1vh,0.8rem)] rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 p-[1px] shrink-0">
                    {session.categories.map(cat => {
                      const max = cat.scale === '1-5' ? 5 : 10;
                      const pct = ((item.catAverages[cat.id] || 0) / max) * 100;
                      return (
                        <div
                          key={cat.id}
                          style={{
                            width: showBars ? `${pct}%` : '0%',
                            transitionDelay: `${(index * 120) + 300}ms`,
                            backgroundColor: `hsl(${pct * 1.2}, 85%, 50%)`
                          }}
                          className="transition-all duration-[1200ms] ease-out h-full rounded-full"
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-end gap-[clamp(0.5rem,1vw,1rem)] min-h-0 overflow-hidden">
                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-[clamp(0.4rem,0.9vw,1rem)] gap-y-0.5">
                      {session.categories.map(cat => {
                        const pct = ((item.catAverages[cat.id] || 0) / (cat.scale === '1-5' ? 5 : 10)) * 100;
                        return (
                          <div key={cat.id} className="flex items-baseline justify-between gap-1 min-w-0">
                            <span className="text-zinc-500 uppercase font-bold tracking-widest text-[clamp(0.45rem,0.62vw,0.78rem)] truncate">{cat.name}</span>
                            <span className="font-bold text-[clamp(0.65rem,0.95vw,1.15rem)] tabular-nums shrink-0" style={{ color: `hsl(${pct * 1.2}, 85%, 60%)` }}>
                              {(item.catAverages[cat.id] || 0).toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="shrink-0 flex flex-col items-end bg-zinc-900 rounded-lg border border-zinc-800/80 px-[clamp(0.45rem,0.9vw,0.9rem)] py-[clamp(0.15rem,0.4vh,0.4rem)]">
                      <span className="text-brand-500 uppercase font-bold tracking-widest text-[clamp(0.4rem,0.58vw,0.72rem)]">Totale</span>
                      <span className="font-black text-[clamp(0.9rem,1.5vw,1.7rem)] tabular-nums leading-none">{item.totalScore.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-white">
      <div className="h-full overflow-hidden">
        <div
          className="flex flex-col h-full transition-transform duration-[900ms] ease-in-out will-change-transform"
          style={{ transform: `translateY(-${safeIndex * 100}%)` }}
        >
          {slides.map(slide => (
            <div key={`${slide.type}-${slide.page || 0}`} className="h-full shrink-0 overflow-hidden">
              {slide.type === 'podium' && renderPodiumSlide()}
              {slide.type === 'deviation' && renderDeviationSlide(slide)}
              {slide.type === 'awards' && renderAwardsSlide(slide)}
              {slide.type === 'items' && renderItemsSlide(slide)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
