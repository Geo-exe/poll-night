import { useState, useRef } from 'react';
import { joinSession, uploadImage } from '../../api';
import { Sparkles, Camera, Loader2 } from 'lucide-react';
import { resizeImageFile } from '../../utils/image';
import { mediaUrl } from '../../utils/media';

export default function JoinFlow({ session, onJoin }) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setAvatarUploading(true);
    try {
      const avatarDataUrl = await resizeImageFile(file, { size: 200, quality: 0.8, square: true });
      setAvatar(avatarDataUrl);
      const uploadedUrl = await uploadImage(avatarDataUrl, 'avatar');
      setAvatar(uploadedUrl);
    } catch (err) {
      setAvatar('');
      setError(`Photo upload failed: ${err.message}`);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || avatarUploading) return;
    if (avatar.startsWith('data:image')) {
      setError('Wait for the photo upload to finish.');
      return;
    }
    
    try {
      const data = await joinSession(session.id, username.trim(), avatar);
      onJoin({ id: data.id, username: username.trim(), avatar, code: data.reconnection_code });
    } catch (err) {
      setError(JSON.parse(err.message).error || 'Failed to join');
    }
  };

  if (session.status === 'setup' || session.status === 'closed') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="bg-zinc-900 p-8 rounded-3xl max-w-sm w-full border border-zinc-800">
          <h2 className="text-2xl font-bold mb-4">
            {session.status === 'setup' ? 'Event not started' : 'Event Finished'}
          </h2>
          <p className="text-zinc-400">
            {session.status === 'setup' ? 'The waiting room is not open yet. Please wait for the host.' : 'The event has already ended.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-fuchsia-500 mb-3 tracking-tight">
            {session.name}
          </h1>
          <p className="text-zinc-400">Join the tasting event</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 shadow-2xl">
          
          <div className="mb-8 flex flex-col items-center">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden" 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className={`relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center transition-all shadow-xl group ${
                avatar ? 'ring-4 ring-brand-500' : 'bg-zinc-800 ring-2 ring-zinc-700 hover:ring-brand-500'
              }`}
            >
              {avatar ? (
                <>
                  <img src={mediaUrl(avatar)} alt="Avatar" className="w-full h-full object-cover" />
                  {avatarUploading ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="text-white w-8 h-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center text-zinc-400 group-hover:text-brand-400 transition-colors">
                  {avatarUploading ? <Loader2 className="w-10 h-10 mb-2 animate-spin" /> : <Camera className="w-10 h-10 mb-2" />}
                  <span className="text-xs font-bold uppercase tracking-wider">{avatarUploading ? 'Uploading' : 'Add Photo'}</span>
                </div>
              )}
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-zinc-300">Your Nickname</label>
            <input 
              autoFocus
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="e.g. Mario" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg transition-all" 
            />
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </div>
          
          <button type="submit" disabled={!username.trim() || avatarUploading} className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(170,59,255,0.3)]">
            {avatarUploading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {avatarUploading ? 'Uploading photo…' : 'Join Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
