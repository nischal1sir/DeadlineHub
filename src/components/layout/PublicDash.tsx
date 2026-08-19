import React, { useEffect, useRef, useState } from 'react';
import {
  FolderOpenDot, Users, Zap, ShieldCheck, FolderKanban,
  CheckCircle2, ArrowRight, BarChart3, CalendarDays,
  Bell, Lock, FolderTree, Target, Clock, ChevronRight,
  TrendingUp, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Header } from './PublicNavbar';
import { Footer } from './PublicFooter';
import { apiClient } from '../../lib/apiClient';
import { TestimonialCarousel } from '../ui/TestimonialCarousel';
import { getTestimonials } from '../ui/testimonial/supabase-testimonials';
import type { TestimonialData } from '../ui/testimonial/testimonial-grid-demo';
import { TESTIMONIALS } from '../ui/testimonial/testimonial-grid-demo';

/*  Animated counter hook  */
const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOut * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
};

/*  Components  */
const StatBox = ({ icon: Icon, value, label, suffix = '' }: { icon: any; value: string; label: string; suffix?: string }) => {
  const numericValue = parseInt(value.replace(/\D/g, '')) || 0;
  const { count, ref } = useCountUp(numericValue);
  const displayValue = value.includes('+') ? `${count}+` : value.includes('%') ? `${count}%` : `${count}${suffix}`;

  return (
    <div ref={ref} className="glass p-5 flex flex-col items-center text-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-brand flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon size={22} />
      </div>
      <span className="font-heading font-bold text-2xl text-slate-900 leading-none">{displayValue}</span>
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="glass p-6 space-y-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border border-transparent hover:border-brand/20">
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#748469] to-[#AAC1B1] flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
      <Icon size={20} className="text-white" />
    </div>
    <h3 className="font-heading font-semibold text-sm text-slate-900">{title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
  </div>
);

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create a project',
    description: 'Set a name, description, and deadline so every task has a home and a due date to work toward.'
  },
  {
    step: '02',
    title: 'Break it into tasks',
    description: 'Add tasks and subtasks under each project, assign priority, and set individual due dates.'
  },
  {
    step: '03',
    title: 'Track in real time',
    description: 'The dashboard updates as you complete tasks, so you always know what\'s due today and what\'s at risk.'
  }
];

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    description: 'Glanceable charts and progress bars show where each project stands.'
  },
  {
    icon: CalendarDays,
    title: 'Smart Calendar',
    description: 'Drag-and-drop rescheduling with built-in deadline conflict detection.'
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Get alerts before deadlines hit, so due dates are never missed.'
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description: 'Assign admin, editor, or viewer roles to keep control of visibility.'
  },
  {
    icon: Layers,
    title: 'Nested Subtasks',
    description: 'Break work into manageable pieces with unlimited subtask levels.'
  },
  {
    icon: TrendingUp,
    title: 'Velocity Tracking',
    description: 'Measure completion speed and predict future delivery dates.'
  }
];

export const PublicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<{
    activeUsers: number; totalProjects: number; activeTasks: number;
  }>({ activeUsers: 0, totalProjects: 0, activeTasks: 0 });

  const [testimonials, setTestimonials] = useState<TestimonialData[]>(TESTIMONIALS);

  useEffect(() => {
    const stored = sessionStorage.getItem('postLogoutToast');
    if (stored) {
      try {
        const toast = JSON.parse(stored);
        showToast(toast);
        sessionStorage.removeItem('postLogoutToast');
      } catch {
        sessionStorage.removeItem('postLogoutToast');
      }
    }
  }, [showToast]);

  useEffect(() => {
    (async () => {
      try {
        const s = await apiClient.getPublicStats();
        setStats({
          activeUsers: s.activeUsers || 0,
          totalProjects: s.totalProjects || 0,
          activeTasks: s.activeTasks || 0
        });
      } catch {
        // Keep zeros if stats can't be fetched
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getTestimonials();
        if (fetched.length > 0) {
          setTestimonials(fetched);
        }
      } catch {
        // Keep demo testimonials if Supabase fetch fails
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      <div className="flex-1 w-full">
        {/*  HERO SECTION  */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#748469]/10 via-transparent to-transparent" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#AAC1B1]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#ABB290]/15 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-semibold border border-brand/20">
                <FolderTree size={14} />
                <span>Project Management</span>
              </div>

              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight tracking-tight">
                Never Miss a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#748469] to-[#FF0000]">Deadline</span> Again
              </h1>

              <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                The intelligent workspace where projects, tasks, and teams converge.
                Track progress in real-time, predict bottlenecks before they happen,
                and ship every milestone on schedule.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#748469] to-[#AAC1B1] text-white font-semibold shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  Get Started Free
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 text-base sm:text-lg"
                >
                  Sign In
                </button>
              </div>

              <p className="text-xs text-slate-400">No credit card required • Free forever plan available</p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 w-full space-y-16 py-16">

          {/*  STATS  */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox icon={Users} value={String(stats.activeUsers)} label="Active Users" />
            <StatBox icon={FolderKanban} value={String(stats.totalProjects)} label="Projects Tracked" />
            <StatBox icon={Zap} value="Real-time" label="Live Task Sync" />
            <StatBox icon={ShieldCheck} value={String(stats.activeTasks)} label="Active Tasks" />
          </section>

          {/*  WHAT IS + WHY  */}
          <section className="space-y-8">
            <div className="text-center space-y-2 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-widest">
                <Target size={14} />
                About DeadlineHUB
              </div>
              <h2 className="font-heading font-bold text-3xl text-slate-900 leading-tight">
                Your Project's Command Center
              </h2>
              <p className="text-slate-500 leading-relaxed">
                DeadlineHUB brings every project, task, and subtask into one intelligent workspace.
                With real-time progress tracking, smart deadline predictions, and team collaboration
                tools, nothing slips through the cracks unnoticed.
              </p>
            </div>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                'Real-time dashboard with live progress updates',
                'AI-powered deadline risk detection',
                'Team workload balancing & capacity planning',
                'Automated status reports & stakeholder updates'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 glass p-4 hover:shadow-lg transition-all duration-300">
                  <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/*  FEATURES GRID  */}
          <section className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-heading font-bold text-2xl text-slate-900">Everything You Need</h2>
              <p className="text-sm text-slate-500">Powerful features designed for teams that ship on time, every time.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <FeatureCard key={i} icon={f.icon} title={f.title} description={f.description} />
              ))}
            </div>
          </section>

          {/*  HOW IT WORKS  */}
          <section className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-heading font-bold text-2xl text-slate-900">How It Works</h2>
              <p className="text-sm text-slate-500">Three simple steps to stay on top of every deadline.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-brand/20 via-brand/40 to-brand/20" />

              {HOW_IT_WORKS.map((item, i) => (
                <div key={item.step} className="relative glass p-6 space-y-3 text-center hover:shadow-lg transition-all duration-300 group">
                  <div className="relative inline-flex">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#748469] to-[#AAC1B1] flex items-center justify-center text-white font-heading font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {item.step}
                    </div>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="md:hidden absolute -right-8 top-1/2 -translate-y-1/2 text-brand/30">
                        <ChevronRight size={20} />
                      </div>
                    )}
                  </div>
                  <h3 className="font-heading font-semibold text-sm text-slate-900 pt-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/*  TESTIMONIALS  */}
          <section className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-heading font-bold text-2xl text-slate-900">Loved by Teams</h2>
              <p className="text-sm text-slate-500">See why project managers choose DeadlineHUB.</p>
            </div>
            <TestimonialCarousel testimonials={testimonials} autoRotate={true} autoRotateInterval={5000} />
          </section>

          {/*  PROJECT HIGHLIGHTS / CTA  */}
          <section className="rounded-3xl bg-gradient-to-br from-[#748469] via-[#8B9A7A] to-[#AAC1B1] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block">
              <FolderOpenDot size={240} />
            </div>

            <div className="relative p-8 lg:p-12 grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                  <Clock size={14} />
                  Ready to Ship Faster?
                </div>
                <h2 className="font-heading font-bold text-3xl leading-tight">
                  Start Tracking Your Deadlines Today
                </h2>
                <p className="text-white/80 leading-relaxed max-w-md">
                  Join hundreds of teams who've eliminated deadline anxiety.
                  Set up your first project in under 2 minutes — no credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-white text-[#748469] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 text-base sm:text-lg whitespace-nowrap"
                  >
                    Create Account
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm text-base sm:text-lg whitespace-nowrap"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 rounded-full border-4 border-white/20 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full border-4 border-white/30 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <CheckCircle2 size={48} className="text-white" />
                      </div>
                    </div>
                  </div>
                  {/* Orbiting dots */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 rounded-full bg-white shadow-lg" />
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-3 h-3 rounded-full bg-white/70 shadow-lg" />
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
};