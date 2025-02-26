import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Define a base button height and adjust it based on screen size
const baseButtonHeight = height * 0.08; // e.g., 6% of screen height
const baseTileHeight = height * 0.1; // e.g., 20% of screen height

const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    height: '100%',
    alignItems: 'center',
    backgroundColor: '#101418',
    padding: 10,
  },
  buttonDisabled: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(32, 40, 52)',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: baseButtonHeight * 0.2, // Adjust padding based on button height
    paddingBottom: baseButtonHeight * 0.2, // Adjust padding based on button height
    borderRadius: 10,
    height: 50, // Set the button height
    margin: 10,
    opacity: 0.5,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(45, 55, 73)',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: baseButtonHeight * 0.2, // Adjust padding based on button height
    paddingBottom: baseButtonHeight * 0.2, // Adjust padding based on button height
    height: 50, // Set the button height
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // For Android
  },
  buttonTile: {
    flexDirection: 'row', // align children horizontally
    justifyContent: 'space-between', // push delete button to right 'rgb(38, 47, 62)',
    backgroundColor: 'rgb(36, 44, 59)',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    marginBottom: 5,
    width: '95%',
  },
  buttonText: {
    color: '#EFF0F0',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  listItem: {
    flexDirection: 'row', // align children horizontally
    padding: 0,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#1A2024',
    height: 45,
    width: '100%',
  },
  listItemTitle: {
    margin: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'lightgray',
  },
  listItemValue: {
    marginTop: 10,
    fontSize: 14,
    color: 'lightgray',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  tile: {
    maxWidth: 600,
    alignItems: 'center',
    backgroundColor: 'rgb(28, 35, 46)',
    width: '95%',
    margin: 10,
    borderRadius: 10,
    borderColor: '#2A2E33',
    borderWidth: 1,
  },
  tileTitle: {
    width: '95%',
    marginBottom: -7,
    textAlign: 'left',
    fontSize: 16,
    color: 'white',
  },
});

export default commonStyles;