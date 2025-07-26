export const prefixKey = '@countOnMe_';

export const RESERVED_KEYS = [
  'workoutMusic',
  'breakMusic',
  'successSound',
  'audioThreshold',
  'language',
  'profileWeight',
  'profileFitness',
  'tutorialSeen',
];

export const DEFAULT_AUDIO_SETTINGS = {
  enabled: true,
  selectedActionMusic: 'Action: Upbeat',
  selectedBreakMusic: 'Break: Chill',
  selectedSuccessSound: 'Success: Yeah',
  selectedNextExerciseSound: 'Next Exercise',
  currentMusicBeingPlayed: null,
};

export const GROUP_NAMES = {
  ALL: 'All',
} as const;
