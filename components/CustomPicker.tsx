import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Modal,
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
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);

  const selectedItem = items.find((item) => item.value === selectedValue);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setButtonLayout({ x, y, width, height });
        setIsOpen(true);
      });
    } else {
      setIsOpen(false);
    }
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
    <View style={[styles.container, style]}>
      <View ref={buttonRef} style={[styles.pickerContainer, containerStyle]}>
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
        <Modal
          transparent={true}
          visible={isOpen}
          animationType="none"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
            <View style={styles.modalOverlay}>
              <View 
                style={[
                  styles.dropdown,
                  {
                    position: 'absolute',
                    top: buttonLayout.y + buttonLayout.height + 5,
                    left: buttonLayout.x,
                    width: buttonLayout.width,
                    minWidth: buttonLayout.width,
                    maxWidth: Math.max(buttonLayout.width, 300),
                  }
                ]}
              >
                <FlatList
                  data={items}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.value}
                  style={styles.dropdownList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '40%',
  },
  pickerContainer: {
    backgroundColor: 'rgb(31, 39, 44)',
    borderRadius: 5,
    marginBottom: 10,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#2A2E33',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdown: {
    backgroundColor: 'rgb(17, 24, 30)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#2A2E33',
    maxHeight: 200,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 50,
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
    borderBottomColor: 'rgb(42, 46, 51)',
    backgroundColor: 'rgb(31, 39, 44)',
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
