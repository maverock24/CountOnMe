import { DEFAULT_AUDIO_SETTINGS } from './constants';
import { AppState, AudioSettings, UserProfile } from './types';

export type StateAction = 
  | { type: 'SET_STORED_ITEMS'; payload: any[] }
  | { type: 'SET_WORKOUT_ITEMS'; payload: any[] }
  | { type: 'SET_GROUP_ITEMS'; payload: any[] }
  | { type: 'SET_LANGUAGE'; payload: string | null }
  | { type: 'SET_AUDIO_SETTINGS'; payload: Partial<AudioSettings> }
  | { type: 'SET_USER_PROFILE'; payload: Partial<UserProfile> };

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
    
    default:
      return state;
  }
}
