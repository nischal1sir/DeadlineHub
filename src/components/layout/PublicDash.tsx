import React, { useEffect, useRef, useState } from 'react';
import { 
  FolderOpenDot, Users, Zap, ShieldCheck, FolderKanban, 
  CheckCircle2, ArrowRight, BarChart3, CalendarDays, 
  Bell, Lock, Sparkles, Target, Clock, ChevronRight,
  Star, TrendingUp, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from './PublicNavbar';
import { Footer } from './PublicFooter';

/* ─── Animated counter hook ─── */
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

/* ─── Components ─── */
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

const TestimonialCard = ({ quote, author, role }: { quote: string; author: string; role: string }) => (
  <div className="glass p-6 space-y-4 hover:shadow-lg transition-all duration-300">
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
      ))}
    </div>
    <p className="text-sm text-slate-600 italic leading-relaxed">"{quote}"</p>
    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#748469] to-[#AAC1B1] flex items-center justify-center text-white text-xs font-bold">
        {author.split(' ').map(n => n[0]).join('')}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{author}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
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
    description: 'Beautiful charts and progress bars show exactly where your project stands at a glance.'
  },
  {
    icon: CalendarDays,
    title: 'Smart Calendar',
    description: 'Integrated calendar view with drag-and-drop rescheduling and deadline conflict detection.'
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Get notified before deadlines hit. Never miss a due date with customizable alert schedules.'
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description: 'Control who sees what. Assign admin, editor, or viewer roles to team members.'
  },
  {
    icon: Layers,
    title: 'Nested Subtasks',
    description: 'Break complex work into manageable pieces with unlimited levels of subtasks.'
  },
  {
    icon: TrendingUp,
    title: 'Velocity Tracking',
    description: 'See how fast your team completes tasks and predict future delivery dates accurately.'
  }
];

const TESTIMONIALS = [
  {
    quote: "DeadlineHUB cut our missed deadlines by 80%. The visual progress tracking keeps everyone accountable without micromanaging.",
    author: "Sarah Mitchell",
    role: "Product Lead, TechFlow"
  },
  {
    quote: "Finally a project tool that doesn't feel like a chore. We onboarded the whole team in under 30 minutes.",
    author: "Raj Patel",
    role: "Engineering Manager"
  },
  {
    quote: "The real-time sync is a game changer. I can see exactly what's blocking our release without asking in Slack.",
    author: "Emma Chen",
    role: "Startup Founder"
  }
];

export const PublicDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      <div className="flex-1 w-full">
        {/* ═══ HERO SECTION ═══ */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#748469]/10 via-transparent to-transparent" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#AAC1B1]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#ABB290]/15 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-semibold border border-brand/20">
                <Sparkles size={14} />
                <span>Project Management Reimagined</span>
              </div>
              
              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight tracking-tight">
                Never Miss a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#748469] to-[#AAC1B1]">Deadline</span> Again
              </h1>
              
              <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                The intelligent workspace where projects, tasks, and teams converge. 
                Track progress in real-time, predict bottlenecks before they happen, 
                and ship every milestone on schedule.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-[#748469] to-[#AAC1B1] text-white font-semibold shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                >
                  Sign In
                </button>
              </div>
              
              <p className="text-xs text-slate-400">No credit card required • Free forever plan available</p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 w-full space-y-16 py-16">
          
          {/* ═══ STATS ═══ */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox icon={Users} value="100+" label="Active Users" />
            <StatBox icon={FolderKanban} value="500+" label="Projects Tracked" />
            <StatBox icon={Zap} value="Real-time" label="Live Task Sync" />
            <StatBox icon={ShieldCheck} value="99.9%" label="Uptime" />
          </section>

          {/* ═══ WHAT IS + WHY ═══ */}
          <section className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
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
              <ul className="space-y-3 pt-2">
                {[
                  'Real-time dashboard with live progress updates',
                  'AI-powered deadline risk detection',
                  'Team workload balancing & capacity planning',
                  'Automated status reports & stakeholder updates'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Mock Dashboard Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#748469]/20 to-[#AAC1B1]/20 rounded-3xl blur-2xl" />
              <div className="relative glass rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200/60 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-block px-3 py-1 rounded-md bg-white text-[10px] text-slate-400 font-mono">deadlinehub.app/dashboard</div>
                  </div>
                </div>
                <div className="p-5 space-y-4 bg-white/60">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-32 bg-slate-200 rounded-full" />
                    <div className="h-8 w-8 bg-brand/10 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-slate-100">
                        <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-emerald-400' : i === 2 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                        <div className="h-2.5 flex-1 bg-slate-100 rounded-full" />
                        <div className="h-2.5 w-12 bg-slate-100 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ FEATURES GRID ═══ */}
          <section className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-heading font-bold text-2xl text-slate-900">Everything You Need</h2>
              <p className="text-sm text-slate-500">Powerful features designed for teams that ship on time, every time.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <FeatureCard key={i} icon={f.icon} title={f.title} description={f.description} />
              ))}
            </div>
          </section>

          {/* ═══ HOW IT WORKS ═══ */}
          <section className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-heading font-bold text-2xl text-slate-900">How It Works</h2>
              <p className="text-sm text-slate-500">Three simple steps to stay on top of every deadline.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 relative">
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

          {/* ═══ TESTIMONIALS ═══ */}
          <section className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-heading font-bold text-2xl text-slate-900">Loved by Teams</h2>
              <p className="text-sm text-slate-500">See why project managers choose DeadlineHUB.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <TestimonialCard key={i} quote={t.quote} author={t.author} role={t.role} />
              ))}
            </div>
          </section>

          {/* ═══ PROJECT HIGHLIGHTS / CTA ═══ */}
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
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-3 rounded-xl bg-white text-[#748469] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Create Free Account
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
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