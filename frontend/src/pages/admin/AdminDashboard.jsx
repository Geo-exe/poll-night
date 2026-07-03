import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessions, deleteSession } from '../../api';
import { Plus, Calendar, Settings2, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions().then(setSessions);
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (confirm('Are you sure you want to completely delete this session?')) {
      await deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Control Center</h1>
            <p className="text-zinc-500 mt-2">Manage your voting sessions</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { localStorage.removeItem('pollnight_token'); window.location.href = '/admin'; }}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-4 py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors font-medium"
            >
              Logout
            </button>
            <Link to="/admin/create" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 font-medium">
              <Plus size={20} />
              New Session
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.filter(s => s.status !== 'archived').map(session => (
            <Link key={session.id} to={`/admin/session/${session.id}`} className="group relative bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-brand-500/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400">
                    <Settings2 size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                      session.status === 'setup' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      session.status === 'voting' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {session.status}
                    </span>
                    <button onClick={(e) => handleDelete(e, session.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer relative z-10">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">{session.name}</h2>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Calendar size={16} />
                  {session.date}
                </div>
              </div>
            </Link>
          ))}
          {sessions.length === 0 && (
            <div className="col-span-full py-20 text-center text-zinc-500 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
              No sessions yet. Create one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
