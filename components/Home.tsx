
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">你好，同学</h1>
          <p className="text-slate-500 text-sm">今天是熏听学习的好时机</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
      </header>

      {/* Auto Mode Control */}
      <section className={`p-6 rounded-3xl transition-all border-2 ${state.isAutoModeArmed ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200' : 'bg-white text-slate-900 border-slate-100 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">定时自动熏听</h2>
          <button 
            onClick={toggleAutoMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${state.isAutoModeArmed ? 'bg-white' : 'bg-slate-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-blue-600 transition-transform ${state.isAutoModeArmed ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <p className={`text-sm mb-6 ${state.isAutoModeArmed ? 'text-blue-100' : 'text-slate-500'}`}>
          开启后，到点将自动全屏播放当日课文，充分利用碎片时间。
        </p>
        <div className="space-y-2">
          {activeSchedules.map(s => (
            <div key={s.id} className={`flex items-center gap-3 text-sm font-medium ${state.isAutoModeArmed ? 'text-white' : 'text-slate-700'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{s.name}: {s.startTime} - {s.endTime}</span>
            </div>
          ))}
          {activeSchedules.length === 0 && (
            <p className="text-xs opacity-60">暂无已启用的定时任务</p>
          )}
        </div>
      </section>

      {/* Continue Learning */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">最近播放</h2>
          <button onClick={() => setView('library')} className="text-blue-600 text-sm font-medium">查看全部</button>
        </div>
        {currentLesson ? (
          <div 
            onClick={() => setView('player')}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-16 h-16 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-serif-sc font-bold text-xl">
              {currentLesson.title[0]}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{currentLesson.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{currentLesson.category === 'middle' ? '初中必背' : '高中必背'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        ) : (
          <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
            暂无历史记录
          </div>
        )}
      </section>

      {/* Learning Paths */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">学习进度</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <div className="text-emerald-600 font-bold text-lg">初中必背</div>
            <div className="text-slate-500 text-xs mt-1">已完成 65%</div>
            <div className="mt-3 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[65%]"></div>
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <div className="text-indigo-600 font-bold text-lg">英语短篇</div>
            <div className="text-slate-500 text-xs mt-1">已完成 20%</div>
            <div className="mt-3 h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[20%]"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
