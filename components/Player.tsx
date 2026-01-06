
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson } from '../types';
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
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeSentenceRef = useRef<HTMLDivElement>(null);
  const retryCount = useRef(0);

  // 初始化音频环境
  const initAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      if (audioContextRef.current.state === 'running') {
        setIsAudioUnlocked(true);
        setIsPlaying(true);
        return true;
      }
    } catch (e) {
      console.error("Audio unlock failed", e);
    }
    return false;
  }, []);

  const stopCurrentAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {}
      currentSourceRef.current = null;
    }
  };

  const decodeRawPCM = (data: Uint8Array, ctx: AudioContext): AudioBuffer => {
    const bufferLength = Math.floor(data.byteLength / 2);
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, bufferLength);
    const buffer = ctx.createBuffer(1, bufferLength, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bufferLength; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const playStep = useCallback(async (index: number) => {
    if (!isPlaying || !audioContextRef.current || audioContextRef.current.state !== 'running') return;

    setLoadingAudio(true);
    const s = lesson.sentences[index];
    const textToRead = `${s.original}。${s.translation}`;
    setStatusMsg(`乐师诵读中...`);

    try {
      const audioData = await generateSpeech(textToRead);
      setLoadingAudio(false);

      if (!audioData) throw new Error("Audio missing");

      stopCurrentAudio();
      const buffer = decodeRawPCM(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        retryCount.current = 0;
        if (isLooping) {
          playStep(index);
        } else if (index + 1 < lesson.sentences.length) {
          setCurrentIndex(index + 1);
        } else {
          setIsPlaying(false);
          setStatusMsg("全文诵毕");
        }
      };

      currentSourceRef.current = source;
      source.start(0);
      setStatusMsg(null);
    } catch (err) {
      console.error(err);
      setLoadingAudio(false);
      if (retryCount.current < 2) {
        retryCount.current++;
        setStatusMsg(`正在重试...`);
        setTimeout(() => playStep(index), 1000);
      } else {
        setStatusMsg("跳过此句");
        setTimeout(() => {
          if (index + 1 < lesson.sentences.length) setCurrentIndex(index + 1);
          else setIsPlaying(false);
        }, 800);
      }
    }
  }, [lesson, isPlaying, isLooping]);

  useEffect(() => {
    if (isPlaying && isAudioUnlocked) {
      playStep(currentIndex);
    } else {
      stopCurrentAudio();
    }
    return () => stopCurrentAudio();
  }, [currentIndex, isPlaying, isAudioUnlocked, playStep]);

  useEffect(() => {
    activeSentenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentIndex]);

  const handleStart = async () => {
    const success = await initAudio();
    if (!success) {
      alert("请确保您的浏览器允许音频播放");
    }
  };

  return (
    <div className="flex-1 bg-[#FDF5E6] flex flex-col overflow-hidden relative border-[12px] border-[#8B0000] m-1 shadow-inner h-screen">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>

      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-[#8B0000] text-[#D4AF37] border-b-4 border-[#D4AF37] z-30 shadow-xl">
        <button onClick={onBack} className="p-2 active:scale-75 transition-all">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black gold-text-glow tracking-tighter">{lesson.title}</h1>
          <p className="text-[10px] font-western italic opacity-60 tracking-[0.3em] uppercase">Scroll of Learning</p>
        </div>
        <button 
          onClick={() => setIsLooping(!isLooping)} 
          className={`p-2 rounded-full border transition-all ${isLooping ? 'bg-[#D4AF37] text-[#8B0000] shadow-[0_0_15px_#D4AF37]' : 'text-[#D4AF37]/30 border-transparent'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-20 space-y-32 no-scrollbar relative z-10">
        {lesson.sentences.map((s, idx) => (
          <div 
            key={s.id} 
            ref={idx === currentIndex ? activeSentenceRef : null}
            className={`transition-all duration-1000 text-center ${idx === currentIndex ? 'opacity-100 scale-110 blur-none' : 'opacity-5 blur-[2px] scale-95'}`}
          >
            <p className={`text-3xl font-black leading-relaxed mb-8 ${idx === currentIndex ? 'text-[#8B0000]' : 'text-black'}`}>
              {s.original}
            </p>
            <p className={`text-lg font-serif italic text-[#D4AF37] leading-relaxed max-w-xs mx-auto`}>
              {s.translation}
            </p>
          </div>
        ))}
        <div className="h-96"></div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-[#8B0000] p-8 pb-12 border-t-4 border-[#D4AF37] z-40 relative">
        <div className="flex items-center justify-center gap-12">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(p => p - 1)}
            className="text-[#D4AF37]/40 active:text-[#D4AF37] disabled:opacity-0 p-2"
          >
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button 
            onClick={isPlaying ? () => setIsPlaying(false) : handleStart}
            className={`w-24 h-24 rounded-full border-4 border-[#D4AF37] flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isPlaying ? 'bg-[#FDF5E6] text-[#8B0000]' : 'bg-[#D4AF37] text-[#8B0000]'}`}
          >
            {loadingAudio ? (
              <div className="w-10 h-10 border-4 border-[#8B0000]/20 border-t-[#8B0000] rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-12 h-12 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button 
            disabled={currentIndex === lesson.sentences.length - 1}
            onClick={() => setCurrentIndex(p => p + 1)}
            className="text-[#D4AF37]/40 active:text-[#D4AF37] disabled:opacity-0 p-2"
          >
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        <div className="mt-8 h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] transition-all duration-1000"
            style={{ width: `${((currentIndex + 1) / lesson.sentences.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Royal Unlock Overlay */}
      {!isAudioUnlocked && (
        <div className="absolute inset-0 bg-[#000]/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-12 text-center">
          <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] flex items-center justify-center mb-10 bg-[#8B0000] animate-gold-pulse">
            <svg className="w-16 h-16 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          <h2 className="text-[#D4AF37] text-3xl font-black mb-6 gold-text-glow tracking-widest">开启古典熏听</h2>
          <p className="text-white/50 text-base mb-12 leading-relaxed font-serif italic">“开卷有益，听书怡情。”<br/>由于浏览器安全策略，请点击下方开启声音</p>
          <button 
            onClick={handleStart}
            className="px-16 py-4 bg-[#D4AF37] text-[#8B0000] rounded-none border-2 border-white/20 font-black text-xl shadow-2xl active:scale-95 transition-transform"
          >
            开启熏听之旅
          </button>
        </div>
      )}

      {/* Floating Status */}
      {statusMsg && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#8B0000] px-6 py-2 rounded-full text-xs font-black uppercase z-50 border-2 border-[#8B0000] shadow-2xl animate-bounce">
          {statusMsg}
        </div>
      )}
    </div>
  );
};

export default Player;
