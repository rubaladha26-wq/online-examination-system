import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const ExamTimer = ({ deadline, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const total = Math.max(0, new Date(deadline).getTime() - Date.now());
    return Math.floor(total / 1000);
  });

  useEffect(() => {
    const targetTime = new Date(deadline).getTime();

    const interval = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const format = (n) => String(n).padStart(2, '0');

  const isUrgent = timeLeft < 300; // < 5 minutes
  const isCritical = timeLeft < 60; // < 1 minute

  let timerColor = '#0f172a';
  let bgColor = '#f8fafc';
  let borderColor = '#e2e8f0';

  if (isCritical) {
    timerColor = '#ef4444';
    bgColor = '#fef2f2';
    borderColor = '#fca5a5';
  } else if (isUrgent) {
    timerColor = '#f59e0b';
    bgColor = '#fffbeb';
    borderColor = '#fcd34d';
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.5rem 1rem',
        borderRadius: '12px',
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        color: timerColor,
        fontFamily: 'var(--font-mono)',
        fontSize: '1.1rem',
        fontWeight: 700,
        boxShadow: isCritical ? '0 0 12px rgba(239, 68, 68, 0.3)' : 'var(--shadow-sm)',
        transition: 'all 0.3s ease',
      }}
    >
      <Clock size={20} color={timerColor} />
      <span>
        {hours > 0 ? `${format(hours)}:` : ''}
        {format(minutes)}:{format(seconds)}
      </span>
    </div>
  );
};

export default ExamTimer;
