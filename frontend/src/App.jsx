import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import SessionCreate from './pages/admin/SessionCreate.jsx';
import SessionLive from './pages/admin/SessionLive.jsx';
import AdminAuth from './pages/admin/AdminAuth.jsx';
import MobileSession from './pages/mobile/MobileSession.jsx';
import TvDisplay from './pages/tv/TvDisplay.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminAuth><AdminDashboard /></AdminAuth>} />
        <Route path="/admin/create" element={<AdminAuth><SessionCreate /></AdminAuth>} />
        <Route path="/admin/session/:id" element={<AdminAuth><SessionLive /></AdminAuth>} />
        <Route path="/join" element={<MobileSession />} />
        <Route path="/join/:id" element={<MobileSession />} />
        <Route path="/tv" element={<TvDisplay />} />
        <Route path="/tv/:id" element={<TvDisplay />} />

        <Route path="/" element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(170,59,255,0.05),transparent_70%)]" />
            <h1 className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-fuchsia-500 mb-12 tracking-tighter relative z-10 drop-shadow-[0_0_40px_rgba(170,59,255,0.3)]">
              Poll Night
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl px-6 relative z-10">
              <Link to="/admin" className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-8 py-8 rounded-[2rem] bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:border-brand-500/50 hover:bg-brand-500/10 transition-all group shadow-xl">
                <span className="text-2xl font-bold text-white group-hover:text-brand-400 transition-colors">Admin Panel</span>
                <span className="text-sm text-zinc-500 font-medium group-hover:text-brand-400/80 transition-colors">Manage the event</span>
              </Link>
              <Link to="/tv" className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-8 py-8 rounded-[2rem] bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group shadow-xl">
                <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">TV Display</span>
                <span className="text-sm text-zinc-500 font-medium group-hover:text-emerald-400/80 transition-colors">Live big screen</span>
              </Link>
              <Link to="/join" className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-8 py-8 rounded-[2rem] bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all group shadow-xl">
                <span className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">Mobile App</span>
                <span className="text-sm text-zinc-500 font-medium group-hover:text-amber-400/80 transition-colors">Join and vote</span>
              </Link>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
