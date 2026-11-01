import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSessions, deleteSession, updateSessionStatus } from '../../api';
import { Plus, Calendar, Settings2, Trash2, Pencil, RotateCcw, Archive } from 'lucide-react';

function SessionCard({ session, archived, onDelete, onEdit, onReactivate }) {
  return (
    <Link
      to={`/admin/session/${session.id}`}
      className={`group relative p-6 rounded-2xl border shadow-sm hover:shadow-xl transition-all ${
        archived
          ? 'bg-zinc-100/60 dark:bg-zinc-900/50 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-amber-500/50'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-brand-500/50'
      }`}
    >
      <div className={`absolute inset-0 rounded-2xl transition-opacity ${
        archived
          ? 'bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100'
          : 'bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100'
      }`} />
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${archived ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
            {archived ? <Archive size={24} /> : <Settings2 size={24} />}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
              session.status === 'setup' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              session.status === 'voting' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              session.status === 'archived' ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' :
              'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {session.status}
            </span>
            {archived ? (
              <button
                onClick={(e) => onReactivate(e, session.id)}
                className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer relative z-10"
                title="Reactivate session"
              >
                <RotateCcw size={16} />
              </button>
            ) : ['setup', 'joining'].includes(session.status) && (
              <button
                onClick={(e) => onEdit(e, session.id)}
                className="p-2 text-zinc-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-lg transition-colors cursor-pointer relative z-10"
                title="Edit session"
              >
                <Pencil size={16} />
              </button>
            )}
            <button
              onClick={(e) => onDelete(e, session.id)}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer relative z-10"
              title="Delete session"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">{session.name}</h2>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Calendar size={16} />
          {session.date}
        </div>
        {archived && (
          <p className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Archive size={14} /> Sola lettura · puoi consultare recap e podio
          </p>
        )}
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions().then(setSessions);
  }, []);

  const activeSessions = sessions.filter(session => session.status !== 'archived');
  const archivedSessions = sessions.filter(session => session.status === 'archived');

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to completely delete this session?')) {
      await deleteSession(id);
      setSessions(current => current.filter(session => session.id !== id));
    }
  };

  const handleEdit = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/admin/session/${id}/edit`);
  };

  const handleReactivate = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Riaprire questa sessione? Tornerà tra le sessioni attive nello stato "closed".')) return;
    await updateSessionStatus(id, 'closed');
    setSessions(current => current.map(session => (
      session.id === id ? { ...session, status: 'closed' } : session
    )));
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
          {activeSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              archived={false}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReactivate={handleReactivate}
            />
          ))}
          {sessions.length === 0 && (
            <div className="col-span-full py-20 text-center text-zinc-500 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
              No sessions yet. Create one to get started!
            </div>
          )}
          {sessions.length > 0 && activeSessions.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
              No active sessions. Check the archive below.
            </div>
          )}
        </div>

        {archivedSessions.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Archive size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Archived Sessions</h2>
                <p className="text-sm text-zinc-500">Sessions are kept here after “End Event”. You can reopen them or inspect their recap.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedSessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  archived
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onReactivate={handleReactivate}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
