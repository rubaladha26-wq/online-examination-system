import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Sparkles,
  Database,
  CalendarCheck,
  Settings,
  ShieldAlert,
  ClipboardList,
  Award,
  BookOpen,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/academics', label: 'Academic Hierarchy', icon: GraduationCap },
    { to: '/admin/exams', label: 'Exam Oversight', icon: CalendarCheck },
    { to: '/admin/settings', label: 'System & AI Settings', icon: Settings },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: ShieldAlert },
  ];

  const teacherLinks = [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/syllabuses', label: 'Syllabus Management', icon: FileText },
    { to: '/teacher/ai-generator', label: 'AI Question Generator', icon: Sparkles },
    { to: '/teacher/questions', label: 'Question Bank', icon: Database },
    { to: '/teacher/create-exam', label: 'Create Examination', icon: CalendarCheck },
    { to: '/teacher/exams', label: 'Manage Examinations', icon: ClipboardList },
  ];

  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/exams', label: 'My Examinations', icon: ClipboardList },
    { to: '/student/results', label: 'Results & Analytics', icon: Award },
  ];

  let links = studentLinks;
  if (role === 'admin') links = adminLinks;
  if (role === 'teacher') links = teacherLinks;

  return (
    <aside
      style={{
        width: 260,
        background: '#0f172a',
        color: '#94a3b8',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1e293b',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '1.5rem 1.25rem 0.75rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748b',
          }}
        >
          {role} Workspace
        </span>
      </div>

      <nav style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/teacher' || link.to === '/student'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: isActive ? '#ffffff' : '#94a3b8',
                background: isActive ? '#4f46e5' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1.25rem', borderTop: '1px solid #1e293b' }}>
        <div
          style={{
            background: '#1e293b',
            borderRadius: '8px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
            <Sparkles size={14} />
            <span style={{ fontWeight: 600 }}>ExaminAI v2.0</span>
          </div>
          <span style={{ color: '#64748b' }}>Syllabus-Grounded & Bloom's Taxonomy Engine</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
