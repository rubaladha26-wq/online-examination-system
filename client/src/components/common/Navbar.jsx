import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Bell, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
      case 'teacher':
        return { background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' };
      default:
        return { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
    }
  };

  return (
    <header
      style={{
        height: '70px',
        background: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '1.25rem',
            fontFamily: 'var(--font-display)',
            color: '#1e1b4b',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Sparkles size={20} />
          </div>
          <span>Examin<span style={{ color: '#4f46e5' }}>AI</span></span>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            ...getRoleBadgeStyle(user?.role),
          }}
        >
          {user?.role} Portal
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              {user?.name || 'User'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign Out"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
