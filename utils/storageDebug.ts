/**
 * AsyncStorage Debug Utilities
 * 
 * Tools to inspect and debug AsyncStorage data, particularly useful
 * for finding malformed data that causes "Unexpected text node" errors.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageInspectionResult {
  totalKeys: number;
  malformedData: MalformedDataItem[];
  suspiciousKeys: string[];
  largeItems: { key: string; size: number }[];
}

export interface MalformedDataItem {
  key: string;
  path: string;
  value: any;
  issue: string;
}

/**
 * Comprehensive AsyncStorage inspection
 * Identifies malformed data, suspicious values, and large items
 */
export async function inspectAsyncStorage(): Promise<StorageInspectionResult> {
  const result: StorageInspectionResult = {
    totalKeys: 0,
    malformedData: [],
    suspiciousKeys: [],
    largeItems: [],
  };

  try {
    const keys = await AsyncStorage.getAllKeys();
    result.totalKeys = keys.length;

    const items = await AsyncStorage.multiGet(keys);

    items.forEach(([key, value]) => {
      if (!value) return;

      // Check size
      if (value.length > 50000) {
        result.largeItems.push({ key, size: value.length });
      }

      // Try to parse and analyze
      try {
        const parsed = JSON.parse(value);
        analyzeValue(parsed, key, '', result);
      } catch (error) {
        result.suspiciousKeys.push(key);
      }
    });

    // Sort by severity
    result.malformedData.sort((a, b) => {
      const severityOrder = ['critical', 'warning', 'info'];
      return severityOrder.indexOf(getSeverity(a.issue)) - severityOrder.indexOf(getSeverity(b.issue));
    });

  } catch (error) {
    console.error('Failed to inspect AsyncStorage:', error);
  }

  return result;
}

/**
 * Recursively analyze a value for malformed data
 */
function analyzeValue(
  value: any,
  key: string,
  path: string,
  result: StorageInspectionResult
): void {
  const currentPath = path || key;

  // Check for problematic string values
  if (typeof value === 'string') {
    if (value === '.') {
      result.malformedData.push({
        key,
        path: currentPath,
        value,
        issue: 'critical: Single period (".") - causes text node errors',
      });
    } else if (value === ',') {
      result.malformedData.push({
        key,
        path: currentPath,
        value,
        issue: 'critical: Single comma (",") - causes text node errors',
      });
    } else if (value === '-') {
      result.malformedData.push({
        key,
        path: currentPath,
        value,
        issue: 'critical: Single dash ("-") - causes text node errors',
      });
    } else if (value === '') {
      result.malformedData.push({
        key,
        path: currentPath,
        value: '(empty string)',
        issue: 'warning: Empty string - may cause rendering issues',
      });
    } else if (/^[.,\-\s]+$/.test(value)) {
      result.malformedData.push({
        key,
        path: currentPath,
        value,
        issue: 'warning: Only punctuation/whitespace - suspicious',
      });
    }
  }

  // Check arrays
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      analyzeValue(item, key, `${currentPath}[${index}]`, result);
    });
  }

  // Check objects
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    Object.entries(value).forEach(([objKey, objValue]) => {
      analyzeValue(objValue, key, `${currentPath}.${objKey}`, result);
    });
  }
}

/**
 * Get severity level from issue description
 */
function getSeverity(issue: string): string {
  if (issue.startsWith('critical:')) return 'critical';
  if (issue.startsWith('warning:')) return 'warning';
  return 'info';
}

/**
 * Print inspection results to console
 */
export function printInspectionResults(result: StorageInspectionResult): void {
  console.log('\n=== AsyncStorage Inspection Results ===\n');
  console.log(`Total keys: ${result.totalKeys}`);
  console.log(`Malformed items found: ${result.malformedData.length}`);
  console.log(`Suspicious keys: ${result.suspiciousKeys.length}`);
  console.log(`Large items: ${result.largeItems.length}\n`);

  if (result.malformedData.length > 0) {
    console.log('🚨 MALFORMED DATA FOUND:\n');
    result.malformedData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.issue}`);
      console.log(`   Key: ${item.key}`);
      console.log(`   Path: ${item.path}`);
      console.log(`   Value: ${JSON.stringify(item.value)}\n`);
    });
  }

  if (result.largeItems.length > 0) {
    console.log('📦 LARGE ITEMS (>50KB):\n');
    result.largeItems.forEach((item) => {
      console.log(`   ${item.key}: ${(item.size / 1024).toFixed(2)}KB`);
    });
    console.log('');
  }

  if (result.suspiciousKeys.length > 0) {
    console.log('⚠️ SUSPICIOUS KEYS (invalid JSON):\n');
    result.suspiciousKeys.forEach((key) => {
      console.log(`   ${key}`);
    });
    console.log('');
  }

  console.log('=== End Inspection ===\n');
}

/**
 * Clean malformed data from AsyncStorage
 * WARNING: This will modify stored data!
 */
export async function cleanMalformedData(
  dryRun: boolean = true
): Promise<{ cleaned: number; keys: string[] }> {
  const result = { cleaned: 0, keys: [] as string[] };

  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);

    for (const [key, value] of items) {
      if (!value) continue;

      try {
        const parsed = JSON.parse(value);
        const cleaned = cleanValue(parsed);

        // Check if anything changed
        if (JSON.stringify(parsed) !== JSON.stringify(cleaned)) {
          result.cleaned++;
          result.keys.push(key);

          if (!dryRun) {
            await AsyncStorage.setItem(key, JSON.stringify(cleaned));
            console.log(`✅ Cleaned: ${key}`);
          } else {
            console.log(`🔍 Would clean: ${key}`);
          }
        }
      } catch (error) {
        // Skip invalid JSON
      }
    }
  } catch (error) {
    console.error('Failed to clean malformed data:', error);
  }

  return result;
}

/**
 * Recursively clean malformed values
 */
function cleanValue(value: any): any {
  if (typeof value === 'string') {
    // Replace malformed strings with safe defaults
    if (value === '.' || value === ',' || value === '-' || value === '') {
      return '0';
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(cleanValue).filter(v => v !== '0' || typeof v !== 'string');
  }

  if (value && typeof value === 'object') {
    const cleaned: any = {};
    Object.entries(value).forEach(([key, val]) => {
      cleaned[key] = cleanValue(val);
    });
    return cleaned;
  }

  return value;
}

/**
 * Get specific key data for debugging
 */
export async function getKeyData(key: string): Promise<any> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error(`Failed to get key ${key}:`, error);
    return null;
  }
}

/**
 * Search for keys containing a pattern
 */
export async function searchKeys(pattern: string): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter(key => key.toLowerCase().includes(pattern.toLowerCase()));
  } catch (error) {
    console.error('Failed to search keys:', error);
    return [];
  }
}

/**
 * Export all AsyncStorage data (for debugging)
 */
export async function exportAllData(): Promise<Record<string, any>> {
  const data: Record<string, any> = {};
  
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    
    items.forEach(([key, value]) => {
      try {
        data[key] = value ? JSON.parse(value) : null;
      } catch {
        data[key] = value;
      }
    });
  } catch (error) {
    console.error('Failed to export data:', error);
  }
  
  return data;
}
