import { useState } from 'react';
import { signIn } from '../lib/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const session = await signIn(email.trim(), password);
      onLogin(session);
    } catch (err) {
      setError('E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'40px 36px', width:360, boxShadow:'0 8px 32px rgba(0,0,0,0.1)', textAlign:'center' }}>
        <div style={{ width:60, height:60, background:'#1B3D4F', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <span style={{ fontWeight:900, fontSize:22, color:'#00C4CC' }}>ND</span>
        </div>
        <div style={{ fontWeight:800, fontSize:18, color:'#1B3D4F', letterSpacing:3 }}>NOKTA DİZAYN</div>
        <div style={{ fontSize:11, color:'#6B8FA0', letterSpacing:2, marginTop:4, marginBottom:28 }}>MİMARİ PROJE PORTALI v4.5</div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:10, textAlign:'left' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6B8FA0', letterSpacing:1 }}>E-POSTA</div>
          <input style={{ border:'1px solid #D0E4EC', borderRadius:8, padding:'11px 14px', fontSize:14, outline:'none', color:'#1B3D4F', background:'#F4F8FA' }}
            type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <div style={{ fontSize:11, fontWeight:700, color:'#6B8FA0', letterSpacing:1 }}>ŞİFRE</div>
          <input style={{ border:'1px solid #D0E4EC', borderRadius:8, padding:'11px 14px', fontSize:14, outline:'none', color:'#1B3D4F', background:'#F4F8FA' }}
            type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div style={{ color:'#C62828', fontSize:13, background:'#FFEBEE', border:'1px solid #FFCDD2', borderRadius:8, padding:'10px 14px' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ background:'#1B3D4F', color:'#fff', border:'none', borderRadius:8, padding:14, fontSize:14, fontWeight:700, cursor:'pointer', letterSpacing:1, marginTop:8 }}>
            {loading ? '…' : 'GİRİŞ YAP'}
          </button>
        </form>
      </div>
    </div>
  );
}
