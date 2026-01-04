
import React from 'react';
import { Schedule } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface SchedulerProps {
  schedules: Schedule[];
  setSchedules: (s: Schedule[]) => void;
  onBack: () => void;
}

const Scheduler: React.FC<SchedulerProps> = ({ schedules, setSchedules, onBack }) => {
  const toggleEnabled = (id: string) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSchedule = (id: string, updates: Partial<Schedule>) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const toggleDay = (scheduleId: string, day: number) => {
    const s = schedules.find(x => x.id === scheduleId);
    if (!s) return;
    const newDays = s.repeatDays.includes(day) 
      ? s.repeatDays.filter(d => d !== day) 
      : [...s.repeatDays, day].sort();
    updateSchedule(scheduleId, { repeatDays: newDays });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="p-4 flex items-center gap-4 bg-white border-b">
        <button onClick={onBack} className="p-2 text-slate-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold">定时任务</h1>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        {schedules.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{s.name}</h3>
              <button 
                onClick={() => toggleEnabled(s.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">开始时间</label>
                <input 
                  type="time" 
                  value={s.startTime}
                  onChange={(e) => updateSchedule(s.id, { startTime: e.target.value })}
                  className="w-full bg-slate-50 p-2 rounded-lg font-mono text-lg outline-none"
                />
              </div>
              <div className="text-slate-300 pt-5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">结束时间</label>
                <input 
                  type="time" 
                  value={s.endTime}
                  onChange={(e) => updateSchedule(s.id, { endTime: e.target.value })}
                  className="w-full bg-slate-50 p-2 rounded-lg font-mono text-lg outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between gap-1">
              {DAYS_OF_WEEK.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(s.id, idx)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    s.repeatDays.includes(idx) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-medium flex items-center justify-center gap-2 active:bg-slate-100 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          添加新时段
        </button>
      </div>
    </div>
  );
};

export default Scheduler;
