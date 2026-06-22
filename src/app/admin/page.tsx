'use client';

import { useState } from 'react';

interface Registration {
  id: string;
  name: string;
  category: string;
  reg_number: string;
  reg_type?: string;
  is_parent: boolean;
  children?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {} as Record<string, number>,
    parents: 0,
    students: 0,
    staff: 0,
  });

  const CATEGORIES = [
    'Little Word Sprouts',
    'Rising Word Explorers',
    'Word Builders League',
    'Word Champions Circle',
    'Elite Word Masters',
    'Grand Spelling Legends'
  ];

  const authenticate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setPassword('');
        fetchRegistrations();
      } else {
        alert('Incorrect password');
      }
    } catch (error) {
      alert('Authentication failed');
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/registrations');
      const data = await response.json();
      setRegistrations(data);
      
      const totalByCategory: Record<string, number> = {};
      let parentCount = 0;
      let studentCount = 0;
      let staffCount = 0;

      data.forEach((reg: Registration) => {
        if (reg.reg_type === 'staff') staffCount++;
        else if (reg.reg_type === 'parent' || reg.is_parent) parentCount++;
        else studentCount++;
        totalByCategory[reg.category] = (totalByCategory[reg.category] || 0) + 1;
      });

      setStats({
        total: data.length,
        byCategory: totalByCategory,
        parents: parentCount,
        students: studentCount,
        staff: staffCount,
      });
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      alert('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Reg Number', 'Type', 'Date'];
    const rows = registrations.map((reg) => [
      reg.name,
      reg.category,
      reg.reg_number,
      reg.reg_type === 'staff' ? 'Staff' : reg.reg_type === 'parent' || reg.is_parent ? 'Parent/Guardian' : 'Student',
      new Date(reg.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registrations.csv';
    a.click();
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    
    try {
      const response = await fetch('/api/registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        alert('Registration deleted successfully');
        fetchRegistrations();
      } else {
        alert('Failed to delete registration');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting registration');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '20px' }}>
        <form onSubmit={authenticate} style={{ background: 'var(--navy2)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, color: 'var(--gold)', margin: '0 0 8px 0' }}>Admin Dashboard</h1>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>Enter password to continue</p>
          </div>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '15px', padding: '12px 16px', marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}
            required
          />
          <button type="submit" style={{ width: '100%', background: 'var(--gold)', color: 'var(--navy)', fontWeight: 700, fontSize: '15px', padding: '14px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>Unlock Dashboard →</button>
        </form>
        <style jsx>{`
          :global(body) { background: var(--navy); color: var(--text); }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', paddingBottom: '48px' }}>
      <header style={{ background: 'linear-gradient(135deg, rgba(17,24,71,0.8), rgba(11,16,53,0.8))', borderBottom: '1px solid rgba(245,197,24,0.15)', padding: '28px' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '32px' }}>🐝</div>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', margin: '0 0 2px 0', color: '#f5c518' }}>Admin Dashboard</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#7a87b0', letterSpacing: '1px' }}>REGISTRATIONS</p>
            </div>
          </div>
          <button onClick={() => { setIsAuthenticated(false); setRegistrations([]); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(245,197,24,0.3)', color: 'var(--gold)', fontWeight: 600, padding: '9px 20px', borderRadius: '99px', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: '1140px', margin: '32px auto', padding: '0 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '18px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>Total Registrations</div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--white)', fontFamily: "'Playfair Display', serif" }}>{stats.total}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '18px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>Students</div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--white)', fontFamily: "'Playfair Display', serif" }}>{stats.students}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '18px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>Parents/Guardians</div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--white)', fontFamily: "'Playfair Display', serif" }}>{stats.parents}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '18px', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>Staff Members</div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--white)', fontFamily: "'Playfair Display', serif" }}>{stats.staff}</div>
        </div>
      </div>

      <div style={{ maxWidth: '1140px', margin: '0 auto 48px', padding: '0 28px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, color: 'var(--white)', margin: 0, marginBottom: '16px' }}>Registrations by Category</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {CATEGORIES.map((cat) => (
            <div key={cat} style={{ background: 'rgba(245,197,24,0.05)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text)' }}>{cat}</span>
              <span style={{ fontWeight: 900, color: 'var(--gold)', fontSize: '20px', fontFamily: "'Playfair Display', serif" }}>{stats.byCategory[cat] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1140px', margin: '0 auto 48px', padding: '0 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, color: 'var(--white)', margin: 0 }}>All Registrations</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={fetchRegistrations} disabled={loading} style={{ background: 'var(--gold)', color: 'var(--navy)', fontWeight: 700, fontSize: '13px', padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
              {loading ? '⟳ Loading...' : '↻ Refresh'}
            </button>
            <button onClick={exportToCSV} style={{ background: 'rgba(245,197,24,0.1)', color: 'var(--gold)', fontWeight: 700, fontSize: '13px', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(245,197,24,0.3)', cursor: 'pointer' }}>
              ⬇️ Export CSV
            </button>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,197,24,0.15)', borderRadius: '18px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <p style={{ color: 'var(--muted)' }}>No registrations yet</p>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,197,24,0.15)', borderRadius: '18px', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ background: 'rgba(245,197,24,0.08)', padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(245,197,24,0.2)' }}>Name</th>
                  <th style={{ background: 'rgba(245,197,24,0.08)', padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(245,197,24,0.2)' }}>Category</th>
                  <th style={{ background: 'rgba(245,197,24,0.08)', padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(245,197,24,0.2)' }}>Reg Number</th>
                  <th style={{ background: 'rgba(245,197,24,0.08)', padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(245,197,24,0.2)' }}>Type</th>
                  <th style={{ background: 'rgba(245,197,24,0.08)', padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(245,197,24,0.2)' }}>Date</th>
                  <th style={{ background: 'rgba(245,197,24,0.08)', padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(245,197,24,0.2)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', color: 'var(--text)', fontSize: '14px' }}>{reg.name}</td>
                    <td style={{ padding: '16px', color: 'var(--text)', fontSize: '14px' }}>{reg.category}</td>
                    <td style={{ padding: '16px', color: 'var(--text)', fontSize: '14px', fontFamily: 'monospace', background: 'rgba(245,197,24,0.08)', fontWeight: 'bold' }}>{reg.reg_number}</td>
                    <td style={{ padding: '16px', color: 'var(--text)', fontSize: '14px' }}>
                      {reg.reg_type === 'staff' ? '👔 Staff' : reg.reg_type === 'parent' || reg.is_parent ? '👨‍👩‍👧 Parent' : '👤 Student'}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text)', fontSize: '14px' }}>{new Date(reg.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', color: 'var(--text)', fontSize: '14px' }}>
                      <button
                        onClick={() => deleteRegistration(reg.id)}
                        style={{
                          background: 'rgba(239,68,68,0.2)',
                          color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.4)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: var(--navy); color: var(--text); font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
        :root {
          --navy: #05091e; --navy2: #0b1035; --navy3: #111847; --navy4: #1a2463;
          --gold: #f5c518; --gold2: #d4a900; --gold3: #ffe066;
          --white: #ffffff; --text: #dde3f5; --muted: #7a87b0;
        }
      `}</style>
    </div>
  );
}
