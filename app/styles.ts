import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#32656F',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    margin: 10,
  },
  buttonText: {
    color: '#EFF0F0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row', // align children horizontally
    justifyContent: 'space-between', // push delete button to right
    padding: 0,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#1A2024',
    height: 45,
    width: '95%',
  },
  listItemTitle: {
    margin: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'lightgray',
  },
  listItemValue: {
    margin: 8,
    fontSize: 16,
    color: 'lightgray',
    letterSpacing: 4,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
});