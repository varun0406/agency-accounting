import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [isSetup, setIsSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSetup) {
        await axios.post(`${API_URL}/auth/setup`, { username, password });
        setIsSetup(false);
        setUsername('');
        setPassword('');
        alert('Setup complete. Please login with your new credentials.');
      } else {
        const res = await axios.post(`${API_URL}/auth/login`, { username, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        onLogin(res.data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', backgroundColor: 'var(--color-surface)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-main)' }}>Agency Accounting</h1>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
          {isSetup ? 'Create Admin Account' : 'Sign in to your account'}
        </p>

        {error && <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Username</label>
            <input required type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Password</label>
            <input required type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
            {isSetup ? 'Create Admin' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button onClick={() => { setIsSetup(!isSetup); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            {isSetup ? 'Already have an account? Sign In' : 'First time setup? Create Admin'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
