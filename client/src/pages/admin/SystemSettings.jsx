import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Settings, Cpu, HardDrive, Percent, Save } from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    AI_MODEL: 'gpt-4o-mini',
    MAX_FILE_SIZE_MB: 15,
    DEFAULT_PASSING_PERCENTAGE: 40,
    OPENAI_API_KEY: '',
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.success && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((s) => {
            map[s.key] = s.value;
          });
          setSettings((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (key, value, category) => {
    try {
      setLoading(true);
      const res = await api.put('/admin/settings', { key, value, category });
      if (res.success) {
        showToast(`Setting "${key}" updated successfully`, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>System Configuration & AI Engine</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage global AI generation models, file upload parameters, and examination defaults
        </p>
      </div>

      <div className="grid-2">
        {/* AI Engine Configuration */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#4f46e5" /> AI Model & Engine
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Primary LLM Model</label>
              <select
                className="form-select"
                value={settings.AI_MODEL}
                onChange={(e) => {
                  setSettings({ ...settings, AI_MODEL: e.target.value });
                  handleSave('AI_MODEL', e.target.value, 'ai');
                }}
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Recommended - High Speed & Precision)</option>
                <option value="gpt-4o">gpt-4o (State of the Art Multimodal)</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legacy Standard)</option>
                <option value="internal-grounded">Syllabus-Grounded Engine (Self-Hosted Fallback)</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Used for question extraction, distractor synthesis, and descriptive rubric grading.
              </span>
            </div>

            <div>
              <label className="form-label">OpenAI API Key (Optional Override)</label>
              <input
                type="password"
                className="form-control"
                placeholder="sk-proj-••••••••"
                value={settings.OPENAI_API_KEY || ''}
                onChange={(e) => setSettings({ ...settings, OPENAI_API_KEY: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                If left blank, the server uses its environment configuration or intelligent syllabus-grounded generator.
              </span>
            </div>

            <button
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => handleSave('OPENAI_API_KEY', settings.OPENAI_API_KEY, 'ai')}
            >
              <Save size={14} /> Update API Key
            </button>
          </div>
        </div>

        {/* Global Policy & Examination Defaults */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={18} color="#0ea5e9" /> Global Policies & Defaults
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Maximum Syllabus File Size (MB)</label>
              <input
                type="number"
                className="form-control"
                value={settings.MAX_FILE_SIZE_MB}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSettings({ ...settings, MAX_FILE_SIZE_MB: val });
                  handleSave('MAX_FILE_SIZE_MB', val, 'upload_limits');
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Allowed formats: PDF (.pdf), Microsoft Word (.docx), Plain Text (.txt).
              </span>
            </div>

            <div>
              <label className="form-label">Default Passing Percentage Threshold</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="form-control"
                  value={settings.DEFAULT_PASSING_PERCENTAGE}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSettings({ ...settings, DEFAULT_PASSING_PERCENTAGE: val });
                    handleSave('DEFAULT_PASSING_PERCENTAGE', val, 'exam_defaults');
                  }}
                />
                <Percent
                  size={16}
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
