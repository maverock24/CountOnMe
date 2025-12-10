// ============================================================================
// FONT SYSTEM - Futuristic & Readable Screen Fonts
// All fonts are chosen for excellent screen readability
// ============================================================================

export interface FontConfig {
  id: string;
  name: string;
  displayName: string;
  fontFamily: string;
  description: string;
  // Weight mappings for consistency
  weights: {
    regular: string;
    medium: string;
    bold: string;
  };
}

// System fonts that are available on both iOS and Android
// These provide excellent readability and futuristic aesthetics

export const fonts: FontConfig[] = [
  {
    id: 'system',
    name: 'System Default',
    displayName: 'System',
    fontFamily: 'System',
    description: 'Platform default font - optimized for readability',
    weights: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
  {
    id: 'roboto',
    name: 'Roboto',
    displayName: 'Roboto',
    fontFamily: 'Roboto_400Regular',
    description: 'Clean geometric sans-serif, excellent for UI',
    weights: {
      regular: 'Roboto_400Regular',
      medium: 'Roboto_500Medium',
      bold: 'Roboto_700Bold',
    },
  },
  {
    id: 'roboto-mono',
    name: 'Roboto Mono',
    displayName: 'Roboto Mono',
    fontFamily: 'RobotoMono_400Regular',
    description: 'Monospace variant - tech/coding aesthetic',
    weights: {
      regular: 'RobotoMono_400Regular',
      medium: 'RobotoMono_500Medium',
      bold: 'RobotoMono_700Bold',
    },
  },
  {
    id: 'inter',
    name: 'Inter',
    displayName: 'Inter',
    fontFamily: 'Inter_400Regular',
    description: 'Modern variable font, optimized for screens',
    weights: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      bold: 'Inter_700Bold',
    },
  },
  {
    id: 'space-mono',
    name: 'Space Mono',
    displayName: 'Space Mono',
    fontFamily: 'SpaceMono_400Regular',
    description: 'Futuristic monospace with geometric shapes',
    weights: {
      regular: 'SpaceMono_400Regular',
      medium: 'SpaceMono_400Regular',
      bold: 'SpaceMono_700Bold',
    },
  },
  {
    id: 'orbitron',
    name: 'Orbitron',
    displayName: 'Orbitron',
    fontFamily: 'Orbitron_400Regular',
    description: 'Sci-fi geometric display font',
    weights: {
      regular: 'Orbitron_400Regular',
      medium: 'Orbitron_500Medium',
      bold: 'Orbitron_700Bold',
    },
  },
  {
    id: 'exo2',
    name: 'Exo 2',
    displayName: 'Exo 2',
    fontFamily: 'Exo2_400Regular',
    description: 'Futuristic yet highly readable',
    weights: {
      regular: 'Exo2_400Regular',
      medium: 'Exo2_500Medium',
      bold: 'Exo2_700Bold',
    },
  },
  {
    id: 'rajdhani',
    name: 'Rajdhani',
    displayName: 'Rajdhani',
    fontFamily: 'Rajdhani_400Regular',
    description: 'Open letterforms with tech aesthetic',
    weights: {
      regular: 'Rajdhani_400Regular',
      medium: 'Rajdhani_500Medium',
      bold: 'Rajdhani_700Bold',
    },
  },
  {
    id: 'chakra-petch',
    name: 'Chakra Petch',
    displayName: 'Chakra Petch',
    fontFamily: 'ChakraPetch_400Regular',
    description: 'Geometric with sharp angles - cyberpunk style',
    weights: {
      regular: 'ChakraPetch_400Regular',
      medium: 'ChakraPetch_500Medium',
      bold: 'ChakraPetch_700Bold',
    },
  },
  {
    id: 'share-tech',
    name: 'Share Tech',
    displayName: 'Share Tech',
    fontFamily: 'ShareTech_400Regular',
    description: 'Clean technical typeface',
    weights: {
      regular: 'ShareTech_400Regular',
      medium: 'ShareTech_400Regular',
      bold: 'ShareTech_400Regular',
    },
  },
  {
    id: 'share-tech-mono',
    name: 'Share Tech Mono',
    displayName: 'Share Tech Mono',
    fontFamily: 'ShareTechMono_400Regular',
    description: 'Monospace technical font - terminal style',
    weights: {
      regular: 'ShareTechMono_400Regular',
      medium: 'ShareTechMono_400Regular',
      bold: 'ShareTechMono_400Regular',
    },
  },
  {
    id: 'quantico',
    name: 'Quantico',
    displayName: 'Quantico',
    fontFamily: 'Quantico_400Regular',
    description: 'Military/tactical aesthetic',
    weights: {
      regular: 'Quantico_400Regular',
      medium: 'Quantico_400Regular',
      bold: 'Quantico_700Bold',
    },
  },
];

// Get font by ID
export const getFontById = (id: string): FontConfig => {
  return fonts.find(f => f.id === id) || fonts[0];
};

// Default font
export const defaultFont = fonts[0];

// Font size presets
export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
};
