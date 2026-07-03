import { useState, useEffect } from 'react';
import { submitVotes, fetchParticipantVotes } from '../../api';
import { CheckCircle2, ChevronRight, Lock, MessageCircle } from 'lucide-react';
import MobileChat from './MobileChat';

export default function VotingFlow({ session, participant, socket }) {
  const activeItem = session.items.find(i => i.voting_status === 'open');
  const [votes, setVotes] = useState({});
  const [submittedFor, setSubmittedFor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [lockedPhase, setLockedPhase] = useState(null);

  const currentPhaseKey = activeItem ? `${activeItem.id}-${activeItem.active_category_id || 'all'}` : null;
  const [initialPhase] = useState(currentPhaseKey);
  const [initialVoted] = useState(participant.has_voted_active_item);
  
  const isLocked = lockedPhase === currentPhaseKey || (currentPhaseKey === initialPhase && initialVoted);

  useEffect(() => {
    if (activeItem && submittedFor !== currentPhaseKey) {
      if (isLocked) {
        fetchParticipantVotes(session.id, participant.id).then(fetchedVotes => {
          const itemVotes = fetchedVotes.filter(v => v.item_id === activeItem.id);
          const initial = {};
          session.categories.forEach(c => {
            const v = itemVotes.find(iv => iv.category_id === c.id);
            initial[c.id] = v ? v.value : (c.scale === '1-5' ? 3 : 5);
          });
          setVotes(initial);
        }).catch(err => console.error('Failed to fetch old votes:', err));
      } else {
        const initial = {};
        session.categories.forEach(c => {
          initial[c.id] = c.scale === '1-5' ? 3 : 5; 
        });
        setVotes(initial);
      }
    }
  }, [activeItem, session.categories, submittedFor, isLocked, currentPhaseKey, session.id, participant.id]);

  const handleVoteChange = (catId, val) => {
    setVotes(prev => ({ ...prev, [catId]: parseInt(val) }));
  };

  const categoriesToShow = session.category_mode === 'single' && activeItem?.active_category_id
    ? session.categories.filter(c => c.id === activeItem.active_category_id)
    : session.categories;

  const executeSubmit = async () => {
    setIsSubmitting(true);
    setConfirmDialog(null);
    try {
      const votesArray = categoriesToShow.map(cat => ({ category_id: cat.id, value: votes[cat.id] }));
      await submitVotes({
        participant_id: participant.id,
        item_id: activeItem.id,
        votes: votesArray
      });
      setSubmittedFor(currentPhaseKey);
      setLockedPhase(currentPhaseKey);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setConfirmDialog({ type: 'error', message: 'Failed to submit: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!activeItem || isLocked) return;
    setConfirmDialog({ type: 'confirm', message: 'Are you sure you want to lock in these votes?' });
  };

  if (session.status === 'setup' || session.status === 'joining') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-zinc-800 shadow-2xl max-w-sm w-full relative z-10 animate-in zoom-in-95 duration-500">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="text-white w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            You're in, {participant.username}!
          </h2>
          <p className="text-zinc-400 font-medium text-lg leading-relaxed">
            Grab a glass and wait for the host to start the event.
          </p>
        </div>
      </div>
    );
  }

  if (session.status === 'closed') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(170,59,255,0.15),transparent_50%)]" />
        <div className="relative z-10 animate-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-5xl font-black text-brand-500 mb-4 drop-shadow-[0_0_20px_rgba(170,59,255,0.4)]">Finished!</h2>
          <p className="text-zinc-400 text-xl font-medium">Look at the TV for the final results.</p>
        </div>
      </div>
    );
  }

  // Check if session is closed
  // Only lock if there is no active item
  if (!activeItem) {
    const completedItem = [...session.items].reverse().find(i => i.voting_status === 'closed' && (i.vote_count > 0 || Boolean(i.revealed)));
    
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(170,59,255,0.15),transparent_50%)]" />
        <div className="bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-zinc-800 shadow-2xl max-w-sm w-full relative z-10 animate-in zoom-in-95 duration-500">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(170,59,255,0.4)]">
              <CheckCircle2 className="text-white w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            {completedItem ? 'Voting Completed!' : 'Get Ready!'}
          </h2>
          <p className="text-zinc-400 font-medium text-lg leading-relaxed">
            {completedItem ? `You've locked in your votes for ${completedItem.public_name}. ` : ''}
            Hang tight while the host prepares the next product!
          </p>
        </div>
      </div>
    );
  }

  // Continue with voting UI
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      <header className="bg-zinc-900/90 backdrop-blur-xl sticky top-0 z-10 border-b border-zinc-800 p-6 pt-12 shadow-sm">
        <p className="text-brand-500 font-bold uppercase tracking-widest text-xs mb-1">Now Tasting</p>
        <h1 className="text-3xl font-bold">{activeItem.public_name}</h1>
      </header>
      
      <div className="p-6 space-y-8 mt-2">
        {categoriesToShow.map(cat => {
          const max = cat.scale === '1-5' ? 5 : 10;
          return (
            <div key={cat.id} className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 shadow-lg relative overflow-hidden animate-in slide-in-from-right-4 duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-fuchsia-500" />
              <div className="flex justify-between items-end mb-8">
                <h3 className="text-2xl font-semibold">{cat.name}</h3>
                <span className="text-4xl font-black text-brand-500 tracking-tighter">{votes[cat.id] || 1}<span className="text-zinc-600 text-xl font-semibold tracking-normal">/{max}</span></span>
              </div>
              <input 
                type="range" 
                min="1" 
                max={max} 
                step="1"
                value={votes[cat.id] || 1}
                onChange={(e) => {
                  if (!isLocked) handleVoteChange(cat.id, e.target.value);
                }}
                disabled={isLocked}
                className={`w-full h-4 bg-zinc-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-12 [&::-webkit-slider-thumb]:h-12 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[4px] [&::-webkit-slider-thumb]:border-zinc-900 transition-all ${
                  isLocked 
                    ? '[&::-webkit-slider-thumb]:bg-zinc-500 opacity-50 cursor-not-allowed'
                    : '[&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(170,59,255,0.6)] accent-brand-500'
                }`}
              />
              <div className="flex justify-between text-zinc-500 text-sm mt-5 font-bold px-2">
                <span>1</span>
                <span>{max}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-12">
        {!isLocked ? (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || justSaved || isLocked}
            className={`w-full flex items-center justify-center gap-2 text-white px-6 py-5 rounded-[2rem] font-bold text-xl transition-all ${
              justSaved || isLocked
                ? 'bg-zinc-800 text-zinc-500'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            } active:scale-95 disabled:opacity-100`}
          >
            {isSubmitting ? 'Submitting...' : (justSaved ? 'Saved!' : 'Confirm Vote')} 
            {!isSubmitting && !justSaved && <ChevronRight size={24} />}
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 text-emerald-500 px-6 py-2 font-bold text-lg mb-2">
            <Lock size={16} /> Votes Locked! Waiting for others...
          </div>
        )}
      </div>

      {isLocked && <MobileChat session={session} participant={participant} socket={socket} />}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold mb-4">{confirmDialog.type === 'error' ? 'Oops!' : 'Lock Votes?'}</h3>
            <p className="text-zinc-400 mb-8 font-medium leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-4">
              {confirmDialog.type === 'confirm' && (
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-4 rounded-xl font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={confirmDialog.type === 'error' ? () => setConfirmDialog(null) : executeSubmit}
                className={`flex-1 py-4 rounded-xl font-bold text-white transition-colors ${
                  confirmDialog.type === 'error' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                }`}
              >
                {confirmDialog.type === 'error' ? 'Dismiss' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
