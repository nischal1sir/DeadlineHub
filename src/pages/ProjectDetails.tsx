import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Edit, LayoutGrid, List, CheckCircle2, ChevronRight, Calendar, Layers, Trash2, CheckSquare } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ContentLoader } from '../components/ui/ContentLoader';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');

  // Task Modal state
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskModuleId, setTaskModuleId] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskDue, setTaskDue] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Subtasks state for Task Modal
  const [subtaskInput, setSubtaskInput] = useState('');

  // Module Modal state
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [moduleLoading, setModuleLoading] = useState(false);

  // Edit Project Modal
  const [projModal, setProjModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [projLoading, setProjLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const projs = await apiClient.getProjects();
      const proj = projs.find((p: any) => p.id === id);
      if (!proj) { navigate('/projects'); return; }
      setProject(proj);
      setEditName(proj.name); setEditDesc(proj.description || ''); setEditStatus(proj.status);

      const fetchedMods = await apiClient.getModulesForProject(id);
      setModules(fetchedMods);

      const fetchedTasks = await apiClient.getTasksForProject(id);
      setTasks(fetchedTasks);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  // Task Actions
  const openAddTask = () => {
    setEditingTask(null);
    setTaskTitle(''); setTaskDesc(''); setTaskModuleId(modules[0]?.id || '');
    setTaskPriority('medium'); setTaskStatus('todo'); setTaskDue('');
    setTaskError(null); setTaskModal(true);
  };

  const openEditTask = (task: any) => {
    setEditingTask(task);
    setTaskTitle(task.title); setTaskDesc(task.description || '');
    setTaskModuleId(task.module_id || ''); setTaskPriority(task.priority); setTaskStatus(task.status);
    setTaskDue(task.due_date ? task.due_date.split('T')[0] : '');
    setTaskError(null); setTaskModal(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !taskTitle.trim()) { setTaskError('Task title is required.'); return; }
    setTaskLoading(true); setTaskError(null);
    try {
      if (editingTask) {
        await apiClient.updateTask(editingTask.id, {
          title: taskTitle.trim(), description: taskDesc.trim(),
          module_id: taskModuleId || null, priority: taskPriority,
          status: taskStatus, due_date: taskDue || undefined
        });
      } else {
        await apiClient.createTask(id, {
          title: taskTitle.trim(), description: taskDesc.trim(),
          module_id: taskModuleId || undefined, priority: taskPriority,
          due_date: taskDue || undefined
        });
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

  // Module Actions
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !moduleName.trim()) return;
    setModuleLoading(true);
    try {
      await apiClient.createModule(id, moduleName.trim(), moduleDesc.trim());
      setModuleName(''); setModuleDesc(''); setModuleModal(false); await load();
    } finally { setModuleLoading(false); }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Delete this module? Associated tasks will be unassigned.')) return;
    await apiClient.deleteModule(moduleId);
    await load();
  };

  // Subtask Actions
  const handleAddSubtask = async (taskId: string) => {
    if (!subtaskInput.trim()) return;
    await apiClient.createSubtask(taskId, subtaskInput.trim());
    setSubtaskInput('');
    await load();
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    await apiClient.toggleSubtask(subtaskId);
    await load();
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await apiClient.deleteSubtask(subtaskId);
    await load();
  };

  // Filter tasks by selected module
  const filteredTasks = tasks.filter(t => selectedModuleFilter === 'all' || t.module_id === selectedModuleFilter);

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date';

  const COLUMNS = [
    { key: 'todo', label: 'To Do', dot: 'bg-slate-400' },
    { key: 'in_progress', label: 'In Progress', dot: 'bg-accent' },
    { key: 'done', label: 'Done', dot: 'bg-brand' },
  ];

  if (loading && !project) return <ContentLoader text="Loading project..." />;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/projects" className="hover:text-slate-800 transition">Projects</Link>
        <ChevronRight size={14} />
        <span className="text-slate-800 font-medium">{project?.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="font-heading font-bold text-2xl text-slate-900">{project?.name}</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{project?.description || 'No description provided.'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={() => setModuleModal(true)} icon={<Layers size={14} />} size="sm">Add Module</Button>
          <Button variant="secondary" onClick={() => setProjModal(true)} icon={<Edit size={14} />} size="sm">Edit</Button>
          <Button onClick={openAddTask} icon={<Plus size={14} />} size="sm">Add Task</Button>
        </div>
      </div>

      {/* Modules Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
          <Layers size={13} /> Modules:
        </span>
        <button
          onClick={() => setSelectedModuleFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${selectedModuleFilter === 'all' ? 'bg-brand text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All Modules ({tasks.length})
        </button>
        {modules.map(mod => {
          const modTasks = tasks.filter(t => t.module_id === mod.id);
          return (
            <div key={mod.id} className="flex items-center shrink-0">
              <button
                onClick={() => setSelectedModuleFilter(mod.id)}
                className={`px-3 py-1.5 rounded-l-xl text-xs font-medium transition ${selectedModuleFilter === mod.id ? 'bg-brand text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {mod.name} ({modTasks.length})
              </button>
              <button
                onClick={() => handleDeleteModule(mod.id)}
                title="Delete Module"
                className="px-2 py-1.5 rounded-r-xl bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition border-l border-slate-200"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
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
        <span className="text-xs text-slate-500 font-medium">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} shown</span>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="glass flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 size={48} className="text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-700 mb-1">No tasks in this view</h3>
          <p className="text-sm text-slate-500 mb-6">Create tasks under your modules to track subtasks and deadlines</p>
          <Button onClick={openAddTask} icon={<Plus size={15} />}>Create Task</Button>
        </div>
      )}

      {/* LIST VIEW */}
      {filteredTasks.length > 0 && viewMode === 'list' && (
        <div className="glass divide-y divide-slate-100">
          {filteredTasks.map(task => {
            const mod = modules.find(m => m.id === task.module_id);
            const subtaskCount = task.subtasks?.length || 0;
            const completedSubtasks = task.subtasks?.filter((s: any) => s.is_completed).length || 0;

            return (
              <div key={task.id} className="p-4 hover:bg-slate-50/50 transition group space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${task.status === 'done' ? 'bg-brand border-brand text-white' : 'border-slate-300 hover:border-brand'}`}
                  >
                    {task.status === 'done' && <span className="text-[10px] font-bold">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditTask(task)}>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                      {mod && <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">{mod.name}</span>}
                    </div>
                    {task.description && <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {subtaskCount > 0 && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium flex items-center gap-1">
                        <CheckSquare size={12} /> {completedSubtasks}/{subtaskCount}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={11} />{fmtDate(task.due_date)}
                      </span>
                    )}
                    <Badge type="priority" value={task.priority} />
                    <Badge type="status" value={task.status} />
                    <button onClick={() => openEditTask(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition opacity-0 group-hover:opacity-100">
                      <Edit size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {filteredTasks.length > 0 && viewMode === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);
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
                      No tasks in {col.label}
                    </div>
                  )}
                  {colTasks.map(task => {
                    const mod = modules.find(m => m.id === task.module_id);
                    const subtaskCount = task.subtasks?.length || 0;
                    const completedSubtasks = task.subtasks?.filter((s: any) => s.is_completed).length || 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => openEditTask(task)}
                        className="glass glass-hover p-4 cursor-pointer space-y-3"
                      >
                        {mod && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-brand-light/60 text-brand-dark text-[11px] font-semibold">
                            {mod.name}
                          </span>
                        )}
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>}

                        {/* Subtasks Progress indicator */}
                        {subtaskCount > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                              <span>Subtasks</span>
                              <span>{completedSubtasks}/{subtaskCount}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-brand h-full transition-all"
                                style={{ width: `${(completedSubtasks / subtaskCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar size={11} />{fmtDate(task.due_date)}
                          </span>
                          <Badge type="priority" value={task.priority} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal (With Subtask Checklist) */}
      <Modal
        isOpen={taskModal} onClose={() => setTaskModal(false)}
        title={editingTask ? 'Edit Task & Subtasks' : 'New Task'}
        footer={<>
          {editingTask && (
            <Button variant="danger" onClick={() => handleDeleteTask(editingTask.id)} className="mr-auto">Delete Task</Button>
          )}
          <Button variant="secondary" onClick={() => setTaskModal(false)}>Cancel</Button>
          <Button onClick={handleTaskSubmit} isLoading={taskLoading}>Save Task</Button>
        </>}
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          {taskError && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{taskError}</div>}
          
          <Input type="text" label="Task Title" placeholder="e.g. Design database schema"
            value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required autoFocus />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Module</label>
            <select
              className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={taskModuleId} onChange={e => setTaskModuleId(e.target.value)}
            >
              <option value="">No Module (Unassigned)</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Description</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
              rows={2} placeholder="Task details..."
              value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Priority</label>
              <select
                className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            {editingTask && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Status</label>
                <select
                  className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  value={taskStatus} onChange={e => setTaskStatus(e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}
          </div>

          <Input type="date" label="Due Date" value={taskDue} onChange={e => setTaskDue(e.target.value)} />

          {/* Subtasks Checklist (when editing existing task) */}
          {editingTask && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckSquare size={14} className="text-brand" /> Subtasks Checklist
              </h4>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Add subtask item..."
                  value={subtaskInput}
                  onChange={e => setSubtaskInput(e.target.value)}
                  className="mb-0 flex-1"
                />
                <Button type="button" size="sm" onClick={() => handleAddSubtask(editingTask.id)}>Add</Button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {editingTask.subtasks?.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={sub.is_completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="rounded text-brand focus:ring-brand"
                      />
                      <span className={sub.is_completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>{sub.title}</span>
                    </label>
                    <button type="button" onClick={() => handleDeleteSubtask(sub.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Module Modal */}
      <Modal isOpen={moduleModal} onClose={() => setModuleModal(false)} title="Create New Module"
        footer={<>
          <Button variant="secondary" onClick={() => setModuleModal(false)}>Cancel</Button>
          <Button onClick={handleCreateModule} isLoading={moduleLoading}>Create Module</Button>
        </>}
      >
        <form onSubmit={handleCreateModule}>
          <Input type="text" label="Module Name" placeholder="e.g. Backend API Routes" value={moduleName} onChange={e => setModuleName(e.target.value)} required />
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Description</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
              rows={2} placeholder="Module purpose..."
              value={moduleDesc} onChange={e => setModuleDesc(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal isOpen={projModal} onClose={() => setProjModal(false)} title="Edit Project"
        footer={<>
          <Button variant="secondary" onClick={() => setProjModal(false)}>Cancel</Button>
          <Button onClick={async (e) => {
            e.preventDefault();
            if (!id || !editName.trim()) return;
            setProjLoading(true);
            try { await apiClient.updateProject(id, { name: editName.trim(), description: editDesc.trim(), status: editStatus }); setProjModal(false); await load(); }
            finally { setProjLoading(false); }
          }} isLoading={projLoading}>Save Changes</Button>
        </>}
      >
        <form>
          <Input type="text" label="Project Name" value={editName} onChange={e => setEditName(e.target.value)} required />
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Description</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
              rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
