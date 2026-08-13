import React, { useState, useEffect } from 'react';
import { Timer, Layers, BarChart3, type LucideIcon } from 'lucide-react';

export interface AuthHeroHighlight {
  icon: LucideIcon;
  label: string;
  sub: string;
}

export interface AuthHeroClockProps {
  headline?: string;
  subtext?: string;
  highlights?: AuthHeroHighlight[];
  className?: string;
}

export const AuthHeroClock: React.FC<AuthHeroClockProps> = ({
  headline = 'Time-Driven Project & Task Intelligence',
  subtext = 'Every second counts. Keep teams synchronized and deliver milestones on schedule.',
  highlights = [
    { icon: Timer, label: 'Real-Time Clock & Deadlines', sub: 'Instant deadline tracking and automated countdowns' },
    { icon: Layers, label: 'Role-Based Dual Portals', sub: 'Dedicated User Portal & Admin Control Center' },
    { icon: BarChart3, label: 'Platform Statistics & Audits', sub: 'Real-time user analytics and system event tracking' },
  ],
  className = '',
}) => {
  // Live real-time clock state for ticking watch graphic
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  const digitalTimeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`hidden lg:flex shrink-0 relative overflow-hidden mesh-bg rounded-3xl shadow-xl ring-1 ring-black/10 flex-col justify-between min-w-[380px] p-6 xl:p-8 ${className}`}>
      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.92); }
        }
        @keyframes floatBlobSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.15); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(170, 193, 177, 0.5), 0 0 40px 10px rgba(249, 234, 215, 0.18); }
          50% { box-shadow: 0 0 0 8px rgba(170, 193, 177, 0.1), 0 0 60px 20px rgba(249, 234, 215, 0.32); }
        }
        @keyframes orbitRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.95; }
        }
        .anim-blob { animation: floatBlob 10s ease-in-out infinite; }
        .anim-blob-slow { animation: floatBlobSlow 14s ease-in-out infinite; }
        .anim-fade-up { animation: fadeSlideUp 0.6s ease-out both; }
        .anim-orbit { animation: orbitRing 25s linear infinite; }
        .anim-orbit-rev { animation: orbitRing 35s linear infinite reverse; }
        .anim-pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
        .brand-shimmer {
          background: linear-gradient(90deg, #ffffff 30%, #F9EAD7 45%, #AAC1B1 55%, #ffffff 70%);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .mesh-bg {
          background: #748469;
        }
      `}</style>

      {/* Ambient background blobs */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="anim-blob absolute top-[10%] left-[8%] w-80 h-80 rounded-full bg-[#AAC1B1] blur-3xl" />
        <div className="anim-blob-slow absolute bottom-[8%] right-[10%] w-[28rem] h-[28rem] rounded-full bg-[#F9EAD7] blur-3xl" />
      </div>

      {/* Top Bar inside Hero: Real-Time Live Digital Clock Badge */}
      <div className="relative z-10 flex items-center justify-between anim-fade-up">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-[#AAC1B1] animate-ping" />
          <span className="text-xs font-mono font-bold tracking-wider">{digitalTimeStr}</span>
        </div>
        <span className="text-xs font-medium text-[#F9EAD7]/90 tracking-wide uppercase">{formattedDateStr}</span>
      </div>

      {/* Central Real-Time Ticking Watch Graphic */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center py-4">
        {/* Watch Outer Ring Container */}
        <div className="relative w-60 h-60 xl:w-68 xl:h-68 flex items-center justify-center mb-5">
          {/* Orbiting outer deadline arcs */}
          <div className="anim-orbit absolute -inset-4 rounded-full border border-dashed border-[#F9EAD7]/35" />
          <div className="anim-orbit-rev absolute -inset-8 rounded-full border border-dashed border-[#AAC1B1]/25" />

          {/* Glowing Outer Bezel */}
          <div className="anim-pulse-glow absolute inset-0 rounded-full bg-gradient-to-tr from-[#AAC1B1]/20 via-[#F9EAD7]/15 to-transparent blur-md" />

          {/* SVG Analog Clock Face */}
          <svg className="w-full h-full relative z-10 drop-shadow-2xl" viewBox="0 0 200 200">
            {/* Watch Case & Dial Background */}
            <circle cx="100" cy="100" r="94" fill="#58674f" stroke="#AAC1B1" strokeWidth="2.5" />
            <circle cx="100" cy="100" r="88" fill="#4d5a44" stroke="#F9EAD7" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            {/* 12 Hour Ticks */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 100 + 76 * Math.sin(angle);
              const y1Pos = 100 - 76 * Math.cos(angle);
              const x2 = 100 + (i % 3 === 0 ? 66 : 72) * Math.sin(angle);
              const y2Pos = 100 - (i % 3 === 0 ? 66 : 72) * Math.cos(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1Pos}
                  x2={x2}
                  y2={y2Pos}
                  stroke={i % 3 === 0 ? '#F9EAD7' : '#AAC1B1'}
                  strokeWidth={i % 3 === 0 ? '2.5' : '1.5'}
                  strokeLinecap="round"
                  opacity={i % 3 === 0 ? 0.95 : 0.6}
                />
              );
            })}

            {/* Cardinal Hour Numbers: 12, 3, 6, 9 */}
            <text x="100" y="32" textAnchor="middle" fill="#F9EAD7" fontSize="11" fontWeight="700" fontFamily="sans-serif">12</text>
            <text x="172" y="104" textAnchor="middle" fill="#F9EAD7" fontSize="11" fontWeight="700" fontFamily="sans-serif">3</text>
            <text x="100" y="176" textAnchor="middle" fill="#F9EAD7" fontSize="11" fontWeight="700" fontFamily="sans-serif">6</text>
            <text x="28" y="104" textAnchor="middle" fill="#F9EAD7" fontSize="11" fontWeight="700" fontFamily="sans-serif">9</text>

            {/* Hour Hand */}
            <g transform={`rotate(${hourDeg} 100 100)`}>
              <line x1="100" y1="100" x2="100" y2="52" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="100" y1="100" x2="100" y2="52" stroke="#F9EAD7" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Minute Hand */}
            <g transform={`rotate(${minuteDeg} 100 100)`}>
              <line x1="100" y1="100" x2="100" y2="36" stroke="#AAC1B1" strokeWidth="3.5" strokeLinecap="round" />
            </g>

            {/* Real-time Ticking Second Hand */}
            <g transform={`rotate(${secondDeg} 100 100)`} className="transition-transform duration-200 ease-out">
              <line x1="100" y1="115" x2="100" y2="26" stroke="#F9EAD7" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="100" cy="26" r="3" fill="#F9EAD7" />
            </g>

            {/* Center Pivot Cap */}
            <circle cx="100" cy="100" r="7" fill="#748469" stroke="#ffffff" strokeWidth="2" />
            <circle cx="100" cy="100" r="2.5" fill="#F9EAD7" />
          </svg>
        </div>

        {/* Headline & Branding */}
        <div className="anim-fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="font-heading font-extrabold text-3xl xl:text-4xl tracking-tight text-slate-900">
            Deadline<span className="brand-shimmer">Hub</span>
          </span>
        </div>
        <h1 className="mt-2 text-lg xl:text-xl font-heading font-semibold text-slate-100 leading-snug max-w-lg anim-fade-up" style={{ animationDelay: '0.2s' }}>
          {headline}
        </h1>
        <p className="mt-2 text-slate-200/90 text-xs xl:text-sm leading-relaxed max-w-md anim-fade-up" style={{ animationDelay: '0.3s' }}>
          {subtext}
        </p>
      </div>

      {/* Bottom Highlights */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-3 w-full max-w-2xl mx-auto anim-fade-up" style={{ animationDelay: '0.4s' }}>
        {highlights.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-[#F9EAD7]/40 hover:bg-white/15 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-xl bg-[#AAC1B1]/30 flex items-center justify-center shrink-0">
              <item.icon size={16} className="text-[#F9EAD7]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-tight">{item.label}</p>
              <p className="text-[11px] text-slate-200/80 leading-tight mt-0.5">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
