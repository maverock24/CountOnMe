import React, { ReactNode, createContext, useContext } from 'react';
import {
  breakMusic as breakMusicData,
  language as languageData,
  successSound as successSoundData,
  workoutMusic as workoutMusicData,
} from '../../constants/media';
import { storageService } from '../../services/StorageService';
import { WorkoutItem } from '../data/types';
import { useSound } from '../sound.provider';
import { AudioProvider, useAudio } from './AudioProvider';
import { TimerProvider, useTimer } from './TimerProvider';
import { WorkoutProvider, useWorkout } from './WorkoutProvider';

interface CombinedDataProviderProps {
  children: ReactNode;
}

export interface CombinedDataContextType {
  // Timer state
  timerIsRunning: boolean;
  timerCurrentTime: number;
  timerCurrentIndex: number;
  timerElapsedTime: number;
  timers: any[];
  timerStopped: boolean;
  timerDisabled: boolean;
  timerSelectedItem: string | null;
  timerProgressKey: string | null;
  
  // Timer actions
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setTimers: (timers: any[]) => void;
  setTimerSelectedItem: (item: string | null) => void;
  updateTimerTime: (time: number) => void;
  setCurrentIndex: (index: number) => void;
  incrementElapsedTime: () => void;
  setWorkoutCompleteCallback: (callback: (() => void) | null) => void;
  handleWorkoutCompleteFlow: (orderedWorkouts: any[]) => Promise<void>;
  getCurrentSegment: () => string | null;
  getTotalTime: () => number;
  
  // Audio coordination
  handleTimerStart: (isRunning: boolean, currentSegment?: string, isAutoTransition?: boolean) => Promise<void>;
  handleTimerStop: () => Promise<void>;
  handleTimerReset: () => Promise<void>;
  handleTimerSegmentChange: (segment: string) => Promise<void>;
  handleAudioToggle: (enabled: boolean, isRunning: boolean, currentSegment?: string) => Promise<void>;
  
  // Audio state
  audioEnabled: boolean;
  audioReady: boolean;
  currentMusicBeingPlayed: string | null;
  currentLanguage: string | null;
  userWeight: string | null;
  fitnessLevel: string | null;
  selectedWorkoutFile: any;
  selectedBreakFile: any;
  
  // Audio actions
  setAudioEnabled: (enabled: boolean) => void;
  setCurrentMusicBeingPlayed: (music: string | null) => void;
  setLanguage: (language: string | null) => void;
  setWeight: (weight: string | null) => Promise<void>;
  setFitness: (fitness: string | null) => Promise<void>;
  
  // Workout state
  workoutItems: any[];
  groupItems: any[];
  reload: () => Promise<void>;
  getOrderedWorkoutsForGroup: (groupName: string) => any[];
  
  // Workout CRUD operations
  createWorkout: (name: string, workoutString: string, groupName?: string) => Promise<void>;
  updateWorkout: (oldName: string, newName: string, workoutString: string, groupName?: string) => Promise<void>;
  deleteWorkout: (name: string, groupName?: string) => Promise<void>;
  deleteGroup: (groupName: string) => Promise<void>;
  reorderWorkouts: (groupName: string, reorderedWorkouts: any[]) => Promise<void>;
  
  // Legacy workout operations
  storeWorkout: (workout: any) => Promise<void>;
  storeGroup: (group: any) => Promise<void>;
  reorderWorkoutInGroup: (groupName: string, workoutName: string, newOrderId: number) => Promise<void>;
  reorderEntireGroup: (groupName: string, orderedWorkoutNames: string[]) => Promise<void>;
  syncAllGroup: () => Promise<void>;
  
  // Sound data arrays (from sound provider)
  breakMusic: any[];
  workoutMusic: any[];
  successSound: any[];
  language: any[];
  
  // Legacy storage
  storeItem: (key: string, value: any) => Promise<void>;
  getStoredItem: (key: string) => Promise<any>;
}

const CombinedDataContext = createContext<CombinedDataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(CombinedDataContext);
  if (!context) {
    throw new Error('useData must be used within a CombinedDataProvider');
  }
  return context;
};

const CombinedDataProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const timerContext = useTimer();
  const workoutContext = useWorkout();
  const audioContext = useAudio();
  const soundContext = useSound();

  const storeItem = async (key: string, value: any) => {
    const prefixedKey = key.startsWith('@countOnMe_') ? key : `@countOnMe_${key}`;
    if (typeof value === 'string') {
      await storageService.setItem(prefixedKey, value);
    } else {
      await storageService.setObject(prefixedKey, value);
    }
  };

  const getStoredItem = async (key: string) => {
    const prefixedKey = key.startsWith('@countOnMe_') ? key : `@countOnMe_${key}`;
    const stringValue = await storageService.getItem(prefixedKey);
    if (stringValue === null) return null;
    
    try {
      return JSON.parse(stringValue);
    } catch {
      return stringValue;
    }
  };

  // Legacy workout operations
  const storeWorkout = async (workout: any) => {
    await workoutContext.storeWorkout(workout);
  };

  const storeGroup = async (group: any) => {
    await workoutContext.storeGroup(group);
  };

  const reorderWorkoutInGroup = async (groupName: string, workoutName: string, newOrderId: number) => {
    await workoutContext.reorderWorkoutInGroup(groupName, workoutName, newOrderId);
  };

  const reorderEntireGroup = async (groupName: string, orderedWorkoutNames: string[]) => {
    await workoutContext.reorderEntireGroup(groupName, orderedWorkoutNames);
  };

  const syncAllGroup = async () => {
    await workoutContext.syncAllGroup();
  };

  // Additional workout operations
  const createWorkout = async (name: string, workoutString: string, groupName?: string) => {
    const workout: WorkoutItem = {
      name,
      workout: workoutString,
      group: groupName || 'All',
    };
    await workoutContext.storeWorkout(workout);
  };

  const updateWorkout = async (oldName: string, newName: string, workoutString: string, groupName?: string) => {
    // Delete old workout and create new one
    await workoutContext.deleteWorkout(oldName);
    await createWorkout(newName, workoutString, groupName);
  };

  const reorderWorkouts = async (groupName: string, reorderedWorkouts: any[]) => {
    const workoutNames = reorderedWorkouts.map((w: any) => w.name);
    await workoutContext.reorderEntireGroup(groupName, workoutNames);
  };

  // Helper to create workoutGroups from workoutItems and groupItems
  const getWorkoutGroups = () => {
    const groups: { [groupName: string]: any[] } = {};
    workoutContext.groupItems.forEach(group => {
      groups[group.name] = workoutContext.getOrderedWorkoutsForGroup(group.name);
    });
    return groups;
  };

  const contextValue: CombinedDataContextType = {
    // Timer state
    timerIsRunning: timerContext.isRunning,
    timerCurrentTime: timerContext.currentTime,
    timerCurrentIndex: timerContext.currentIndex,
    timerElapsedTime: timerContext.elapsedTime,
    timers: timerContext.timers,
    timerStopped: timerContext.stopped,
    timerDisabled: timerContext.disabled,
    timerSelectedItem: timerContext.selectedItem,
    timerProgressKey: timerContext.progressKey?.toString() || null,
    
    // Timer actions
    startTimer: timerContext.startTimer,
    stopTimer: timerContext.stopTimer,
    resetTimer: timerContext.resetTimer,
    setTimers: timerContext.setTimers,
    setTimerSelectedItem: timerContext.setTimerSelectedItem,
    updateTimerTime: timerContext.updateTimerTime,
    setCurrentIndex: timerContext.setCurrentIndex,
    incrementElapsedTime: timerContext.incrementElapsedTime,
    setWorkoutCompleteCallback: (callback: (() => void) | null) => {
      if (callback) {
        timerContext.setWorkoutCompleteCallback(callback);
      }
    },
    handleWorkoutCompleteFlow: async (orderedWorkouts: any[]) => {
      timerContext.handleWorkoutCompleteFlow(orderedWorkouts);
    },
    getCurrentSegment: timerContext.getCurrentSegment,
    getTotalTime: timerContext.getTotalTime,
    
    // Audio coordination
    handleTimerStart: audioContext.handleTimerStart,
    handleTimerStop: audioContext.handleTimerStop,
    handleTimerReset: audioContext.handleTimerReset,
    handleTimerSegmentChange: audioContext.handleTimerSegmentChange,
    handleAudioToggle: audioContext.handleAudioToggle,
    
    // Audio state
    audioEnabled: audioContext.enabled,
    audioReady: audioContext.ready,
    currentMusicBeingPlayed: audioContext.currentMusicBeingPlayed,
    currentLanguage: audioContext.currentLanguage,
    userWeight: audioContext.userWeight,
    fitnessLevel: audioContext.fitnessLevel,
    selectedWorkoutFile: audioContext.selectedWorkoutFile,
    selectedBreakFile: audioContext.selectedBreakFile,
    
    // Audio actions
    setAudioEnabled: audioContext.setAudioEnabled,
    setCurrentMusicBeingPlayed: audioContext.setCurrentMusicBeingPlayed,
    setLanguage: audioContext.setLanguage,
    setWeight: audioContext.setWeight,
    setFitness: audioContext.setFitness,
    
    // Workout state
    workoutItems: workoutContext.workoutItems,
    groupItems: workoutContext.groupItems,
    reload: workoutContext.reload,
    getOrderedWorkoutsForGroup: workoutContext.getOrderedWorkoutsForGroup,
    
  // Workout CRUD operations (use local wrappers where appropriate)
  createWorkout: createWorkout,
  updateWorkout: updateWorkout,
  deleteWorkout: workoutContext.deleteWorkout,
  deleteGroup: workoutContext.deleteGroup,
  reorderWorkouts: reorderWorkouts,
    
    // Legacy workout operations
    storeWorkout,
    storeGroup,
    reorderWorkoutInGroup,
    reorderEntireGroup,
    syncAllGroup,
    
    // Sound data arrays (from media constants)
    breakMusic: breakMusicData,
    workoutMusic: workoutMusicData,
    successSound: successSoundData,
    language: languageData,
    
    // Legacy storage
    storeItem,
    getStoredItem,
  };

  return (
    <CombinedDataContext.Provider value={contextValue}>
      {children}
    </CombinedDataContext.Provider>
  );
};

export const CombinedDataProvider: React.FC<CombinedDataProviderProps> = ({ children }) => {
  return (
    <AudioProvider>
      <WorkoutProvider>
        <TimerProvider>
          <CombinedDataProviderInner>
            {children}
          </CombinedDataProviderInner>
        </TimerProvider>
      </WorkoutProvider>
    </AudioProvider>
  );
};
