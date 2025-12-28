import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/components/ThemeProvider';
import TimerButton from '@/components/TimerButton';
import {
    cleanMalformedData,
    exportAllData,
    inspectAsyncStorage,
    printInspectionResults,
    searchKeys,
    StorageInspectionResult
} from '@/utils/storageDebug';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

/**
 * Debug Screen
 * 
 * Provides tools to inspect AsyncStorage and debug text node errors
 */
export default function DebugScreen() {
  const { theme } = useTheme();
  const [inspectionResult, setInspectionResult] = useState<StorageInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const handleInspect = async () => {
    setIsInspecting(true);
    try {
      const result = await inspectAsyncStorage();
      setInspectionResult(result);
      printInspectionResults(result);
      
      if (result.malformedData.length === 0) {
        Alert.alert('✅ No Issues Found', 'AsyncStorage is clean - no malformed data detected.');
      } else {
        Alert.alert(
          '⚠️ Issues Found',
          `Found ${result.malformedData.length} malformed items. Check console for details.`
        );
      }
    } catch (error) {
      console.error('Inspection error:', error);
      Alert.alert('Error', 'Failed to inspect AsyncStorage');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleCleanDryRun = async () => {
    try {
      const result = await cleanMalformedData(true);
      Alert.alert(
        '🔍 Dry Run Complete',
        `Would clean ${result.cleaned} items:\n${result.keys.join('\n')}`
      );
    } catch (error) {
      console.error('Dry run error:', error);
      Alert.alert('Error', 'Failed to perform dry run');
    }
  };

  const handleCleanForReal = async () => {
    Alert.alert(
      '⚠️ Confirm Cleanup',
      'This will modify AsyncStorage data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await cleanMalformedData(false);
              Alert.alert(
                '✅ Cleanup Complete',
                `Cleaned ${result.cleaned} items`
              );
              // Re-inspect after cleaning
              handleInspect();
            } catch (error) {
              console.error('Cleanup error:', error);
              Alert.alert('Error', 'Failed to clean data');
            }
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      console.log('=== EXPORTED ASYNCSTORAGE DATA ===');
      console.log(JSON.stringify(data, null, 2));
      console.log('=== END EXPORT ===');
      Alert.alert('✅ Exported', 'Check console for full AsyncStorage dump');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleSearchWorkouts = async () => {
    try {
      const keys = await searchKeys('workout');
      console.log('=== WORKOUT-RELATED KEYS ===');
      keys.forEach(key => console.log(key));
      console.log('=== END WORKOUT KEYS ===');
      Alert.alert('Search Results', `Found ${keys.length} workout-related keys. Check console.`);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search keys');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>🔧 Debug Tools</ThemedText>
        <ThemedText style={styles.subtitle}>
          AsyncStorage inspection and malformed data detection
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Inspection</ThemedText>
          
          <TimerButton
            text={isInspecting ? "Inspecting..." : "Inspect AsyncStorage"}
            onPress={handleInspect}
            disabled={isInspecting}
            style={styles.button}
          />

          {inspectionResult && (
            <View style={[styles.resultBox, { backgroundColor: theme.colors.surfaceAlt }]}>
              <ThemedText style={styles.resultText}>
                📊 Total Keys: {inspectionResult.totalKeys}
              </ThemedText>
              <ThemedText style={[styles.resultText, { color: inspectionResult.malformedData.length > 0 ? '#ff6b6b' : '#4ecdc4' }]}>
                {inspectionResult.malformedData.length > 0 ? '🚨' : '✅'} Malformed Items: {inspectionResult.malformedData.length}
              </ThemedText>
              <ThemedText style={styles.resultText}>
                ⚠️ Suspicious Keys: {inspectionResult.suspiciousKeys.length}
              </ThemedText>
              <ThemedText style={styles.resultText}>
                📦 Large Items: {inspectionResult.largeItems.length}
              </ThemedText>
            </View>
          )}

          {inspectionResult && inspectionResult.malformedData.length > 0 && (
            <View style={[styles.issuesBox, { backgroundColor: theme.colors.surfaceAlt }]}>
              <ThemedText style={styles.issuesTitle}>🚨 Malformed Data Found:</ThemedText>
              {inspectionResult.malformedData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.issueItem}>
                  <ThemedText style={styles.issuePath}>{item.path}</ThemedText>
                  <ThemedText style={styles.issueValue}>Value: "{String(item.value)}"</ThemedText>
                  <ThemedText style={styles.issueText}>{item.issue}</ThemedText>
                </View>
              ))}
              {inspectionResult.malformedData.length > 5 && (
                <ThemedText style={styles.moreText}>
                  ...and {inspectionResult.malformedData.length - 5} more (see console)
                </ThemedText>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Cleanup</ThemedText>
          
          <TimerButton
            text="Dry Run (Preview)"
            onPress={handleCleanDryRun}
            style={styles.button}
          />
          
          <TimerButton
            text="Clean Malformed Data"
            onPress={handleCleanForReal}
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Export & Search</ThemedText>
          
          <TimerButton
            text="Export All Data"
            onPress={handleExportData}
            style={styles.button}
          />
          
          <TimerButton
            text="Search 'workout' Keys"
            onPress={handleSearchWorkouts}
            style={styles.button}
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceAlt }]}>
          <ThemedText style={styles.infoTitle}>💡 How to Use</ThemedText>
          <ThemedText style={styles.infoText}>
            1. Tap "Inspect AsyncStorage" to scan for issues{'\n'}
            2. If malformed data found, try "Dry Run" first{'\n'}
            3. Review console output carefully{'\n'}
            4. Use "Clean Malformed Data" to fix issues{'\n'}
            5. Re-inspect to verify cleanup
          </ThemedText>
        </View>

        <View style={[styles.warningBox, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
          <ThemedText style={styles.warningText}>
            ⚠️ Warning: Cleaning data modifies AsyncStorage. Use dry run first!
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#4ecdc4',
  },
  button: {
    marginVertical: 6,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ecdc4',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  issuesBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  issuesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#ff6b6b',
  },
  issueItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  issuePath: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  issueValue: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  issueText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 8,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ecdc4',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4ecdc4',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.9,
  },
  warningBox: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  warningText: {
    fontSize: 13,
    color: '#ff6b6b',
    fontWeight: '600',
  },
});
