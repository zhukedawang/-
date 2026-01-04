
export interface Sentence {
  original: string;
  translation: string;
  id: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: 'middle' | 'high' | 'english' | 'custom';
  author?: string;
  sentences: Sentence[];
}

export interface Schedule {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  enabled: boolean;
  repeatDays: number[]; // 0-6 (Sun-Sat)
}

export type ViewMode = 'home' | 'player' | 'scheduler' | 'library' | 'scanner';

export interface AppState {
  currentView: ViewMode;
  currentLesson: Lesson | null;
  schedules: Schedule[];
  isAutoModeArmed: boolean;
}
