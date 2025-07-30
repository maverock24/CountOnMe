export const prefixKey = '@countOnMe_';

export const RESERVED_KEYS = [
  'workoutMusic',
  'breakMusic',
  'successSound',
  'audioEnabled',
  'audioThreshold',
  'language',
  'profileWeight',
  'profileFitness',
  'tutorialSeen',
];

export const DEFAULT_AUDIO_SETTINGS = {
  enabled: true,
  selectedActionMusic: 'random:Action',
  selectedBreakMusic: 'random:Chill',
  selectedSuccessSound: 'Oh Yeah',
  selectedNextExerciseSound: 'Next Exercise',
  currentMusicBeingPlayed: null,
};

export const DEFAULT_TIMER_STATE = {
  isRunning: false,
  currentTime: 0,
  currentIndex: 0,
  elapsedTime: 0,
  timers: [],
  stopped: false,
  disabled: true,
  selectedItem: null,
  progressKey: 0,
};

export const GROUP_NAMES = {
  ALL: 'All',
} as const;
