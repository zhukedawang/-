
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, Sentence } from '../types';
import { generateSpeech } from '../services/geminiService';

interface PlayerProps {
  lesson: Lesson;
  onBack: () => void;
}

const Player: React.FC<PlayerProps> = ({ lesson, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeSentenceRef = useRef<HTMLDivElement>(null);

  // 初始化 AudioContext，并尝试在静默状态下唤醒
  useEffect(() => {
    const initAudio = () => {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !audioContextRef.current) {
        audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
    };

    initAudio();
    
    // 手机端监听任意触摸来尝试解锁 Context
    const unlock = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('touchstart', unlock);

    return () => {
      audioContextRef.current?.close();
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // 改进的 PCM 解码逻辑
  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    // 确保数据长度是 2 的倍数（16位 PCM）
    const bufferLength = Math.floor(data.byteLength / 2);
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, bufferLength);
    
    const buffer = ctx.createBuffer(1, bufferLength, 24000);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferLength; i++) {
      // 归一化 PCM 16bit 数据到 [-1.0, 1.0]
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const playSentence = useCallback(async (index: number) => {
    if (!audioContextRef.current || !isPlaying) return;
    
    // 关键：在播放每一句前再次确保 Context 是运行状态
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setError(null);
    setLoadingAudio(true);
    const sentence = lesson.sentences[index];
    const fullText = `${sentence.original}。${sentence.translation}`;
    
    try {
      const audioBytes = await generateSpeech(fullText);
      setLoadingAudio(false);
      
      if (!audioBytes || !isPlaying) return;

      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch (e) {}
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
    } catch (err) {
      console.error("Playback error:", err);
      setError("语音生成失败，请检查网络或 API Key");
      setLoadingAudio(false);
      setIsPlaying(false);
    }
  }, [lesson, isPlaying, isLooping]);

  useEffect(() => {
    if (isPlaying) {
      playSentence(currentIndex);
    } else {
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch (e) {}
      }
    }
    return () => {
      try { currentSourceRef.current?.stop(); } catch (e) {}
    };
  }, [currentIndex, isPlaying, playSentence]);

  useEffect(() => {
    activeSentenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentIndex]);

  const togglePlay = async () => {
    // 极其重要：在用户点击回调的第一时间 resume()，这符合浏览器安全策略
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    }
    setIsPlaying(!isPlaying);
  };
  
  const toggleLoop = () => setIsLooping(!isLooping);

  return (
    <div className="flex-1 bg-neutral-900 text-white flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-neutral-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
        <button onClick={onBack} className="p-2 -ml-2 text-white/70">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center flex-1 mx-4 overflow-hidden">
          <h1 className="font-serif-sc text-lg font-bold truncate">{lesson.title}</h1>
          <p className="text-[10px] text-white/40 tracking-widest uppercase">{loadingAudio ? '正在生成语音...' : (lesson.author || 'AI 助听中')}</p>
        </div>
        <button onClick={toggleLoop} className={`p-2 rounded-full transition-colors ${isLooping ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-white/30 hover:text-white/60'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Lyrics Content */}
      <div className="flex-1 overflow-y-auto px-8 py-12 space-y-16">
        {lesson.sentences.map((s, idx) => (
          <div 
            key={s.id} 
            ref={idx === currentIndex ? activeSentenceRef : null}
            onClick={() => {
              setCurrentIndex(idx);
              if (!isPlaying) setIsPlaying(true);
            }}
            className={`transition-all duration-700 cursor-pointer ${
              idx === currentIndex 
                ? 'scale-105 opacity-100' 
                : 'opacity-20 grayscale'
            }`}
          >
            <p className={`text-2xl font-serif-sc leading-relaxed mb-4 ${idx === currentIndex ? 'text-white' : 'text-white/80'}`}>
              {s.original}
            </p>
            <p className={`text-lg font-medium italic ${idx === currentIndex ? 'text-blue-400' : 'text-white/40'}`}>
              {s.translation}
            </p>
          </div>
        ))}
        <div className="h-40"></div> {/* 底部留白 */}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-500/90 text-white text-xs p-3 rounded-xl backdrop-blur-sm z-50 text-center animate-bounce">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="p-8 pb-12 bg-gradient-to-t from-black via-neutral-900 to-transparent">
        <div className="flex items-center justify-center gap-10">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="p-3 text-white/80 active:scale-90 disabled:opacity-10"
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button 
            onClick={togglePlay}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-300 ${isPlaying ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}
          >
            {loadingAudio ? (
              <div className="w-10 h-10 border-4 border-slate-300/30 border-t-white rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg className="w-12 h-12 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-12 h-12 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button 
            disabled={currentIndex === lesson.sentences.length - 1}
            onClick={() => setCurrentIndex(prev => Math.min(lesson.sentences.length - 1, prev + 1))}
            className="p-3 text-white/80 active:scale-90 disabled:opacity-10"
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-10 flex items-center gap-4">
          <span className="text-[10px] text-white/40 font-mono w-10">{currentIndex + 1}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${((currentIndex + 1) / lesson.sentences.length) * 100}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-white/40 font-mono w-10 text-right">{lesson.sentences.length}</span>
        </div>
      </div>
    </div>
  );
};

export default Player;
