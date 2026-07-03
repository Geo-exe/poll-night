import { QRCodeSVG } from 'qrcode.react';

export default function TvJoining({ session, participants = [] }) {
  const joinUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/join`;
  
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-12 text-white">
      <div className="flex gap-20 items-center max-w-[1600px] w-full">
        <div className="flex-1">
          <h1 className="text-[6rem] font-black leading-tight mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500 drop-shadow-lg">
            {session.name}
          </h1>
          
          {session.status === 'joining' ? (
            <>
              <p className="text-4xl text-zinc-400 font-medium mb-16 leading-normal">Scan the QR code to join the tasting session</p>
              <div>
                <h2 className="text-3xl font-bold mb-8 text-zinc-300 flex items-center gap-4">
                  <span className="bg-brand-500/20 text-brand-400 px-4 py-2 rounded-xl border border-brand-500/30">{participants.length}</span>
                  Voters in Waiting Room
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {participants.map(p => (
                    <div key={p.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-[2rem] flex items-center justify-between gap-5 animate-in zoom-in duration-500 shadow-xl">
                      <div className="flex items-center gap-5 overflow-hidden">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-600 p-[2px] shrink-0">
                          <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center text-3xl shadow-inner overflow-hidden">
                            {p.avatar?.startsWith('data:image') ? (
                              <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" />
                            ) : (
                              p.avatar || '👤'
                            )}
                          </div>
                        </div>
                        <span className="text-2xl font-semibold truncate text-zinc-100">
                          {p.username}
                        </span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full shrink-0 mr-4 ${p.connected ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-red-500/50'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-4xl text-zinc-600 font-medium mt-12 leading-normal animate-pulse">
              The host is preparing the event...
            </p>
          )}
        </div>
        
        {session.status === 'joining' && (
          <div className="bg-white p-10 rounded-[3rem] shadow-[0_0_120px_rgba(170,59,255,0.4)] shrink-0 animate-in zoom-in duration-700">
            <QRCodeSVG value={joinUrl} size={450} />
          </div>
        )}
      </div>
    </div>
  );
}
