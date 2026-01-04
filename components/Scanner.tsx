
import React, { useState, useRef } from 'react';
import { Lesson } from '../types';
import { recognizeBook, fetchLessonContent } from '../services/geminiService';

interface ScannerProps {
  onLessonFound: (lesson: Lesson) => void;
  onBack: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onLessonFound, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus('正在识别书籍...');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // 1. Recognize book
        const bookInfo = await recognizeBook(base64);
        if (!bookInfo || !bookInfo.suggestedLesson) {
          setStatus('识别失败，请确保拍摄清晰的书名或目录');
          setIsProcessing(false);
          return;
        }

        setStatus(`识别成功：${bookInfo.title}。正在提取《${bookInfo.suggestedLesson}》内容...`);
        
        // 2. Fetch content
        const lesson = await fetchLessonContent(bookInfo.suggestedLesson);
        if (lesson) {
          onLessonFound(lesson);
        } else {
          setStatus('获取课文内容失败，请重试');
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setStatus('发生错误，请重试');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white relative">
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onBack} className="p-2 text-white/80">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="font-bold">扫码/拍摄书籍</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12">
        {!isProcessing ? (
          <>
            <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative flex items-center justify-center">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -ml-1 -mt-1 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mr-1 -mt-1 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -ml-1 -mb-1 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mr-1 -mb-1 rounded-br-lg"></div>
              
              <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">拍摄书名或目录</h3>
              <p className="text-white/50 text-sm">AI将自动为您匹配必背内容并生成对照翻译</p>
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-12 py-4 bg-white text-black rounded-full font-bold shadow-xl active:scale-95 transition-transform"
            >
              拍照识别
            </button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <p className="text-lg font-medium">{status}</p>
              <p className="text-white/40 text-xs italic">正在为您构建专属熏听计划...</p>
            </div>
          </div>
        )}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleCapture}
        className="hidden"
      />
      
      <div className="p-8 text-center text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium mb-4">
        Powered by Gemini Multi-modal AI
      </div>
    </div>
  );
};

export default Scanner;
