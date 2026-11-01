import { useNavigate, Link } from 'react-router-dom';
import { createSession } from '../../api';
import { ArrowLeft } from 'lucide-react';
import SessionForm from '../../components/SessionForm';

export default function SessionCreate() {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    const session = await createSession(data);
    if (!session?.id) throw new Error(session?.error || 'Failed to create session');
    navigate(`/admin/session/${session.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-3 bg-white dark:bg-zinc-900 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm border border-zinc-200 dark:border-zinc-800">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold">Create New Session</h1>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('pollnight_token'); window.location.href = '/admin'; }}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </header>

        <SessionForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
