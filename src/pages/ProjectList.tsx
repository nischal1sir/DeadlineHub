import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

interface ProjectWithStats {
  id: string; name: string; description: string;
  status: string; created_at: string;
  totalTasks: number; completedTasks: number;
}

export const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const projs = await apiClient.getProjects();
      const enriched: ProjectWithStats[] = [];
      for (const p of projs) {
        const tasks = await apiClient.getTasksForProject(p.id);
        enriched.push({ ...p, totalTasks: tasks.length, completedTasks: tasks.filter((t: any) => t.status === 'done').length });
      }
      setProjects(enriched);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setFormError('Project name is required.'); return; }
    setBtnLoading(true); setFormError(null);
    try {
      await apiClient.createProject(newName.trim(), newDesc.trim(), newDueDate || undefined);
      setNewName(''); setNewDesc(''); setNewDueDate(''); setModalOpen(false); await load();
    } catch (err: any) { setFormError(err.message || 'Failed to create project.'); }
    finally { setBtnLoading(false); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all completed tasks?')) return;
    try { await apiClient.deleteProject(id); await load(); }
    catch (err: any) { alert(err.message || 'Cannot delete project with active tasks.'); }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading && projects.length === 0) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">My Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your project workspaces</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<Plus size={15} />}>New Project</Button>
      </div>

      {projects.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban size={48} className="text-slate-400 mb-4" />
          <h3 className="font-semibold text-slate-700 mb-1">No projects yet</h3>
          <p className="text-sm text-slate-500 mb-6">Create your first project to start tracking tasks</p>
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={15} />}>Create First Project</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map(proj => {
            const pct = proj.totalTasks > 0 ? Math.round(proj.completedTasks / proj.totalTasks * 100) : 0;
            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                className="glass glass-hover p-5 flex flex-col gap-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-semibold text-slate-800 leading-snug">{proj.name}</h3>
                  <button
                    onClick={e => handleDelete(e, proj.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
                  {proj.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate(proj.created_at)}</span>
                  <span className="flex items-center gap-1"><ClipboardList size={11} />{proj.totalTasks} tasks</span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-medium text-slate-700">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Project"
        footer={<>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} isLoading={btnLoading}>Create Project</Button>
        </>}
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          {formError && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{formError}</div>}
          <Input type="text" label="Project Name" placeholder="e.g. Website Overhaul"
            value={newName} onChange={e => setNewName(e.target.value)} required autoFocus />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Description (Optional)</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition resize-none"
              rows={3} placeholder="Describe the scope or objectives..."
              value={newDesc} onChange={e => setNewDesc(e.target.value)}
            />
          </div>
          <Input type="date" label="Project Target Deadline (Optional)" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
};
