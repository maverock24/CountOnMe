import { FontAwesome } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';

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
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);

  const itemsArray = items ?? [];
  const selectedItem = itemsArray.find((item) => item.value === selectedValue);
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
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
        item.value === selectedValue && { backgroundColor: `${theme.colors.primary}33` },
      ]}
      onPress={() => handleItemPress(item.value)}
    >
      <ThemedText
        style={[
          styles.dropdownItemText,
          { color: theme.colors.textPrimary },
          item.value === selectedValue && styles.selectedDropdownItemText,
        ]}
      >
        {item.label}
      </ThemedText>
      {item.value === selectedValue && (
        <FontAwesome name="check" size={16} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View ref={buttonRef} style={[styles.pickerContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, containerStyle]}>
        <TouchableOpacity
          style={[styles.pickerButton, style]}
          onPress={toggleDropdown}
        >
          <ThemedText style={[styles.selectedText, { color: theme.colors.textPrimary }]}>{displayText}</ThemedText>
          <FontAwesome
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={theme.colors.textPrimary}
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
          <Pressable onPress={() => setIsOpen(false)} style={styles.modalOverlay}>
            <View
              style={[
                styles.dropdown,
                {
                  position: 'absolute',
                  top: buttonLayout.y + buttonLayout.height + 5,
                  left: buttonLayout.x,
                  width: Math.max(buttonLayout.width, 220),
                  minWidth: 220,
                  maxWidth: Math.max(buttonLayout.width, 350),
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
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
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: 300,
  },
  pickerContainer: {
    borderRadius: 5,
    marginBottom: 10,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  selectedText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdown: {
    borderRadius: 5,
    borderWidth: 1,
    maxHeight: 250,
    minWidth: 220,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
    elevation: 50,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  selectedDropdownItem: {
  },
  dropdownItemText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  selectedDropdownItemText: {
  },
});

export default CustomPicker;
