// ============================================================================
// THEME SYSTEM - 10 Dark Themes
// All themes maintain dark aesthetic while offering distinct color palettes
// ============================================================================

export interface Theme {
  id: string;
  name: string;
  colors: {
    // Core backgrounds
    void: string;           // Deepest background
    surface: string;        // Elevated surfaces (tiles, cards)
    surfaceAlt: string;     // Alternative surface color

    // Accent colors
    primary: string;        // Main accent color
    primaryMuted: string;   // Muted version of primary
    secondary: string;      // Secondary accent

    // Text colors
    textPrimary: string;    // Main text color
    textSecondary: string;  // Secondary text
    textMuted: string;      // Muted/disabled text

    // UI elements
    border: string;         // Default borders
    borderActive: string;   // Active/selected borders
    glow: string;           // Glow effects

    // Semantic colors
    success: string;
    warning: string;
    error: string;

    // Component specific
    buttonBackground: string;
    buttonBorder: string;
    tileBackground: string;
    tileBorder: string;
    listTileBackground: string;  // Darker background for list tiles
    inputBackground: string;
    inputBorder: string;

    // Progress/Timer specific
    progressTrack: string;
    progressFill: string;
    timerActive: string;
    timerBreak: string;
  };
}

// 1. Original Dark (Current theme - baseline)
export const originalDark: Theme = {
  id: 'original-dark',
  name: 'Original Dark',
  colors: {
    void: '#101418',
    surface: 'rgba(41, 57, 68, 1)',
    surfaceAlt: 'rgba(17, 24, 30, 0.8)',
    primary: 'rgb(42, 199, 207)',
    primaryMuted: 'rgba(42, 199, 207, 0.5)',
    secondary: 'rgb(27, 41, 46)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(201, 213, 215)',
    textMuted: 'rgb(176, 224, 230)',
    border: '#2A2E33',
    borderActive: 'rgb(2, 248, 240)',
    glow: 'rgb(42, 199, 207)',
    success: 'green',
    warning: '#f0ad4e',
    error: 'red',
    buttonBackground: 'rgba(41, 57, 68, 1)',
    buttonBorder: 'rgb(83, 90, 92)',
    tileBackground: 'rgba(17, 24, 30, 0.8)',
    tileBorder: '#2A2E33',
    listTileBackground: 'rgba(26, 36, 43, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(81, 84, 90)',
    progressTrack: '#2A2E33',
    progressFill: 'rgb(42, 199, 207)',
    timerActive: 'green',
    timerBreak: 'red',
  },
};

// 2. Midnight Blue
export const midnightBlue: Theme = {
  id: 'midnight-blue',
  name: 'Midnight Blue',
  colors: {
    void: '#0a0e14',
    surface: 'rgba(20, 35, 55, 1)',
    surfaceAlt: 'rgba(15, 25, 40, 0.85)',
    primary: '#5c9eff',
    primaryMuted: 'rgba(92, 158, 255, 0.5)',
    secondary: 'rgb(25, 40, 60)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(180, 200, 220)',
    textMuted: 'rgb(130, 160, 200)',
    border: '#1e3050',
    borderActive: '#5c9eff',
    glow: 'rgba(92, 158, 255, 0.6)',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    buttonBackground: 'rgba(20, 35, 55, 1)',
    buttonBorder: 'rgb(50, 70, 100)',
    tileBackground: 'rgba(15, 25, 40, 0.85)',
    tileBorder: '#1e3050',
    listTileBackground: 'rgba(14, 24, 38, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(50, 70, 100)',
    progressTrack: '#1e3050',
    progressFill: '#5c9eff',
    timerActive: '#4caf50',
    timerBreak: '#ff5722',
  },
};

// 3. Cyber Purple
export const cyberPurple: Theme = {
  id: 'cyber-purple',
  name: 'Cyber Purple',
  colors: {
    void: '#0d0a14',
    surface: 'rgba(35, 20, 55, 1)',
    surfaceAlt: 'rgba(25, 15, 40, 0.85)',
    primary: '#b366ff',
    primaryMuted: 'rgba(179, 102, 255, 0.5)',
    secondary: 'rgb(40, 25, 60)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(210, 190, 230)',
    textMuted: 'rgb(170, 140, 200)',
    border: '#3d2060',
    borderActive: '#b366ff',
    glow: 'rgba(179, 102, 255, 0.6)',
    success: '#66bb6a',
    warning: '#ffa726',
    error: '#ef5350',
    buttonBackground: 'rgba(35, 20, 55, 1)',
    buttonBorder: 'rgb(80, 50, 110)',
    tileBackground: 'rgba(25, 15, 40, 0.85)',
    tileBorder: '#3d2060',
    listTileBackground: 'rgba(20, 12, 32, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(80, 50, 110)',
    progressTrack: '#3d2060',
    progressFill: '#b366ff',
    timerActive: '#66bb6a',
    timerBreak: '#ef5350',
  },
};

// 4. Neon Green
export const neonGreen: Theme = {
  id: 'neon-green',
  name: 'Neon Green',
  colors: {
    void: '#0a110a',
    surface: 'rgba(20, 45, 25, 1)',
    surfaceAlt: 'rgba(15, 35, 18, 0.85)',
    primary: '#39ff14',
    primaryMuted: 'rgba(57, 255, 20, 0.4)',
    secondary: 'rgb(25, 50, 30)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(180, 220, 185)',
    textMuted: 'rgb(120, 180, 130)',
    border: '#1a3d1a',
    borderActive: '#39ff14',
    glow: 'rgba(57, 255, 20, 0.5)',
    success: '#39ff14',
    warning: '#ffeb3b',
    error: '#ff5252',
    buttonBackground: 'rgba(20, 45, 25, 1)',
    buttonBorder: 'rgb(50, 90, 55)',
    tileBackground: 'rgba(15, 35, 18, 0.85)',
    tileBorder: '#1a3d1a',
    listTileBackground: 'rgba(12, 28, 14, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(50, 90, 55)',
    progressTrack: '#1a3d1a',
    progressFill: '#39ff14',
    timerActive: '#39ff14',
    timerBreak: '#ff5252',
  },
};

// 5. Crimson Night
export const crimsonNight: Theme = {
  id: 'crimson-night',
  name: 'Crimson Night',
  colors: {
    void: '#110a0a',
    surface: 'rgba(50, 20, 25, 1)',
    surfaceAlt: 'rgba(40, 15, 18, 0.85)',
    primary: '#ff4757',
    primaryMuted: 'rgba(255, 71, 87, 0.5)',
    secondary: 'rgb(55, 25, 30)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(230, 190, 195)',
    textMuted: 'rgb(200, 140, 150)',
    border: '#4a1a20',
    borderActive: '#ff4757',
    glow: 'rgba(255, 71, 87, 0.5)',
    success: '#2ed573',
    warning: '#ffa502',
    error: '#ff4757',
    buttonBackground: 'rgba(50, 20, 25, 1)',
    buttonBorder: 'rgb(100, 50, 60)',
    tileBackground: 'rgba(40, 15, 18, 0.85)',
    tileBorder: '#4a1a20',
    listTileBackground: 'rgba(32, 12, 14, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(100, 50, 60)',
    progressTrack: '#4a1a20',
    progressFill: '#ff4757',
    timerActive: '#2ed573',
    timerBreak: '#ff4757',
  },
};

// 6. Ocean Depths
export const oceanDepths: Theme = {
  id: 'ocean-depths',
  name: 'Ocean Depths',
  colors: {
    void: '#060d12',
    surface: 'rgba(15, 40, 55, 1)',
    surfaceAlt: 'rgba(10, 30, 45, 0.85)',
    primary: '#00d9ff',
    primaryMuted: 'rgba(0, 217, 255, 0.4)',
    secondary: 'rgb(15, 45, 60)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(170, 210, 225)',
    textMuted: 'rgb(100, 160, 185)',
    border: '#0f3545',
    borderActive: '#00d9ff',
    glow: 'rgba(0, 217, 255, 0.5)',
    success: '#00e676',
    warning: '#ffab00',
    error: '#ff1744',
    buttonBackground: 'rgba(15, 40, 55, 1)',
    buttonBorder: 'rgb(40, 80, 100)',
    tileBackground: 'rgba(10, 30, 45, 0.85)',
    tileBorder: '#0f3545',
    listTileBackground: 'rgba(8, 24, 36, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(40, 80, 100)',
    progressTrack: '#0f3545',
    progressFill: '#00d9ff',
    timerActive: '#00e676',
    timerBreak: '#ff1744',
  },
};

// 7. Golden Hour
export const goldenHour: Theme = {
  id: 'golden-hour',
  name: 'Golden Hour',
  colors: {
    void: '#12100a',
    surface: 'rgba(45, 35, 20, 1)',
    surfaceAlt: 'rgba(35, 28, 15, 0.85)',
    primary: '#ffb347',
    primaryMuted: 'rgba(255, 179, 71, 0.5)',
    secondary: 'rgb(50, 40, 25)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(230, 215, 190)',
    textMuted: 'rgb(190, 170, 130)',
    border: '#4a3d20',
    borderActive: '#ffb347',
    glow: 'rgba(255, 179, 71, 0.5)',
    success: '#7cb342',
    warning: '#ffb347',
    error: '#e53935',
    buttonBackground: 'rgba(45, 35, 20, 1)',
    buttonBorder: 'rgb(90, 75, 45)',
    tileBackground: 'rgba(35, 28, 15, 0.85)',
    tileBorder: '#4a3d20',
    listTileBackground: 'rgba(28, 22, 12, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(90, 75, 45)',
    progressTrack: '#4a3d20',
    progressFill: '#ffb347',
    timerActive: '#7cb342',
    timerBreak: '#e53935',
  },
};

// 8. Arctic Frost
export const arcticFrost: Theme = {
  id: 'arctic-frost',
  name: 'Arctic Frost',
  colors: {
    void: '#0c1015',
    surface: 'rgba(30, 45, 55, 1)',
    surfaceAlt: 'rgba(22, 35, 45, 0.85)',
    primary: '#a8d8ea',
    primaryMuted: 'rgba(168, 216, 234, 0.5)',
    secondary: 'rgb(35, 50, 60)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(200, 215, 225)',
    textMuted: 'rgb(140, 165, 185)',
    border: '#2a3d4a',
    borderActive: '#a8d8ea',
    glow: 'rgba(168, 216, 234, 0.5)',
    success: '#81c784',
    warning: '#ffcc80',
    error: '#e57373',
    buttonBackground: 'rgba(30, 45, 55, 1)',
    buttonBorder: 'rgb(65, 85, 100)',
    tileBackground: 'rgba(22, 35, 45, 0.85)',
    tileBorder: '#2a3d4a',
    listTileBackground: 'rgba(18, 28, 36, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(65, 85, 100)',
    progressTrack: '#2a3d4a',
    progressFill: '#a8d8ea',
    timerActive: '#81c784',
    timerBreak: '#e57373',
  },
};

// 9. Ember Glow
export const emberGlow: Theme = {
  id: 'ember-glow',
  name: 'Ember Glow',
  colors: {
    void: '#120d08',
    surface: 'rgba(50, 30, 18, 1)',
    surfaceAlt: 'rgba(40, 24, 14, 0.85)',
    primary: '#ff6b35',
    primaryMuted: 'rgba(255, 107, 53, 0.5)',
    secondary: 'rgb(55, 35, 22)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(230, 200, 180)',
    textMuted: 'rgb(190, 150, 120)',
    border: '#4a2a18',
    borderActive: '#ff6b35',
    glow: 'rgba(255, 107, 53, 0.5)',
    success: '#8bc34a',
    warning: '#ff9800',
    error: '#f44336',
    buttonBackground: 'rgba(50, 30, 18, 1)',
    buttonBorder: 'rgb(100, 65, 40)',
    tileBackground: 'rgba(40, 24, 14, 0.85)',
    tileBorder: '#4a2a18',
    listTileBackground: 'rgba(32, 19, 11, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(100, 65, 40)',
    progressTrack: '#4a2a18',
    progressFill: '#ff6b35',
    timerActive: '#8bc34a',
    timerBreak: '#f44336',
  },
};

// 10. Stealth Mode
export const stealthMode: Theme = {
  id: 'stealth-mode',
  name: 'Stealth Mode',
  colors: {
    void: '#0a0a0a',
    surface: 'rgba(25, 25, 28, 1)',
    surfaceAlt: 'rgba(18, 18, 20, 0.9)',
    primary: '#888888',
    primaryMuted: 'rgba(136, 136, 136, 0.5)',
    secondary: 'rgb(35, 35, 38)',
    textPrimary: '#e0e0e0',
    textSecondary: 'rgb(180, 180, 180)',
    textMuted: 'rgb(120, 120, 120)',
    border: '#2a2a2d',
    borderActive: '#a0a0a0',
    glow: 'rgba(160, 160, 160, 0.4)',
    success: '#69f0ae',
    warning: '#ffd740',
    error: '#ff5252',
    buttonBackground: 'rgba(25, 25, 28, 1)',
    buttonBorder: 'rgb(60, 60, 65)',
    tileBackground: 'rgba(18, 18, 20, 0.9)',
    tileBorder: '#2a2a2d',
    listTileBackground: 'rgba(14, 14, 16, 1)',
    inputBackground: 'transparent',
    inputBorder: 'rgb(60, 60, 65)',
    progressTrack: '#2a2a2d',
    progressFill: '#888888',
    timerActive: '#69f0ae',
    timerBreak: '#ff5252',
  },
};

// Export all themes as an array
export const themes: Theme[] = [
  originalDark,
  midnightBlue,
  cyberPurple,
  neonGreen,
  crimsonNight,
  oceanDepths,
  goldenHour,
  arcticFrost,
  emberGlow,
  stealthMode,
];

// Get theme by ID
export const getThemeById = (id: string): Theme => {
  return themes.find(t => t.id === id) || originalDark;
};

// Default theme
export const defaultTheme = originalDark;
