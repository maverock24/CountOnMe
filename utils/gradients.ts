// Metallic gradient presets for a premium UI look
export const gradients = {
  // Core metals
  steel: ['#4D5B6A', '#2C343F', '#1A1F25'], // Blue-tinted steel
  titanium: ['#71797E', '#52595F', '#3E444C'], // Classic titanium
  chrome: ['#CCCCCC', '#A3A3A3', '#727272'], // Polished chrome
  gunmetal: ['#2C3539', '#1C2226', '#10171C'], // Dark gunmetal
  copper: ['#B87333', '#8E5924', '#704016'], // Rich copper
  bronze: ['#CD7F32', '#A46628', '#7E4F1F'], // Classic bronze
  gold: ['#FFD700', '#CCAC00', '#A08800'], // Rich gold

  // Anodized metals
  blueSteel: ['#4A6D8C', '#2E4B67', '#1A2C3D'], // Blue anodized steel
  greenTitanium: ['#3D6F59', '#275442', '#183B2D'], // Green anodized titanium
  purpleChrome: ['#6A4973', '#4B3150', '#321E37'], // Purple anodized chrome
  redMetal: ['#994552', '#6E2E39', '#501B25'], // Red anodized metal

  // Specialized metallics
  darkCarbon: ['#232B2B', '#151A1A', '#080A0A'], // Carbon fiber black
  graphite: ['#2F3537', '#1C2021', '#10191A'], // Graphite
  cobalt: ['#0047AB', '#003380', '#002266'], // Cobalt blue
  platinum: ['#E5E4E2', '#C0C0C0', '#8F8F8F'], // Platinum
  pewter: ['#8C9A9E', '#646E75', '#454E54'], // Pewter

  // Industrial metals
  industrial: ['#454B51', '#31373D', '#23282D'], // Industrial steel
  brushedSilver: ['#C0C0C0', '#A1A1A1', '#858585'], // Brushed silver
  burnishedCopper: ['#A47551', '#7D5840', '#5F432F'], // Burnished copper
  tarnishedBrass: ['#B5A642', '#8C7E32', '#665D24'], // Tarnished brass

  // Specialty finishes
  metalBlack: ['#212121', '#1A1A1A', '#0A0A0A'], // Black metal
  blueRay: ['#304B6A', '#1E3249', '#122031'], // Blue-ray finish
  rainbowTitanium: ['#6D6A75', '#4A4752', '#302F35'], // Heat-treated titanium
};

// Gradient direction presets
export const gradientDirections = {
  topToBottom: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  leftToRight: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  radial: { start: { x: 0.5, y: 0.5 }, end: { x: 1, y: 1 } },
  angledTop: { start: { x: 0.1, y: 0.2 }, end: { x: 0.9, y: 0.8 } },
  spotlight: { start: { x: 0.3, y: 0.3 }, end: { x: 0.7, y: 0.7 } },
};

// Helper function to add shine or highlight effect to any gradient
export function addShineEffect(baseGradient: string[], intensity: number = 0.3): string[] {
  // Create a three-point gradient with shine in the middle
  const highlight = adjustColorBrightness(baseGradient[0], intensity);
  return [baseGradient[0], highlight, baseGradient[baseGradient.length - 1]];
}

// Helper function to adjust color brightness (positive for lighter, negative for darker)
export function adjustColorBrightness(hex: string, percent: number): string {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  // Adjust brightness
  r = Math.min(255, Math.max(0, Math.round(r + r * percent)));
  g = Math.min(255, Math.max(0, Math.round(g + g * percent)));
  b = Math.min(255, Math.max(0, Math.round(b + b * percent)));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

// Create beveled effect gradients
export function createBeveledGradient(baseColor: string): string[] {
  const darker = adjustColorBrightness(baseColor, -0.3);
  const lighter = adjustColorBrightness(baseColor, 0.3);
  return [lighter, baseColor, darker];
}

// Dynamic usage examples:
// 1. Basic metallic: gradients.steel
// 2. Metallic with shine: addShineEffect(gradients.titanium, 0.4)
// 3. Custom beveled: createBeveledGradient('#304B6A')
