
import React from 'react';
import { AppState, ViewMode } from '../types';

interface HomeProps {
  state: AppState;
  setView: (view: ViewMode) => void;
  toggleAutoMode: () => void;
}

const Home: React.FC<HomeProps> = ({ state, setView, toggleAutoMode }) => {
  const currentLesson = state.currentLesson;
  const activeSchedules = state.schedules.filter(s => s.enabled);

  return (
    <div className="flex-1 p-6 space-y-8 overflow-y-auto">
      <header className="flex items-center justify-between border-b-2 border-[#D4AF37]/30 pb-4">
        <div>
          <h1 className="text-3xl font-black text-[#8B0000] tracking-tighter">熏听。</h1>
          <p className="text-[#D4AF37] font-western italic text-xs tracking-widest uppercase">The Classical Listener</p>
        </div>
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] p-1">
          <div className="w-full h-full rounded-full bg-[#8B0000] flex items-center justify-center text-[#D4AF37]">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
          </div>
        </div>
      </header>

      {/* Auto Mode Control - Red & Gold Theme */}
      <section className={`p-6 rounded-none border-gold-double transition-all shadow-2xl relative overflow-hidden ${state.isAutoModeArmed ? 'bg-[#8B0000] text-[#D4AF37]' : 'bg-white text-slate-900'}`}>
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#D4AF37]/20"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h2 className={`text-xl font-bold ${state.isAutoModeArmed ? 'gold-text-glow' : 'text-[#8B0000]'}`}>定时熏听系统</h2>
          <button 
            onClick={toggleAutoMode}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors border-2 ${state.isAutoModeArmed ? 'bg-[#D4AF37] border-white' : 'bg-slate-200 border-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-[#8B0000] transition-transform ${state.isAutoModeArmed ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        
        <p className={`text-sm mb-6 leading-relaxed ${state.isAutoModeArmed ? 'text-[#FDF5E6]/80' : 'text-slate-500'}`}>
          系统已准备就绪。设定时刻，智慧将如约而至。
        </p>

        <div className="space-y-3">
          {activeSchedules.map(s => (
            <div key={s.id} className={`flex items-center gap-3 text-xs font-bold tracking-widest uppercase ${state.isAutoModeArmed ? 'text-white' : 'text-[#8B0000]'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
              <span>{s.name}: {s.startTime}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Play - Parchment Style */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase">最近阅听</h2>
        {currentLesson ? (
          <div 
            onClick={() => setView('player')}
            className="bg-[#FDF5E6] p-5 border-l-4 border-[#8B0000] shadow-md flex items-center gap-4 active:translate-x-2 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 bg-[#8B0000] text-[#D4AF37] flex items-center justify-center font-bold text-2xl shadow-inner border border-[#D4AF37]/30">
              {currentLesson.title[0]}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#8B0000]">{currentLesson.title}</h3>
              <p className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-tighter italic">Classical Volume</p>
            </div>
            <div className="text-[#8B0000] group-hover:scale-125 transition-transform">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        ) : (
          <div className="p-10 border-2 border-dashed border-[#D4AF37]/30 rounded-lg text-center text-[#D4AF37]">
            书架空空，虚位以待
          </div>
        )}
      </section>

      {/* Progress */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase">研习进度</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#8B0000] p-4 text-[#D4AF37] border border-[#D4AF37]/30">
            <div className="font-bold text-lg">文言必背</div>
            <div className="text-white/60 text-[10px] mt-1 uppercase">Achievement 65%</div>
            <div className="mt-3 h-0.5 w-full bg-white/10">
              <div className="h-full bg-[#D4AF37] w-[65%]"></div>
            </div>
          </div>
          <div className="bg-white p-4 border-gold-double">
            <div className="text-[#8B0000] font-bold text-lg">英语短篇</div>
            <div className="text-slate-400 text-[10px] mt-1 uppercase">Achievement 20%</div>
            <div className="mt-3 h-0.5 w-full bg-slate-100">
              <div className="h-full bg-[#8B0000] w-[20%]"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
