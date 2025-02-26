import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useData } from './data.provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import commonStyles from '../app/styles';

export default function WorkoutPlanList() {
  const { storedItems, reload } = useData();
  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <FlatList
          data={storedItems}
          renderItem={({ item }) => (
            <View style={commonStyles.buttonTile}>
              <Text style={commonStyles.buttonText}>{item.key}</Text>
              <Text style={commonStyles.buttonText}>{item.value}</Text>
            </View>
          )}
          keyExtractor={(item) => item.key}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
