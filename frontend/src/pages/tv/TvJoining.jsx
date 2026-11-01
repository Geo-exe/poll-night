import { QRCodeSVG } from 'qrcode.react';
import { isImageSource, mediaUrl } from '../../utils/media';

export default function TvJoining({ session, participants = [] }) {
  const joinUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/join`;
  const joinRows = Math.max(1, Math.ceil(participants.length / 3));
  const joinAvatar = `min(clamp(1.5rem, 4.2vw, 6rem), calc((44vh / ${joinRows}) * 0.55))`;
  
  return (
    <div className="h-screen overflow-hidden bg-zinc-950 flex items-center justify-center p-[clamp(1rem,3vw,3rem)] text-white">
      <div className="flex gap-[clamp(1.5rem,4vw,5rem)] items-center max-w-[1600px] w-full h-full max-h-full">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="text-[clamp(2.4rem,5.5vw,6rem)] font-black leading-tight mb-[clamp(0.75rem,2vh,1.5rem)] tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500 drop-shadow-lg break-words">
            {session.name}
          </h1>
          
          {session.status === 'joining' ? (
            <>
              <p className="text-[clamp(1.1rem,2.2vw,2.5rem)] text-zinc-400 font-medium mb-[clamp(1rem,4vh,4rem)] leading-normal">Scan the QR code to join the tasting session</p>
              <div>
                <h2 className="text-[clamp(1rem,1.8vw,1.9rem)] font-bold mb-[clamp(0.75rem,2vh,2rem)] text-zinc-300 flex items-center gap-[clamp(0.6rem,1.2vw,1rem)]">
                  <span className="bg-brand-500/20 text-brand-400 px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.25rem,0.5vh,0.5rem)] rounded-xl border border-brand-500/30">{participants.length}</span>
                  Voters in Waiting Room
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-[clamp(0.35rem,0.8vw,1.25rem)] overflow-hidden" style={{ '--join-avatar': joinAvatar }}>
                  {participants.map(p => (
                    <div key={p.id} className="bg-zinc-900/80 border border-zinc-800 p-[clamp(0.25rem,0.6vw,0.75rem)] rounded-[clamp(0.7rem,1.6vw,1.75rem)] flex items-center justify-between gap-[clamp(0.3rem,0.8vw,1rem)] animate-in zoom-in duration-500 shadow-xl shrink-0">
                      <div className="flex items-center gap-[clamp(0.3rem,0.8vw,1rem)] overflow-hidden min-w-0">
                        <div
                          className="rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-600 p-[2px] shrink-0"
                          style={{ width: 'var(--join-avatar)', height: 'var(--join-avatar)' }}
                        >
                          <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center shadow-inner overflow-hidden" style={{ fontSize: 'calc(var(--join-avatar) * 0.5)' }}>
                            {isImageSource(p.avatar) ? (
                              <img src={mediaUrl(p.avatar)} alt={p.username} className="w-full h-full object-cover" />
                            ) : (
                              p.avatar || '👤'
                            )}
                          </div>
                        </div>
                        <span
                          className="font-semibold truncate text-zinc-100"
                          style={{ fontSize: 'min(clamp(0.8rem, 1.6vw, 2rem), calc(var(--join-avatar) * 0.5))' }}
                        >
                          {p.username}
                        </span>
                      </div>
                      <div className={`w-[clamp(0.4rem,0.7vw,0.75rem)] h-[clamp(0.4rem,0.7vw,0.75rem)] rounded-full shrink-0 ${p.connected ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-red-500/50'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-[clamp(1.1rem,2.2vw,2.5rem)] text-zinc-600 font-medium mt-[clamp(0.75rem,2vh,2rem)] leading-normal animate-pulse">
              The host is preparing the event...
            </p>
          )}
        </div>
        
        {session.status === 'joining' && (
          <div className="bg-white p-[clamp(0.75rem,2vw,2.5rem)] rounded-[clamp(1.25rem,3vw,3rem)] shadow-[0_0_120px_rgba(170,59,255,0.4)] shrink-0 animate-in zoom-in duration-700">
            <QRCodeSVG value={joinUrl} size={450} className="w-[clamp(150px,26vw,450px)] h-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
