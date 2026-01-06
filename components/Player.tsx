
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
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeSentenceRef = useRef<HTMLDivElement>(null);

  // 初始化并尝试在用户触摸时解锁 AudioContext
  useEffect(() => {
    const initAudio = () => {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !audioContextRef.current) {
        audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
    };

    initAudio();

    // 针对 iOS 的全页面解锁
    const unlock = async () => {
      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        // 播放一段极短的静音来测试激活
        const buffer = audioContextRef.current.createBuffer(1, 1, 24000);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
      }
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    // 处理字节对齐，PCM 16bit 每采样占 2 字节
    const bufferLength = Math.floor(data.byteLength / 2);
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, bufferLength);
    
    const buffer = ctx.createBuffer(1, bufferLength, 24000);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferLength; i++) {
      // 将 16-bit 有符号整数 (-32768 to 32767) 映射到 (-1.0 to 1.0)
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const speakText = async (text: string, id: string) => {
    if (!audioContextRef.current) return;
    
    // 关键：在同步点击回调中立即 resume，这是移动端浏览器的要求
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) setIsPlaying(false);
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (e) {}
    }

    setActiveSpeechId(id);
    setError(null);

    try {
      const audioBytes = await generateSpeech(text);
      if (!audioBytes) throw new Error("Audio generation failed");

      // 再次检查 Context 状态，防止在异步等待期间被挂起
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const buffer = await decodeAudioData(audioBytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setActiveSpeechId(null);
      };

      currentSourceRef.current = source;
      source.start(0);
    } catch (err) {
      console.error("Single speak error:", err);
      setError("单句朗读失败，请重试");
      setActiveSpeechId(null);
    }
  };

  const playSentence = useCallback(async (index: number) => {
    if (!audioContextRef.current || !isPlaying) return;
    
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
      setError("网络连接不稳定");
      setLoadingAudio(false);
      setIsPlaying(false);
    }
  }, [lesson, isPlaying, isLooping]);

  useEffect(() => {
    if (isPlaying) {
      playSentence(currentIndex);
    } else {
      if (currentSourceRef.current && !activeSpeechId) {
        try { currentSourceRef.current.stop(); } catch (e) {}
      }
    }
    return () => {
      if (!activeSpeechId) try { currentSourceRef.current?.stop(); } catch (e) {}
    };
  }, [currentIndex, isPlaying, playSentence, activeSpeechId]);

  useEffect(() => {
    activeSentenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentIndex]);

  const togglePlay = async () => {
    // 手机端关键步骤：在 click 回调的第一行 resume
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    }
    if (activeSpeechId) setActiveSpeechId(null);
    setIsPlaying(!isPlaying);
  };
  
  const toggleLoop = () => setIsLooping(!isLooping);

  return (
    <div className="flex-1 bg-neutral-900 text-white flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-neutral-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <button onClick={onBack} className="p-2 -ml-2 text-white/70">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center flex-1 mx-4 overflow-hidden">
          <h1 className="font-serif-sc text-lg font-bold truncate">{lesson.title}</h1>
          <p className="text-[10px] text-white/40 tracking-widest uppercase">
            {activeSpeechId ? '点读中' : loadingAudio ? '准备音频' : (lesson.author || 'AI 助听')}
          </p>
        </div>
        <button onClick={toggleLoop} className={`p-2 rounded-full transition-colors ${isLooping ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-white/30 hover:text-white/60'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Lyrics Content */}
      <div className="flex-1 overflow-y-auto px-8 py-12 space-y-24 scroll-smooth">
        {lesson.sentences.map((s, idx) => (
          <div 
            key={s.id} 
            ref={idx === currentIndex ? activeSentenceRef : null}
            className={`transition-all duration-700 relative ${
              idx === currentIndex 
                ? 'scale-105 opacity-100' 
                : 'opacity-20'
            }`}
          >
            <div className="relative mb-6">
              <p className={`text-2xl font-serif-sc leading-relaxed pr-10 ${idx === currentIndex ? 'text-white' : 'text-white/80'}`}>
                {s.original}
              </p>
              <button 
                onClick={() => speakText(s.original, `${s.id}-orig`)}
                className={`absolute -right-2 top-0 p-3 rounded-full transition-all active:scale-90 ${
                  activeSpeechId === `${s.id}-orig` 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-white/5 text-white/20'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              </button>
            </div>

            <div className="relative">
              <p className={`text-lg font-medium italic pr-10 ${idx === currentIndex ? 'text-blue-400' : 'text-white/40'}`}>
                {s.translation}
              </p>
              <button 
                onClick={() => speakText(s.translation, `${s.id}-trans`)}
                className={`absolute -right-2 top-0 p-3 rounded-full transition-all active:scale-90 ${
                  activeSpeechId === `${s.id}-trans` 
                    ? 'bg-emerald-500 text-white animate-pulse' 
                    : 'bg-white/5 text-white/10'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              </button>
            </div>
          </div>
        ))}
        <div className="h-64"></div>
      </div>

      {/* Error Info */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-[10px] px-4 py-2 rounded-full backdrop-blur-md z-50">
          {error}
        </div>
      )}

      {/* Controls Container */}
      <div className="p-8 pb-14 bg-gradient-to-t from-black via-neutral-900 to-transparent pt-16 z-10">
        <div className="flex items-center justify-center gap-12">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="p-3 text-white/50 active:text-white disabled:opacity-10"
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button 
            onClick={togglePlay}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-500 ${isPlaying ? 'bg-white text-black' : 'bg-blue-600 text-white shadow-blue-900/30'}`}
          >
            {loadingAudio ? (
              <div className="w-10 h-10 border-4 border-neutral-300/30 border-t-blue-500 rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg className="w-12 h-12 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-12 h-12 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button 
            disabled={currentIndex === lesson.sentences.length - 1}
            onClick={() => setCurrentIndex(prev => Math.min(lesson.sentences.length - 1, prev + 1))}
            className="p-3 text-white/50 active:text-white disabled:opacity-10"
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
        
        <div className="mt-12 px-6">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] text-white/30 font-mono">{currentIndex + 1}</span>
            <span className="text-[10px] text-white/30 font-mono">{lesson.sentences.length}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-700" 
              style={{ width: `${((currentIndex + 1) / lesson.sentences.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
