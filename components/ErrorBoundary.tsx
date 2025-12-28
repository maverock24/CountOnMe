import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import ThemedText from './ThemedText';
import TimerButton from './TimerButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * ErrorBoundary Component
 * 
 * Catches React rendering errors and displays detailed information
 * to help debug issues like "Unexpected text node" errors.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };

    console.error('ErrorBoundary caught an error:', errorDetails);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error in AsyncStorage for debugging
    this.storeError(errorDetails);
  }

  async storeError(errorDetails: any) {
    try {
      const existingErrors = await AsyncStorage.getItem('error_boundary_logs');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      
      // Keep only last 10 errors
      const updatedErrors = [...errors, errorDetails].slice(-10);
      
      await AsyncStorage.setItem('error_boundary_logs', JSON.stringify(updatedErrors));
    } catch (storageError) {
      console.error('Failed to store error:', storageError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleClearErrors = async () => {
    try {
      await AsyncStorage.removeItem('error_boundary_logs');
      alert('Error logs cleared');
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  };

  handleInspectStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      
      console.log('=== AsyncStorage Inspection ===');
      console.log(`Total keys: ${keys.length}`);
      
      items.forEach(([key, value]) => {
        console.log(`\nKey: ${key}`);
        console.log(`Value length: ${value?.length || 0}`);
        
        // Try to parse and check for malformed data
        try {
          if (value) {
            const parsed = JSON.parse(value);
            
            // Check for common malformed patterns
            if (typeof parsed === 'string' && (parsed === '.' || parsed === ',' || parsed === '-')) {
              console.warn(`⚠️ MALFORMED DATA in ${key}: "${parsed}"`);
            }
            
            // Check arrays for malformed elements
            if (Array.isArray(parsed)) {
              const malformed = parsed.filter((item: any) => 
                typeof item === 'string' && (item === '.' || item === ',' || item === '-' || item === '')
              );
              if (malformed.length > 0) {
                console.warn(`⚠️ MALFORMED ARRAY ELEMENTS in ${key}:`, malformed);
              }
            }
            
            // Check objects for malformed values
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              Object.entries(parsed).forEach(([objKey, objValue]) => {
                if (typeof objValue === 'string' && (objValue === '.' || objValue === ',' || objValue === '-' || objValue === '')) {
                  console.warn(`⚠️ MALFORMED OBJECT VALUE in ${key}.${objKey}: "${objValue}"`);
                }
              });
            }
          }
        } catch (parseError) {
          console.warn(`Cannot parse ${key}:`, parseError);
        }
      });
      
      console.log('=== End AsyncStorage Inspection ===');
      alert('Check console for AsyncStorage inspection results');
    } catch (error) {
      console.error('Failed to inspect AsyncStorage:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <ThemedText style={styles.title}>⚠️ Rendering Error Detected</ThemedText>
            
            <ThemedText style={styles.errorCount}>
              Error #{this.state.errorCount}
            </ThemedText>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Error Message:</ThemedText>
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorText}>
                  {this.state.error?.message || 'Unknown error'}
                </ThemedText>
              </View>
            </View>

            {this.state.errorInfo?.componentStack && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Component Stack:</ThemedText>
                <ScrollView horizontal style={styles.stackScrollView}>
                  <View style={styles.errorBox}>
                    <ThemedText style={styles.stackText}>
                      {this.state.errorInfo.componentStack}
                    </ThemedText>
                  </View>
                </ScrollView>
              </View>
            )}

            {this.state.error?.stack && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Error Stack:</ThemedText>
                <ScrollView horizontal style={styles.stackScrollView}>
                  <View style={styles.errorBox}>
                    <ThemedText style={styles.stackText}>
                      {this.state.error.stack}
                    </ThemedText>
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.debugSection}>
              <ThemedText style={styles.sectionTitle}>Debug Actions:</ThemedText>
              
              <TimerButton
                text="Inspect AsyncStorage"
                onPress={this.handleInspectStorage}
                style={styles.button}
              />
              
              <TimerButton
                text="Clear Error Logs"
                onPress={this.handleClearErrors}
                style={styles.button}
              />
              
              <TimerButton
                text="Try Again"
                onPress={this.handleReset}
                style={styles.button}
              />
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={styles.infoText}>
                💡 Common Causes:{'\n'}
                • Text node errors: Check for undefined/null values in Text components{'\n'}
                • Malformed data: Inspect AsyncStorage for ".", ",", "-", or empty strings{'\n'}
                • Invalid props: Verify component props are correct types{'\n'}
                • Missing keys: Ensure list items have unique keys
              </ThemedText>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorCount: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ecdc4',
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  stackScrollView: {
    maxHeight: 150,
  },
  stackText: {
    fontSize: 12,
    color: '#ccc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  debugSection: {
    marginVertical: 20,
    gap: 10,
  },
  button: {
    marginVertical: 5,
  },
  infoSection: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4ecdc4',
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
  },
});

export default ErrorBoundary;
