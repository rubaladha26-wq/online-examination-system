import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { Plus, GraduationCap, BookOpen, Layers, Users } from 'lucide-react';

const AcademicManagement = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', department: '', totalSemesters: 8 });
  const [batchForm, setBatchForm] = useState({ name: '', course: '', academicYear: '2024-2028', currentSemester: 1 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', department: '', course: '', semester: 1, credits: 4 });

  const { showToast } = useToast();

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [deptRes, courseRes, batchRes, subRes, userRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/courses'),
        api.get('/admin/batches'),
        api.get('/admin/subjects'),
        api.get('/admin/users?role=teacher'),
      ]);

      if (deptRes.success) setDepartments(deptRes.data);
      if (courseRes.success) setCourses(courseRes.data);
      if (batchRes.success) setBatches(batchRes.data);
      if (subRes.success) setSubjects(subRes.data);
      if (userRes.success) setTeachers(userRes.data.users);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/departments', deptForm);
      if (res.success) {
        showToast('Department created', 'success');
        setIsModalOpen(false);
        setDeptForm({ name: '', code: '', description: '' });
        fetchAll();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/courses', courseForm);
      if (res.success) {
        showToast('Course created', 'success');
        setIsModalOpen(false);
        fetchAll();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/subjects', subjectForm);
      if (res.success) {
        showToast('Subject created', 'success');
        setIsModalOpen(false);
        fetchAll();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAssignTeacher = async (subjectId, teacherId) => {
    try {
      const res = await api.post(`/admin/subjects/${subjectId}/assign-teacher`, { teacherId });
      if (res.success) {
        showToast('Teacher assigned successfully', 'success');
        fetchAll();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Academic Structure</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Configure institutional departments, degree programs, classes, and course mappings
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {[
          { key: 'departments', label: 'Departments', icon: GraduationCap },
          { key: 'courses', label: 'Programs & Courses', icon: Layers },
          { key: 'batches', label: 'Classes & Batches', icon: Users },
          { key: 'subjects', label: 'Subjects & Mappings', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                border: 'none',
                background: isActive ? '#eef2ff' : 'transparent',
                color: isActive ? '#4f46e5' : '#64748b',
                fontWeight: 600,
                fontSize: '0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'departments' && (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td><Badge variant="primary">{d.code}</Badge></td>
                    <td>{d.description || '—'}</td>
                    <td><Badge variant={d.isActive ? 'success' : 'danger'}>{d.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Program / Degree</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Semesters</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td><Badge variant="primary">{c.code}</Badge></td>
                    <td>{c.department?.name || 'N/A'}</td>
                    <td>{c.totalSemesters} Semesters</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'batches' && (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Batch / Class Name</th>
                  <th>Associated Course</th>
                  <th>Academic Year</th>
                  <th>Semester</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td>{b.course?.name || 'N/A'}</td>
                    <td>{b.academicYear}</td>
                    <td>Sem {b.currentSemester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Subject Details</th>
                  <th>Code</th>
                  <th>Semester & Credits</th>
                  <th>Assigned Teachers</th>
                  <th style={{ textAlign: 'right' }}>Assign Instructor</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.course?.name}</div>
                    </td>
                    <td><Badge variant="primary">{s.code}</Badge></td>
                    <td>Sem {s.semester} • {s.credits} Credits</td>
                    <td>
                      {s.assignedTeachers && s.assignedTeachers.length > 0 ? (
                        s.assignedTeachers.map((t) => (
                          <span key={t._id} style={{ display: 'inline-block', marginRight: 4 }}>
                            <Badge variant="success">{t.name}</Badge>
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select
                        className="form-select"
                        style={{ width: 'auto', display: 'inline-block', fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                        onChange={(e) => {
                          if (e.target.value) handleAssignTeacher(s._id, e.target.value);
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>+ Assign Faculty</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add New ${activeTab.slice(0, -1).toUpperCase()}`}
      >
        {activeTab === 'departments' && (
          <form onSubmit={handleCreateDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Department Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Electrical and Electronics Engineering"
                required
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Department Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. EEE"
                required
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                placeholder="Overview of department..."
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Department</button>
            </div>
          </form>
        )}

        {activeTab === 'courses' && (
          <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Course / Degree Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Master of Computer Applications"
                required
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Course Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. MCA"
                required
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Parent Department</label>
              <select
                className="form-select"
                required
                value={courseForm.department}
                onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Total Semesters</label>
              <input
                type="number"
                className="form-control"
                value={courseForm.totalSemesters}
                onChange={(e) => setCourseForm({ ...courseForm, totalSemesters: parseInt(e.target.value, 10) })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Course</button>
            </div>
          </form>
        )}

        {activeTab === 'subjects' && (
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Subject Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Database Management Systems"
                required
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Subject Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CS401"
                required
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Department</label>
              <select
                className="form-select"
                required
                value={subjectForm.department}
                onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })}
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Course</label>
              <select
                className="form-select"
                required
                value={subjectForm.course}
                onChange={(e) => setSubjectForm({ ...subjectForm, course: e.target.value })}
              >
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div>
                <label className="form-label">Semester</label>
                <input
                  type="number"
                  className="form-control"
                  value={subjectForm.semester}
                  onChange={(e) => setSubjectForm({ ...subjectForm, semester: parseInt(e.target.value, 10) })}
                />
              </div>
              <div>
                <label className="form-label">Credits</label>
                <input
                  type="number"
                  className="form-control"
                  value={subjectForm.credits}
                  onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value, 10) })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Subject</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AcademicManagement;
