import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = '#4f46e5', subtext, trend }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>
          {value}
        </h3>
        {trend && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trend > 0 ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>

      {subtext && (
        <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
          {subtext}
        </span>
      )}
    </div>
  );
};

export default StatCard;
