/**
 * Validation utilities for React Native data rendering
 * 
 * CRITICAL React Native Rule (from official docs):
 * - Text nodes (strings/numbers) can ONLY appear inside <Text> components
 * - <View> components CANNOT have text node children
 * - This includes: strings, numbers, booleans, or any primitive values
 * - Only React elements, null, or undefined are valid children of <View>
 * 
 * Common errors prevented by these utilities:
 * - "Unexpected text node: . A text node cannot be a child of a <View>"
 * - "Unexpected text node: } A text node cannot be a child of a <View>"
 * - "Unexpected text node: [value] A text node cannot be a child of a <View>"
 * 
 * Reference: https://reactnative.dev/docs/text#containers
 * 
 * Best Practices:
 * - Always validate data before rendering
 * - Use these utilities for any dynamic text content
 * - Wrap all text in <Text> components, never render directly in <View>
 * - Provide meaningful fallbacks for invalid/missing data
 */

/**
 * Validates and sanitizes a value for rendering as text in React Native.
 * Ensures the value is safe to render inside a <Text> component.
 * 
 * @param value - The value to validate (string, number, or unknown)
 * @param fallback - Fallback value if invalid (default: '0')
 * @returns A safe string value for rendering
 * 
 * @example
 * ```tsx
 * <Text>{safeText(displayValue)}</Text>
 * <Text>{safeText(calories, 'N/A')}</Text>
 * ```
 */
export function safeText(value: unknown, fallback: string = '0'): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return fallback;
  }

  // Handle numbers (including NaN, Infinity)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return value.toString();
  }

  // Handle strings
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Empty string or whitespace-only
    if (trimmed === '') {
      return fallback;
    }
    
    // Invalid punctuation-only strings
    if (trimmed === '.' || trimmed === ',' || trimmed === '-' || trimmed === '_') {
      return fallback;
    }
    
    // Malformed number strings
    if (trimmed === 'NaN' || trimmed === 'Infinity' || trimmed === '-Infinity') {
      return fallback;
    }
    
    return trimmed;
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value.toString();
  }

  // Handle objects/arrays (shouldn't render these directly)
  if (typeof value === 'object') {
    console.warn('[safeText] Attempted to render object as text:', value);
    return fallback;
  }

  // Fallback for any other type
  return fallback;
}

/**
 * Validates and parses numeric data from workout/exercise strings.
 * Specifically designed for time/calorie/numeric values that may be malformed.
 * 
 * @param value - The value to parse
 * @param fallback - Fallback number if invalid (default: 0)
 * @returns A valid finite number
 * 
 * @example
 * ```tsx
 * const seconds = safeNumber(timeString); // parseFloat with validation
 * const calories = safeNumber(caloriesData, 0);
 * ```
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '.') {
      return fallback;
    }
    
    const parsed = parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

/**
 * Formats a number for display with specified decimal places.
 * Returns fallback string if input is invalid.
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @param fallback - Fallback string if invalid (default: '0')
 * @returns Formatted number string safe for Text rendering
 * 
 * @example
 * ```tsx
 * <Text>{formatNumber(calories, 1)}</Text>
 * <Text>{formatNumber(minutes, 2, 'N/A')}</Text>
 * ```
 */
export function formatNumber(value: unknown, decimals: number = 1, fallback: string = '0'): string {
  const num = safeNumber(value, NaN);
  
  if (!Number.isFinite(num)) {
    return fallback;
  }

  return num.toFixed(decimals);
}

/**
 * Validates an array of values (e.g., from split operations) and ensures
 * all elements are safe for rendering.
 * 
 * @param values - Array of values to validate
 * @param fallback - Fallback for invalid items
 * @returns Array of safe strings
 * 
 * @example
 * ```tsx
 * const times = safeArray(workoutData.split(';'));
 * times.map((time, i) => <Text key={i}>{time}</Text>)
 * ```
 */
export function safeArray(values: unknown[], fallback: string = '0'): string[] {
  return values.map(val => safeText(val, fallback));
}

/**
 * Type guard to check if a value is safe to render in React Native
 * without wrapping in <Text>.
 * 
 * In React Native, ONLY the following are safe to render directly:
 * - React components (including <Text>)
 * - null/undefined (renders nothing)
 * 
 * Strings and numbers MUST be wrapped in <Text>.
 * 
 * @param value - Value to check
 * @returns true if safe to render without <Text> wrapper
 */
export function isSafeReactNativeChild(value: unknown): boolean {
  // null/undefined are safe (render nothing)
  if (value === null || value === undefined) {
    return true;
  }

  // React elements are safe
  if (typeof value === 'object' && value !== null && 'type' in value) {
    return true;
  }

  // Everything else (strings, numbers, booleans) needs <Text>
  return false;
}
