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

export interface AppState {
  storedItems: StoredItem[];
  workoutItems: WorkoutItem[];
  groupItems: GroupItem[];
  currentLanguage: string | null;
  audioSettings: AudioSettings;
  userProfile: UserProfile;
}
