import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    height: '100%',
    alignItems: 'center',
    backgroundColor: '#101418',
    padding: 10,
    paddingTop: -40,
    marginTop: 0,
  },
  buttonDisabled: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#32656F',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    margin: 10,
    opacity: 0.5,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3BAFBB',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    margin: 10,
  },
  buttonTile: {
    flexDirection: 'row', // align children horizontally
    justifyContent: 'space-between', // push delete button to right
    backgroundColor: '#2A2E33',
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
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2E33',
    padding: 10,
    width: '95%',
    height: 'auto',
    margin: 10,
    borderRadius: 10,
  },
  tileTitle: {
    width: '95%',
    textAlign: 'left',
    fontSize: 16,
    color: 'white',
  },
});