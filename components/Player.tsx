
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, Sentence } from '../types';
import { generateSpeech } from '../services/geminiService';

interface PlayerProps {
  lesson: Lesson;
  onBack: () => void;
}

const Player: React.FC<PlayerProps> = ({ lesson, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeSentenceRef = useRef<HTMLDivElement>(null);

  // Initialize Audio Context
  useEffect(() => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const playSentence = useCallback(async (index: number) => {
    if (!audioContextRef.current || !isPlaying) return;
    
    // Resume context if it was suspended (common on mobile)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setLoadingAudio(true);
    const sentence = lesson.sentences[index];
    const fullText = `${sentence.original}. ${sentence.translation}`;
    
    const audioBytes = await generateSpeech(fullText);
    setLoadingAudio(false);
    
    if (!audioBytes) return;

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Source might already be stopped
      }
    }

    const buffer = await decodeAudioData(audioBytes, audioContextRef.current);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (isLooping) {
        playSentence(index);
      } else {
        const next = index + 1;
        if (next < lesson.sentences.length) {
          setCurrentIndex(next);
        } else {
          setIsPlaying(false);
        }
      }
    };

    currentSourceRef.current = source;
    source.start(0);
  }, [lesson, isPlaying, isLooping]);

  useEffect(() => {
    if (isPlaying) {
      playSentence(currentIndex);
    } else {
      currentSourceRef.current?.stop();
    }
    return () => {
      try {
        currentSourceRef.current?.stop();
      } catch (e) {}
    };
  }, [currentIndex, isPlaying, playSentence]);

  useEffect(() => {
    activeSentenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentIndex]);

  const togglePlay = async () => {
    if (!isPlaying && audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };
  
  const toggleLoop = () => setIsLooping(!isLooping);

  return (
    <div className="flex-1 bg-neutral-900 text-white flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-neutral-900/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-white/70 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center flex-1">
          <h1 className="font-serif-sc text-lg font-bold truncate">{lesson.title}</h1>
          <p className="text-xs text-white/50">{lesson.author || '自动获取内容'}</p>
        </div>
        <button onClick={toggleLoop} className={`p-2 rounded-full ${isLooping ? 'bg-blue-600 text-white' : 'text-white/40'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Lyrics Content */}
      <div className="flex-1 overflow-y-auto px-6 py-20 space-y-12">
        {lesson.sentences.map((s, idx) => (
          <div 
            key={s.id} 
            ref={idx === currentIndex ? activeSentenceRef : null}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-500 cursor-pointer ${
              idx === currentIndex 
                ? 'scale-105 opacity-100' 
                : 'opacity-25 grayscale'
            }`}
          >
            <p className={`text-2xl font-serif-sc leading-relaxed mb-3 ${idx === currentIndex ? 'text-white' : 'text-white/80'}`}>
              {s.original}
            </p>
            <p className={`text-lg font-medium italic ${idx === currentIndex ? 'text-yellow-400' : 'text-yellow-400/60'}`}>
              {s.translation}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="p-8 pb-12 bg-gradient-to-t from-neutral-900 via-neutral-900/90 to-transparent">
        <div className="flex items-center justify-center gap-8">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="p-3 text-white active:scale-90 disabled:opacity-20"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
          >
            {loadingAudio ? (
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg className="w-10 h-10 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-10 h-10 ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button 
            disabled={currentIndex === lesson.sentences.length - 1}
            onClick={() => setCurrentIndex(prev => Math.min(lesson.sentences.length - 1, prev + 1))}
            className="p-3 text-white active:scale-90 disabled:opacity-20"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-8 flex items-center gap-3 text-[10px] text-white/40 font-mono tracking-widest uppercase">
          <span>{currentIndex + 1} / {lesson.sentences.length}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / lesson.sentences.length) * 100}%` }}
            ></div>
          </div>
          <span>SLIDE TO SEEK</span>
        </div>
      </div>
    </div>
  );
};

export default Player;
