import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Edit, LayoutGrid, List, CheckCircle2, ChevronRight, Calendar } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');

  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskDue, setTaskDue] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [projModal, setProjModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [projLoading, setProjLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const projs = await apiClient.getProjects();
      const proj = projs.find((p: any) => p.id === id);
      if (!proj) { navigate('/projects'); return; }
      setProject(proj); setEditName(proj.name); setEditDesc(proj.description || ''); setEditStatus(proj.status);
      setTasks(await apiClient.getTasksForProject(id));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const openAddTask = () => {
    setEditingTask(null);
    setTaskTitle(''); setTaskDesc(''); setTaskPriority('medium'); setTaskStatus('todo'); setTaskDue('');
    setTaskError(null); setTaskModal(true);
  };

  const openEditTask = (task: any) => {
    setEditingTask(task);
    setTaskTitle(task.title); setTaskDesc(task.description || '');
    setTaskPriority(task.priority); setTaskStatus(task.status);
    setTaskDue(task.due_date ? task.due_date.split('T')[0] : '');
    setTaskError(null); setTaskModal(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !taskTitle.trim()) { setTaskError('Task title is required.'); return; }
    setTaskLoading(true); setTaskError(null);
    try {
      if (editingTask) {
        await apiClient.updateTask(editingTask.id, { title: taskTitle.trim(), description: taskDesc.trim(), priority: taskPriority, status: taskStatus, due_date: taskDue || undefined });
      } else {
        await apiClient.createTask(id, { title: taskTitle.trim(), description: taskDesc.trim(), priority: taskPriority, due_date: taskDue || undefined });
      }
      setTaskModal(false); await load();
    } catch (err: any) { setTaskError(err.message || 'Error saving task.'); }
    finally { setTaskLoading(false); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task permanently?')) return;
    await apiClient.deleteTask(taskId);
    setTaskModal(false); await load();
  };

  const toggleTaskStatus = async (task: any) => {
    await apiClient.updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    await load();
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editName.trim()) return;
    setProjLoading(true);
    try { await apiClient.updateProject(id, { name: editName.trim(), description: editDesc.trim(), status: editStatus }); setProjModal(false); await load(); }
    finally { setProjLoading(false); }
  };

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date';

  const COLUMNS = [
    { key: 'todo',        label: 'To Do',       dot: 'bg-slate-400' },
    { key: 'in_progress', label: 'In Progress',  dot: 'bg-accent' },
    { key: 'done',        label: 'Done',         dot: 'bg-brand' },
  ];

  const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) => (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">{label}</label>
      <select
        className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
        value={value} onChange={e => onChange(e.target.value)}
      >
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  if (loading && !project) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/projects" className="hover:text-slate-800 transition">Projects</Link>
        <ChevronRight size={14} />
        <span className="text-slate-800 font-medium">{project?.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="max-w-xl">
          <h1 className="font-heading font-bold text-2xl text-slate-900">{project?.name}</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{project?.description || 'No description.'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={() => setProjModal(true)} icon={<Edit size={14} />} size="sm">Edit</Button>
          <Button onClick={openAddTask} icon={<Plus size={14} />} size="sm">Add Task</Button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 gap-0.5">
          {[{ mode: 'board', icon: LayoutGrid, label: 'Board' }, { mode: 'list', icon: List, label: 'List' }].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as 'board' | 'list')}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer',
                viewMode === mode ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="glass flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 size={48} className="text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-700 mb-1">No tasks yet</h3>
          <p className="text-sm text-slate-500 mb-6">Add your first task to start tracking progress</p>
          <Button onClick={openAddTask} icon={<Plus size={15} />}>Create Task</Button>
        </div>
      )}

      {/* LIST VIEW */}
      {tasks.length > 0 && viewMode === 'list' && (
        <div className="glass divide-y divide-slate-100">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-brand-light/30 transition group">
              <button
                onClick={() => toggleTaskStatus(task)}
                className={[
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer',
                  task.status === 'done' ? 'bg-brand border-brand text-white' : 'border-slate-300 hover:border-brand',
                ].join(' ')}
              >
                {task.status === 'done' && <span className="text-[10px] font-bold">✓</span>}
              </button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditTask(task)}>
                <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                {task.description && <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.due_date && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={11} />{fmtDate(task.due_date)}
                  </span>
                )}
                <Badge type="priority" value={task.priority} />
                <Badge type="status" value={task.status} />
                <button onClick={() => openEditTask(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition opacity-0 group-hover:opacity-100 cursor-pointer">
                  <Edit size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KANBAN VIEW */}
      {tasks.length > 0 && viewMode === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-slate-800">{col.label}</span>
                  <span className="ml-auto text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{colTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {colTasks.length === 0 && (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 bg-slate-50/50">
                      No tasks here
                    </div>
                  )}
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => openEditTask(task)}
                      className="glass glass-hover p-4 cursor-pointer space-y-2.5"
                    >
                      <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar size={11} />{fmtDate(task.due_date)}
                        </span>
                        <Badge type="priority" value={task.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <Modal
        isOpen={taskModal} onClose={() => setTaskModal(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
        footer={<>
          {editingTask && (
            <Button variant="danger" onClick={() => handleDeleteTask(editingTask.id)} className="mr-auto">Delete</Button>
          )}
          <Button variant="secondary" onClick={() => setTaskModal(false)}>Cancel</Button>
          <Button onClick={handleTaskSubmit} isLoading={taskLoading}>Save Task</Button>
        </>}
      >
        <form onSubmit={handleTaskSubmit}>
          {taskError && <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{taskError}</div>}
          <Input type="text" label="Task Title" placeholder="e.g. Design database schema"
            value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required autoFocus />
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Description</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 transition resize-none"
              rows={2} placeholder="Optional details..."
              value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Priority" value={taskPriority} onChange={setTaskPriority}
              options={[{ v: 'low', l: 'Low' }, { v: 'medium', l: 'Medium' }, { v: 'high', l: 'High' }]} />
            {editingTask && (
              <SelectField label="Status" value={taskStatus} onChange={setTaskStatus}
                options={[{ v: 'todo', l: 'To Do' }, { v: 'in_progress', l: 'In Progress' }, { v: 'done', l: 'Done' }]} />
            )}
          </div>
          <Input type="date" label="Due Date" value={taskDue} onChange={e => setTaskDue(e.target.value)} />
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal isOpen={projModal} onClose={() => setProjModal(false)} title="Edit Project"
        footer={<>
          <Button variant="secondary" onClick={() => setProjModal(false)}>Cancel</Button>
          <Button onClick={handleUpdateProject} isLoading={projLoading}>Save Changes</Button>
        </>}
      >
        <form onSubmit={handleUpdateProject}>
          <Input type="text" label="Project Name" value={editName} onChange={e => setEditName(e.target.value)} required />
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Description</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 transition resize-none"
              rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)}
            />
          </div>
          <SelectField label="Status" value={editStatus} onChange={setEditStatus}
            options={[{ v: 'active', l: 'Active' }, { v: 'archived', l: 'Archived' }]} />
        </form>
      </Modal>
    </div>
  );
};
