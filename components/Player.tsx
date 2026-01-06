
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
  const [loadingSpeechId, setLoadingSpeechId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeSentenceRef = useRef<HTMLDivElement>(null);
  const isComponentMounted = useRef(true);

  // 初始化并确保音频上下文激活
  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  useEffect(() => {
    isComponentMounted.current = true;
    const unlock = () => ensureAudioContext();
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    return () => {
      isComponentMounted.current = false;
      audioContextRef.current?.close();
    };
  }, [ensureAudioContext]);

  const decodeAudioData = (data: Uint8Array, ctx: AudioContext): AudioBuffer => {
    const bufferLength = Math.floor(data.byteLength / 2);
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, bufferLength);
    const buffer = ctx.createBuffer(1, bufferLength, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bufferLength; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const stopAllAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {}
      currentSourceRef.current = null;
    }
    setActiveSpeechId(null);
  };

  // 单句点读功能
  const speakSentence = async (text: string, id: string) => {
    try {
      const ctx = await ensureAudioContext();
      stopAllAudio();
      setIsPlaying(false);
      setLoadingSpeechId(id);
      setStatusMsg("AI 正在备嗓...");

      const audioBytes = await generateSpeech(text);
      if (!isComponentMounted.current) return;
      setLoadingSpeechId(null);

      if (!audioBytes) {
        setStatusMsg("AI 乐师暂时缺席，请重试");
        return;
      }

      const buffer = decodeAudioData(audioBytes, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setActiveSpeechId(null);
      
      currentSourceRef.current = source;
      setActiveSpeechId(id);
      setStatusMsg(null);
      source.start(0);
    } catch (err) {
      setLoadingSpeechId(null);
      setStatusMsg("音频传唤失败");
    }
  };

  // 自动朗读逻辑 (熏听模式)
  const playNextSentence = useCallback(async (index: number) => {
    if (!isPlaying || !isComponentMounted.current) return;

    try {
      const ctx = await ensureAudioContext();
      setLoadingAudio(true);
      setStatusMsg(`正在研读第 ${index + 1} 章...`);
      
      const sentence = lesson.sentences[index];
      // 自动朗读模式下，将原文和译文拼接在一起朗读
      const fullText = `${sentence.original}。意思是：${sentence.translation}`;
      
      const audioBytes = await generateSpeech(fullText);
      if (!isComponentMounted.current || !isPlaying) return;
      setLoadingAudio(false);

      if (!audioBytes) {
        // 如果失败，尝试跳到下一句而不是报错停止
        console.warn("Speech failed for index", index);
        setTimeout(() => {
          if (index + 1 < lesson.sentences.length) {
            setCurrentIndex(index + 1);
          } else {
            setIsPlaying(false);
          }
        }, 1000);
        return;
      }

      const buffer = decodeAudioData(audioBytes, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        if (!isComponentMounted.current) return;
        if (isLooping) {
          playNextSentence(index);
        } else {
          const next = index + 1;
          if (next < lesson.sentences.length) {
            setCurrentIndex(next);
          } else {
            setIsPlaying(false);
            setStatusMsg("全篇诵读完毕");
          }
        }
      };

      stopAllAudio();
      currentSourceRef.current = source;
      source.start(0);
      setStatusMsg(null);
    } catch (err) {
      setLoadingAudio(false);
      setStatusMsg("朗读中断，请检查设置");
    }
  }, [lesson, isPlaying, isLooping, ensureAudioContext]);

  useEffect(() => {
    if (isPlaying) {
      playNextSentence(currentIndex);
    } else {
      if (!activeSpeechId) stopAllAudio();
    }
  }, [currentIndex, isPlaying, playNextSentence, activeSpeechId]);

  useEffect(() => {
    activeSentenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentIndex]);

  const toggleAutoPlay = async () => {
    await ensureAudioContext();
    if (activeSpeechId) stopAllAudio();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex-1 bg-[#FDF5E6] flex flex-col overflow-hidden relative border-[8px] border-[#8B0000] m-1 shadow-[inset_0_0_50px_rgba(0,0,0,0.1)]">
      {/* Classical Header */}
      <div className="p-4 flex items-center justify-between bg-[#8B0000] text-[#D4AF37] border-b-2 border-[#D4AF37] z-30">
        <button onClick={onBack} className="p-2 active:scale-90 transition-transform">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-xl font-bold tracking-tight gold-text-glow">{lesson.title}</h1>
          <p className="text-[9px] font-western italic tracking-widest uppercase opacity-60">
            {statusMsg || (lesson.author ? `Author: ${lesson.author}` : 'Classical Selection')}
          </p>
        </div>
        <button 
          onClick={() => setIsLooping(!isLooping)} 
          className={`p-2 rounded-full border transition-all ${isLooping ? 'bg-[#D4AF37] text-[#8B0000]' : 'text-[#D4AF37]/40 border-transparent'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Main Content - Scroll Vibe */}
      <div className="flex-1 overflow-y-auto px-8 py-12 space-y-24 scroll-smooth">
        {lesson.sentences.map((s, idx) => {
          const isCurrent = idx === currentIndex;
          const isOrigPlaying = activeSpeechId === `${s.id}-orig`;
          const isOrigLoading = loadingSpeechId === `${s.id}-orig`;

          return (
            <div 
              key={s.id} 
              ref={isCurrent ? activeSentenceRef : null}
              className={`transition-all duration-1000 flex flex-col items-center text-center ${
                isCurrent ? 'opacity-100 scale-105' : 'opacity-10 grayscale-[0.8] blur-[0.5px]'
              }`}
            >
              <div className="relative mb-6">
                <p className={`text-3xl font-bold leading-relaxed mb-6 ${isCurrent ? 'text-[#8B0000]' : 'text-black'}`}>
                  {s.original}
                </p>
                <button 
                  onClick={() => speakSentence(s.original, `${s.id}-orig`)}
                  className={`mx-auto w-14 h-14 rounded-full border-2 border-[#D4AF37] flex items-center justify-center transition-all active:scale-90 shadow-lg ${
                    isOrigPlaying ? 'bg-[#8B0000] text-[#D4AF37] animate-pulse' : 'bg-white text-[#8B0000]'
                  }`}
                >
                  {isOrigLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                  )}
                </button>
              </div>
              <p className={`text-lg font-western italic leading-relaxed px-4 ${isCurrent ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                {s.translation}
              </p>
            </div>
          );
        })}
        <div className="h-64"></div>
      </div>

      {/* Control Panel - Gilded Bar */}
      <div className="bg-[#8B0000] p-8 pb-12 border-t-4 border-[#D4AF37] z-40 relative shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        {/* Progress Indication */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-[#D4AF37] transition-all duration-700 shadow-[0_0_15px_#D4AF37]" 
            style={{ width: `${((currentIndex + 1) / lesson.sentences.length) * 100}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[#D4AF37]/50 text-[10px] font-western uppercase tracking-widest mb-6">
          <span>Cantos {currentIndex + 1}</span>
          <span>Total {lesson.sentences.length}</span>
        </div>

        <div className="flex items-center justify-center gap-10">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="p-3 text-[#D4AF37]/50 active:text-[#D4AF37] disabled:opacity-10"
          >
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button 
            onClick={toggleAutoPlay}
            className={`w-24 h-24 rounded-full border-4 border-[#D4AF37] flex items-center justify-center shadow-2xl transition-all duration-500 active:scale-95 ${
              isPlaying ? 'bg-[#FDF5E6] text-[#8B0000]' : 'bg-[#D4AF37] text-[#8B0000]'
            }`}
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
            onClick={() => setCurrentIndex(prev => Math.min(lesson.sentences.length - 1, prev + 1))}
            className="p-3 text-[#D4AF37]/50 active:text-[#D4AF37] disabled:opacity-10"
          >
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
      </div>

      {/* Status Overlay */}
      {statusMsg && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-[#8B0000] border border-[#D4AF37] text-[#D4AF37] px-6 py-2 shadow-2xl z-50 rounded-full text-xs font-bold tracking-widest animate-bounce">
          {statusMsg}
        </div>
      )}
    </div>
  );
};

export default Player;
