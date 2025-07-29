import { DEFAULT_AUDIO_SETTINGS, DEFAULT_TIMER_STATE } from './constants';
import { AppState, AudioSettings, TimerState, UserProfile } from './types';

export type StateAction = 
  | { type: 'SET_STORED_ITEMS'; payload: any[] }
  | { type: 'SET_WORKOUT_ITEMS'; payload: any[] }
  | { type: 'SET_GROUP_ITEMS'; payload: any[] }
  | { type: 'SET_LANGUAGE'; payload: string | null }
  | { type: 'SET_AUDIO_SETTINGS'; payload: Partial<AudioSettings> }
  | { type: 'SET_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'SET_TIMER_STATE'; payload: Partial<TimerState> }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'UPDATE_TIMER_TIME'; payload: number }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'INCREMENT_ELAPSED_TIME' }
  | { type: 'SET_TIMERS'; payload: any[] };

export const initialState: AppState = {
  storedItems: [],
  workoutItems: [],
  groupItems: [],
  currentLanguage: null,
  audioSettings: DEFAULT_AUDIO_SETTINGS,
  userProfile: {
    weight: null,
    fitnessLevel: null,
  },
  timerState: DEFAULT_TIMER_STATE,
};

export function stateReducer(state: AppState, action: StateAction): AppState {
  switch (action.type) {
    case 'SET_STORED_ITEMS':
      return { ...state, storedItems: action.payload };
    
    case 'SET_WORKOUT_ITEMS':
      return { ...state, workoutItems: action.payload };
    
    case 'SET_GROUP_ITEMS':
      return { ...state, groupItems: action.payload };
    
    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.payload };
    
    case 'SET_AUDIO_SETTINGS':
      return { 
        ...state, 
        audioSettings: { 
          ...state.audioSettings, 
          ...action.payload 
        } 
      };
    
    case 'SET_USER_PROFILE':
      return { 
        ...state, 
        userProfile: { 
          ...state.userProfile, 
          ...action.payload 
        } 
      };

    // Timer state management
    case 'SET_TIMER_STATE':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          ...action.payload
        }
      };

    case 'START_TIMER':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          isRunning: true,
          stopped: false
        }
      };

    case 'STOP_TIMER':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          isRunning: false,
          stopped: true
        }
      };

    case 'RESET_TIMER':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          isRunning: false,
          currentTime: state.timerState.timers.length > 0 ? state.timerState.timers[0].time : 0,
          currentIndex: 0,
          elapsedTime: 0,
          stopped: false,
          progressKey: state.timerState.progressKey + 1
        }
      };

    case 'UPDATE_TIMER_TIME':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          currentTime: action.payload
        }
      };

    case 'SET_CURRENT_INDEX':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          currentIndex: action.payload,
          currentTime: state.timerState.timers[action.payload]?.time || 0
        }
      };

    case 'INCREMENT_ELAPSED_TIME':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          elapsedTime: state.timerState.elapsedTime + 1
        }
      };

    case 'SET_TIMERS':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          timers: action.payload,
          disabled: action.payload.length === 0,
          currentTime: action.payload.length > 0 ? action.payload[0].time : 0,
          currentIndex: 0,
          elapsedTime: 0,
          progressKey: state.timerState.progressKey + 1
        }
      };
    
    default:
      return state;
  }
}
