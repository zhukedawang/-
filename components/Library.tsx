
import React, { useState } from 'react';
import { Lesson } from '../types';
import { MOCK_LESSONS } from '../constants';

interface LibraryProps {
  onSelect: (lesson: Lesson) => void;
  onBack: () => void;
}

const Library: React.FC<LibraryProps> = ({ onSelect, onBack }) => {
  const [activeTab, setActiveTab] = useState<'middle' | 'high' | 'english'>('middle');

  const filtered = MOCK_LESSONS.filter(l => l.category === activeTab);

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10 border-b">
        <button onClick={onBack} className="p-2 text-slate-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold">文库</h1>
      </div>

      <div className="flex p-2 gap-1 bg-slate-50 rounded-xl m-4">
        {(['middle', 'high', 'english'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-slate-500'
            }`}
          >
            {tab === 'middle' ? '初中' : tab === 'high' ? '高中' : '英语'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-3">
        {filtered.length > 0 ? filtered.map(lesson => (
          <div 
            key={lesson.id}
            onClick={() => onSelect(lesson)}
            className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
          >
            <div>
              <h3 className="font-serif-sc font-bold text-lg">{lesson.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{lesson.author} · {lesson.sentences.length} 句</p>
            </div>
            <div className="text-blue-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        )) : (
          <div className="p-20 text-center space-y-4">
            <div className="text-slate-300">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-slate-400 text-sm">该分类下暂无内容</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
