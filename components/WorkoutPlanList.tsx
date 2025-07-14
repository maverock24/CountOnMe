import { FlatList, SafeAreaView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import commonStyles from '../app/styles';
import { useData } from './data.provider';

export default function WorkoutPlanList() {
  const { storedItems } = useData();
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
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
