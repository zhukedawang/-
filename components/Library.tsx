
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
    <div className="flex-1 flex flex-col bg-[#FDF5E6]">
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-[#8B0000] text-[#D4AF37] z-30 border-b-2 border-[#D4AF37]/30 shadow-lg">
        <button onClick={onBack} className="p-2">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-black gold-text-glow tracking-tighter uppercase font-western italic">The Archive</h1>
      </div>

      <div className="flex p-1.5 gap-1 bg-black/5 rounded-none m-4 border-2 border-[#D4AF37]/20">
        {(['middle', 'high', 'english'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-[10px] font-bold tracking-widest uppercase transition-all ${
              activeTab === tab ? 'bg-[#8B0000] text-[#D4AF37] shadow-xl' : 'text-slate-400'
            }`}
          >
            {tab === 'middle' ? 'Junior' : tab === 'high' ? 'Senior' : 'English'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-4">
        {filtered.length > 0 ? filtered.map(lesson => (
          <div 
            key={lesson.id}
            onClick={() => onSelect(lesson)}
            className="p-5 border-2 border-gold-double bg-white active:bg-[#8B0000] active:text-[#D4AF37] group transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <h3 className="font-black text-[#8B0000] group-active:text-[#D4AF37] text-lg leading-tight">{lesson.title}</h3>
              <p className="text-[10px] font-western text-slate-400 mt-1 uppercase tracking-widest">{lesson.author} · {lesson.sentences.length} Units</p>
            </div>
            <div className="text-[#D4AF37]">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            </div>
          </div>
        )) : (
          <div className="p-20 text-center space-y-4">
            <p className="text-[#D4AF37] text-xs font-western tracking-widest uppercase opacity-40">No records found in this section</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
