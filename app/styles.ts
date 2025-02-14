import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#019baf',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    margin: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row', // align children horizontally
    justifyContent: 'space-between', // push delete button to right
    padding: 0,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#2F2F2F',
    borderRadius: 5,
    height: 45,
    width: '95%',
  },
  listItemTitle: {
    margin: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  listItemValue: {
    margin: 8,
    fontSize: 16,
    color: 'white',
    letterSpacing: 4,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
});