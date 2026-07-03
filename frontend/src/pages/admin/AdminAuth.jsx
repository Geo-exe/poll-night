import { useState } from 'react';
import { loginAdmin } from '../../api';

export default function AdminAuth({ children }) {
  const [auth, setAuth] = useState(!!localStorage.getItem('pollnight_token'));
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const token = await loginAdmin(pass);
      localStorage.setItem('pollnight_token', token);
      setAuth(true);
      setError('');
    } catch (err) {
      setError('Incorrect Password');
    }
  };

  if (auth) return children;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
      <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-3xl max-w-sm w-full border border-zinc-800 text-center shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
        <p className="text-zinc-500 mb-6 text-sm">Please authenticate with the server</p>
        
        {error && <p className="text-red-500 bg-red-500/10 border border-red-500/20 py-2 rounded-xl mb-4 font-semibold">{error}</p>}
        
        <input 
          type="password" 
          value={pass} 
          onChange={e => setPass(e.target.value)} 
          placeholder="Password"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-4 text-white focus:outline-none focus:border-brand-500" 
          autoFocus 
        />
        <button type="submit" className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-colors">
          Login
        </button>
      </form>
    </div>
  );
}
