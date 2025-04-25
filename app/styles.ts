import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');
const standardWidth = 375; // Reference width

// Calculate scale factor based on device width
const scale = width / standardWidth;

// Scale values based on device width
const scaleSize = (size: number) => Math.round(size * scale);

// Define a base button height and adjust it based on screen size
const baseButtonHeight = height * 0.08; // e.g., 6% of screen height

const commonStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    height: '100%',
    alignItems: 'center',
    backgroundColor: '#101418',
    width: '100%',
    maxWidth: 550,
    minWidth: 400,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    height: '100%',
    alignItems: 'center',
    backgroundColor: '#101418',
    paddingLeft: scaleSize(10),
    paddingRight: scaleSize(10),
    paddingTop: 5,
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
    //backgroundColor: 'rgb(45, 55, 73)',
    backgroundColor: 'rgb(38, 47, 62)',
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
  buttonPressed: {
    alignItems: 'center',
    justifyContent: 'center',
    //backgroundColor: 'rgb(45, 55, 73)',
    backgroundColor: 'rgb(32, 40, 52)',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: baseButtonHeight * 0.2, // Adjust padding based on button height
    paddingBottom: baseButtonHeight * 0.2, // Adjust padding based on button height
    height: 50, // Set the button height
    borderRadius: 10,
    margin: 10,
    borderColor: 'rgb(38, 47, 62)',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 0, // For Android
  },
  buttonTile: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgb(36, 44, 59)',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '100%',
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
  shimmerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101418',
  },
  shimmer: {
    width: '95%',
    height: 50,
    borderRadius: 10,
    marginBottom: 10,
  },
  gradientContent: {
    width: '100%',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default commonStyles;
