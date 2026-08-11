import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'project' | 'task';
  status: string;
  projectId?: string;
}

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const projects = await apiClient.getProjects();
        const evts: CalendarEvent[] = [];

        for (const proj of projects) {
          if (proj.created_at) {
            evts.push({
              id: `proj-${proj.id}`,
              title: `Project Created: ${proj.name}`,
              date: new Date(proj.created_at),
              type: 'project',
              status: proj.status || 'in_progress',
              projectId: proj.id
            });
          }

          const tasks = await apiClient.getTasksForProject(proj.id);
          for (const task of tasks) {
            if (task.due_date) {
              evts.push({
                id: `task-${task.id}`,
                title: task.title,
                date: new Date(task.due_date),
                type: 'task',
                status: task.status,
                projectId: proj.id
              });
            }
          }
        }

        setEvents(evts);
      } catch (err) {
        console.error('Failed to load calendar events', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getEventsForDay = (day: number) => {
    return events.filter(e => {
      return (
        e.date.getDate() === day &&
        e.date.getMonth() === currentDate.getMonth() &&
        e.date.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarIcon size={14} /> Schedule & Deadlines
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Calendar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track upcoming project deadlines, scheduled milestones, and active task timelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">Loading calendar schedule...</div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50/50 p-2 min-h-[100px]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={`day-${day}`}
                  className={`p-2 min-h-[100px] flex flex-col transition hover:bg-slate-50/80 ${isToday ? 'bg-brand-light/40' : 'bg-white'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? 'bg-brand text-white' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        {dayEvents.length} {dayEvents.length === 1 ? 'evt' : 'evts'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto flex-1 max-h-[80px]">
                    {dayEvents.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => evt.projectId && navigate(`/projects/${evt.projectId}`)}
                        className={`p-1.5 rounded-lg text-[10px] font-semibold truncate cursor-pointer transition ${evt.type === 'project'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60 hover:bg-blue-100'
                            : 'bg-brand-light text-brand border border-brand/20 hover:bg-brand-light/80'
                          }`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
