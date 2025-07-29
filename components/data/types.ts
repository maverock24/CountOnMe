// Data types for the application
export interface StoredItem {
  key: string;
  value: string | null;
}

export interface WorkoutItem {
  name: string;
  workout: string;
  group?: string;
}

export interface GroupWorkoutItem {
  orderId: number;
  name: string;
}

export interface GroupItem {
  name: string;
  workouts: GroupWorkoutItem[];
}

export interface UserProfile {
  weight: string | null;
  fitnessLevel: string | null;
}

export interface AudioSettings {
  enabled: boolean;
  selectedActionMusic: string;
  selectedBreakMusic: string;
  selectedSuccessSound: string;
  selectedNextExerciseSound: string;
  currentMusicBeingPlayed: string | null;
}

// Timer-related types
export interface Timer {
  id: string;
  time: number;
  segment: string;
}

export interface TimerState {
  isRunning: boolean;
  currentTime: number;
  currentIndex: number;
  elapsedTime: number;
  timers: Timer[];
  stopped: boolean;
  disabled: boolean;
  selectedItem: string | null;
  progressKey: number;
}

export interface AppState {
  storedItems: StoredItem[];
  workoutItems: WorkoutItem[];
  groupItems: GroupItem[];
  currentLanguage: string | null;
  audioSettings: AudioSettings;
  userProfile: UserProfile;
  timerState: TimerState;
}
