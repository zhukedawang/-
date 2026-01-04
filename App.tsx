
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode, Lesson, AppState, Schedule } from './types';
import { MOCK_LESSONS } from './constants';
import Player from './components/Player';
import Home from './components/Home';
import Scheduler from './components/Scheduler';
import Library from './components/Library';
import Scanner from './components/Scanner';

const STORAGE_KEY = 'xunting_app_state_v1';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, currentView: 'home', isAutoModeArmed: false };
    }
    return {
      currentView: 'home',
      currentLesson: MOCK_LESSONS[0],
      schedules: [
        { id: '1', name: '早餐熏听', startTime: '07:00', endTime: '07:30', enabled: true, repeatDays: [1, 2, 3, 4, 5] },
        { id: '2', name: '午餐熏听', startTime: '12:00', endTime: '12:45', enabled: true, repeatDays: [1, 2, 3, 4, 5] }
      ],
      isAutoModeArmed: false
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setView = (view: ViewMode) => setState(prev => ({ ...prev, currentView: view }));
  const setCurrentLesson = (lesson: Lesson) => setState(prev => ({ ...prev, currentLesson: lesson, currentView: 'player' }));
  const setSchedules = (schedules: Schedule[]) => setState(prev => ({ ...prev, schedules }));
  const toggleAutoMode = () => setState(prev => ({ ...prev, isAutoModeArmed: !prev.isAutoModeArmed }));

  // Auto-start Logic
  useEffect(() => {
    if (!state.isAutoModeArmed) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentHhMm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay();

      const activeSchedule = state.schedules.find(s => 
        s.enabled && 
        s.repeatDays.includes(currentDay) && 
        s.startTime === currentHhMm
      );

      if (activeSchedule && state.currentView !== 'player') {
        console.log("Triggering auto-play for:", activeSchedule.name);
        setView('player');
      }
    };

    const timer = setInterval(checkSchedule, 60000); // Check every minute
    checkSchedule(); // Immediate check

    return () => clearInterval(timer);
  }, [state.isAutoModeArmed, state.schedules, state.currentView]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 max-w-md mx-auto shadow-xl">
      {/* Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {state.currentView === 'home' && (
          <Home 
            state={state} 
            setView={setView} 
            toggleAutoMode={toggleAutoMode} 
          />
        )}
        {state.currentView === 'player' && state.currentLesson && (
          <Player 
            lesson={state.currentLesson} 
            onBack={() => setView('home')} 
          />
        )}
        {state.currentView === 'scheduler' && (
          <Scheduler 
            schedules={state.schedules} 
            setSchedules={setSchedules} 
            onBack={() => setView('home')} 
          />
        )}
        {state.currentView === 'library' && (
          <Library 
            onSelect={setCurrentLesson} 
            onBack={() => setView('home')} 
          />
        )}
        {state.currentView === 'scanner' && (
          <Scanner 
            onLessonFound={(lesson) => {
              setCurrentLesson(lesson);
            }} 
            onBack={() => setView('home')} 
          />
        )}
      </main>

      {/* Navigation Bar */}
      {state.currentView !== 'player' && state.currentView !== 'scanner' && (
        <nav className="h-16 bg-white border-t flex items-center justify-around px-2 sticky bottom-0 z-50">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${state.currentView === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-xs">首页</span>
          </button>
          <button 
            onClick={() => setView('library')}
            className={`flex flex-col items-center gap-1 transition-colors ${state.currentView === 'library' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span className="text-xs">文库</span>
          </button>
          <button 
            onClick={() => setView('scanner')}
            className="flex flex-col items-center justify-center -mt-8 bg-blue-600 w-14 h-14 rounded-full text-white shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button 
            onClick={() => setView('scheduler')}
            className={`flex flex-col items-center gap-1 transition-colors ${state.currentView === 'scheduler' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs">定时</span>
          </button>
          <div className="w-12"></div> {/* Placeholder for profile or extra */}
        </nav>
      )}
    </div>
  );
};

export default App;
