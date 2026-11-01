import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { fetchSessionDetails, updateSession } from '../../api';
import SessionForm from '../../components/SessionForm';

export default function SessionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessionDetails(id)
      .then(setSession)
      .catch(() => setError('Session not found'));
  }, [id]);

  const handleSubmit = async (data) => {
    await updateSession(id, data);
    navigate(`/admin/session/${id}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">{error}</h1>
        <Link to="/admin" className="text-brand-400 hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  if (!session) {
    return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading session...</div>;
  }

  const isEditable = ['setup', 'joining'].includes(session.status);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/admin/session/${id}`} className="p-3 bg-white dark:bg-zinc-900 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm border border-zinc-200 dark:border-zinc-800">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Session</h1>
              <p className="text-zinc-500 mt-1">{session.name}</p>
            </div>
          </div>
        </header>

        {isEditable ? (
          <SessionForm
            initialData={session}
            submitLabel="Save Changes"
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
              <Lock size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Editing is locked</h2>
            <p className="text-zinc-500 leading-relaxed">
              A session can only be edited before voting starts. Once votes exist, changing products or categories would invalidate them.
            </p>
            <Link to={`/admin/session/${id}`} className="inline-block mt-8 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-bold transition-colors">
              Back to session
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
