import React, { useEffect, useState } from 'react';
import {
  BarChart3, Users, UserCheck, UserX, FolderKanban, CheckSquare,
  Clock, AlertTriangle, TrendingUp, Sparkles, PieChart, Activity
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { GlobalLoader } from '../../components/ui/GlobalLoader';

// ─── Color palette constants (from index.css theme) ───────────────────────────
// brand:           #748469  — Primary Dark Sage Fern
// brand-hover:     #606e56
// brand-light:     #f0f3ee
// secondary:       #ABB290  — Muted Sage Green
// secondary-light: #f5f7f2
// accent:          #AAC1B1  — Frosted Mint
// accent-light:    #eef4f0
// cream:           #F9EAD7  — Warm Peach Cream
// cream-hover:     #f4dec4
// surface:         #F6F6EE
// EXCEPTION: rose/red (#e11d48 / #f43f5e) — ONLY for negative indicators (overdue, inactive, missing)

const COLORS = {
  brand:     '#748469',
  brandHover:'#606e56',
  secondary: '#ABB290',
  accent:    '#AAC1B1',
  cream:     '#F9EAD7',
  creamHover:'#f4dec4',
  surface:   '#F6F6EE',
  rose:      '#e11d48', // EXCEPTION: negative/danger only
  slate400:  '#94a3b8',
  slate700:  '#334155',
};

// ─── Pure-SVG Chart Components (no external libs) ─────────────────────────────

interface DonutSlice { label: string; value: number; color: string; }

const DonutChart: React.FC<{ slices: DonutSlice[]; size?: number }> = ({ slices, size = 140 }) => {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="text-xs text-slate-400">No Data</span>
    </div>
  );

  const r = 44; const cx = 55; const cy = 55;
  let cumAngle = -Math.PI / 2;
  const paths: React.ReactNode[] = [];

  slices.forEach((slice, i) => {
    if (slice.value === 0) return;
    const angle = (slice.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    const x2 = cx + r * Math.cos(cumAngle + angle);
    const y2 = cy + r * Math.sin(cumAngle + angle);
    const large = angle > Math.PI ? 1 : 0;
    paths.push(
      <path
        key={i}
        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
        fill={slice.color}
        className="transition-all duration-300"
      />
    );
    cumAngle += angle;
  });

  return (
    <svg width={size} height={size} viewBox="0 0 110 110">
      {paths}
      <circle cx={cx} cy={cy} r={28} fill="white" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="text-xs font-bold" fill="#0f172a" fontSize="11" fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize="7.5">total</text>
    </svg>
  );
};

const StackedBar: React.FC<{ segments: { label: string; value: number; color: string }[]; total: number; height?: number }> = ({
  segments, total, height = 12
}) => {
  if (total === 0) return <div className="w-full bg-slate-100 rounded-full" style={{ height }} />;
  return (
    <div className="w-full flex rounded-full overflow-hidden" style={{ height, backgroundColor: '#f1f5f9' }}>
      {segments.map((seg, i) => (
        <div
          key={i}
          style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
          className="transition-all duration-500"
          title={`${seg.label}: ${seg.value}`}
        />
      ))}
    </div>
  );
};

const MiniBarChart: React.FC<{ bars: { label: string; value: number; color: string }[]; max: number }> = ({ bars, max }) => {
  const chartH = 80;
  const barW = 28;
  const gap = 8;
  const totalW = bars.length * (barW + gap) - gap;

  return (
    <svg width={totalW} height={chartH + 24} className="overflow-visible">
      {bars.map((bar, i) => {
        const pct = max > 0 ? bar.value / max : 0;
        const bh = Math.max(pct * chartH, bar.value > 0 ? 2 : 0);
        const x = i * (barW + gap);
        const y = chartH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={4} fill={bar.color} className="transition-all duration-500" />
            <text x={x + barW / 2} y={chartH + 12} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="500">
              {bar.label}
            </text>
            {bar.value > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="bold">
                {bar.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const PlatformStatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await apiClient.getPlatformStats();
        setStats(s);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) {
    return <GlobalLoader text="Loading platform statistics..." size="lg" />;
  }

  const projectCompletionRate = stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0;
  const taskCompletionRate   = stats.totalTasks   > 0 ? Math.round((stats.completedTasks   / stats.totalTasks)   * 100) : 0;
  const pendingTasks  = stats.totalTasks - stats.completedTasks;
  const activeProjPct = stats.totalProjects > 0 ? Math.round((stats.pendingProjects / stats.totalProjects) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
          <BarChart3 size={14} /> Analytics & System Metrics
        </div>
        <h1 className="font-heading font-bold text-2xl text-slate-900">Platform Statistics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Comprehensive real-time analytics across all user accounts, projects, task completion rates, and platform activity.
        </p>
      </div>

      {/* KPI Cards — using only brand palette + rose for negative */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, sub: `${stats.newUsersThisMonth} new this month`, icon: Users, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Active Users', value: stats.activeUsers, sub: `${stats.inactiveUsers} inactive`, icon: UserCheck, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Inactive Users', value: stats.inactiveUsers, sub: 'Suspended / Deactivated', icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'New This Month', value: stats.newUsersThisMonth, sub: 'Joined this month', icon: Sparkles, color: 'text-secondary', bg: 'bg-secondary-light' },
          { label: 'Total Projects', value: stats.totalProjects, sub: `${stats.completedProjects} completed`, icon: FolderKanban, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Completed Projects', value: stats.completedProjects, sub: `${projectCompletionRate}% rate`, icon: TrendingUp, color: 'text-brand', bg: 'bg-brand-light' },
          { label: 'Active Projects', value: stats.pendingProjects, sub: 'In progress', icon: Clock, color: 'text-secondary', bg: 'bg-secondary-light' },
          { label: 'Overdue Projects', value: stats.overdueProjects, sub: 'Past deadline', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(item => (
          <div key={item.label} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{item.label}</span>
              <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                <item.icon size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{item.value}</p>
            <p className="text-[11px] text-slate-500">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

        {/* User Role Breakdown — Donut */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
            <Users size={15} className="text-brand shrink-0" /> User Distribution
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <div className="shrink-0">
              <DonutChart
                size={120}
                slices={[
                  { label: 'Active', value: stats.activeUsers, color: COLORS.brand },
                  { label: 'Inactive', value: stats.inactiveUsers, color: COLORS.rose },
                  { label: 'New', value: stats.newUsersThisMonth, color: COLORS.secondary },
                ]}
              />
            </div>
            <div className="space-y-2 text-xs w-full">
              {[
                { label: 'Active', value: stats.activeUsers, color: COLORS.brand, textClass: 'text-brand' },
                { label: 'Inactive', value: stats.inactiveUsers, color: COLORS.rose, textClass: 'text-rose-600' },
                { label: 'New (Month)', value: stats.newUsersThisMonth, color: COLORS.secondary, textClass: 'text-secondary' },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 truncate">{d.label}</span>
                  </div>
                  <span className={`font-bold ${d.textClass} shrink-0 ml-2`}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Status — Donut */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
            <FolderKanban size={15} className="text-brand shrink-0" /> Project Status
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <div className="shrink-0">
              <DonutChart
                size={120}
                slices={[
                  { label: 'Completed', value: stats.completedProjects, color: COLORS.brand },
                  { label: 'Active', value: stats.pendingProjects, color: COLORS.accent },
                  { label: 'Overdue', value: stats.overdueProjects, color: COLORS.rose },
                ]}
              />
            </div>
            <div className="space-y-2 text-xs w-full">
              {[
                { label: 'Completed', value: stats.completedProjects, color: COLORS.brand, textClass: 'text-brand' },
                { label: 'Active', value: stats.pendingProjects, color: COLORS.accent, textClass: 'text-accent' },
                { label: 'Overdue', value: stats.overdueProjects, color: COLORS.rose, textClass: 'text-rose-600' },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 truncate">{d.label}</span>
                  </div>
                  <span className={`font-bold ${d.textClass} shrink-0 ml-2`}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Overview — Mini Bar */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
            <CheckSquare size={15} className="text-brand shrink-0" /> Task Breakdown
          </h2>
          <div className="flex flex-col items-center gap-4">
            <MiniBarChart
              max={Math.max(stats.totalTasks, 1)}
              bars={[
                { label: 'Total', value: stats.totalTasks, color: COLORS.surface },
                { label: 'Done', value: stats.completedTasks, color: COLORS.brand },
                { label: 'Pending', value: pendingTasks, color: COLORS.secondary },
              ]}
            />
            <div className="w-full space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Completion Rate</span>
                <span className="font-bold text-brand">{taskCompletionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand h-full rounded-full transition-all duration-700" style={{ width: `${taskCompletionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 — Stacked Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <PieChart size={15} className="text-brand shrink-0" /> Project Velocity Overview
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span className="font-medium">Completed vs. Active vs. Overdue</span>
                <span className="font-bold text-brand">{projectCompletionRate}% done</span>
              </div>
              <StackedBar
                total={stats.totalProjects}
                segments={[
                  { label: 'Completed', value: stats.completedProjects, color: COLORS.brand },
                  { label: 'Active', value: stats.pendingProjects, color: COLORS.accent },
                  { label: 'Overdue', value: stats.overdueProjects, color: COLORS.rose },
                ]}
              />
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS.brand }} />Completed ({stats.completedProjects})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS.accent }} />Active ({stats.pendingProjects})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />Overdue ({stats.overdueProjects})</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span className="font-medium">Active Project Ratio</span>
                <span className="font-bold text-secondary">{activeProjPct}% active</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${activeProjPct}%`, backgroundColor: COLORS.accent }} />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            {stats.overdueProjects === 0
              ? '✅ No overdue projects — great platform health!'
              : `⚠️ ${stats.overdueProjects} project(s) past their deadline require attention.`}
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity size={15} className="text-brand shrink-0" /> Account Health Summary
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span className="font-medium">Active Account Ratio</span>
                <span className="font-bold text-brand">
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% active
                </span>
              </div>
              <StackedBar
                total={stats.totalUsers}
                segments={[
                  { label: 'Active', value: stats.activeUsers, color: COLORS.brand },
                  { label: 'Inactive', value: stats.inactiveUsers, color: COLORS.rose },
                ]}
              />
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS.brand }} />Active ({stats.activeUsers})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />Inactive ({stats.inactiveUsers})</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span className="font-medium">Task Completion Rate</span>
                <span className="font-bold text-brand">{taskCompletionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-brand h-full rounded-full transition-all duration-700" style={{ width: `${taskCompletionRate}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
              {[
                { label: 'Total Tasks', value: stats.totalTasks, textClass: 'text-slate-900' },
                { label: 'Completed', value: stats.completedTasks, textClass: 'text-brand' },
                { label: 'Pending', value: pendingTasks, textClass: 'text-secondary' },
              ].map(d => (
                <div key={d.label} className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className={`text-lg sm:text-xl font-bold ${d.textClass}`}>{d.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
