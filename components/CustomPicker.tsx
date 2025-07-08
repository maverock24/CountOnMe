import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

export interface PickerItem {
  label: string;
  value: string;
}

interface CustomPickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: PickerItem[];
  placeholder?: string;
  style?: any;
  containerStyle?: any;
  dropdownIconColor?: string;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  selectedValue,
  onValueChange,
  items,
  placeholder = 'Select an option',
  style,
  containerStyle,
  dropdownIconColor = '#fff',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = items.find((item) => item.value === selectedValue);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleItemPress = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  const renderItem = ({ item }: { item: PickerItem }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        item.value === selectedValue && styles.selectedDropdownItem,
      ]}
      onPress={() => handleItemPress(item.value)}
    >
      <Text
        style={[
          styles.dropdownItemText,
          item.value === selectedValue && styles.selectedDropdownItemText,
        ]}
      >
        {item.label}
      </Text>
      {item.value === selectedValue && (
        <FontAwesome name="check" size={16} color="#00bcd4" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container]}>
      <View style={[styles.pickerContainer, containerStyle]}>
        <TouchableOpacity
          style={[styles.pickerButton, style]}
          onPress={toggleDropdown}
        >
          <Text style={styles.selectedText}>{displayText}</Text>
          <FontAwesome 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={dropdownIconColor} 
            style={styles.dropdownIcon}
          />
        </TouchableOpacity>
      </View>

      {isOpen && (
        <>
          <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={styles.dropdown}>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.value}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  pickerContainer: {
    backgroundColor: 'rgb(49, 67, 77)',
    borderRadius: 5,
    marginBottom: 10,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: 5,
  },
  selectedText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: 45, // Position right below the picker (60px height - 15px margin)
    left: 0,
    right: 0,
    backgroundColor: 'rgb(17, 24, 30)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#2A2E33',
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 46, 51, 0.3)',
  },
  selectedDropdownItem: {
    backgroundColor: Colors.glow,
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  selectedDropdownItemText: {
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CustomPicker;
