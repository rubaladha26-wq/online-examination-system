import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import { ShieldCheck, RefreshCw } from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs');
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>System Audit Trail</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Immutable security event logs, AI operations, and state transitions
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Initiator</th>
                <th>Entity Target</th>
                <th>Event Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <Badge variant="primary">{log.action}</Badge>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {log.user?.name || 'System Actor'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {log.user?.email || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <Badge variant="secondary">{log.entity}</Badge>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: 300 }}>
                    <code style={{ fontFamily: 'var(--font-mono)', background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>
                      {JSON.stringify(log.details)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
