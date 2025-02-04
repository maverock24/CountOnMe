import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from '@/components/Themed';
import { useForm, SubmitHandler } from "react-hook-form";

type Inputs = {
  example: string
  exampleRequired: string
}


export default function TabThreeScreen() {


  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>()
  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data)

  console.log(watch("example")) // watch input value by passing the name of it

  return (
    <View style={styles.container}>
        <form onSubmit={handleSubmit(onSubmit)}>
      {/* register your input into the hook by invoking the "register" function */}
      <input defaultValue="test" {...register("example")} />

      {/* include validation with required or other standard HTML validation rules */}
      <input {...register("exampleRequired", { required: true })} />
      {/* errors will return when field validation fails  */}
      {errors.exampleRequired && <span>This field is required</span>}

      <input type="submit" />
    </form>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    textShadowOffset: { width: 0, height: 0 },
    width: '80%',
  },
  count: {
    fontSize: 140,
    fontWeight: 'bold',
    marginVertical: 20,
    color: 'white',
  },

  //round button
  repButton: {
    borderRadius: 50,
    padding: 10,
    margin: 10,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  }, 
  remaining: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    textAlign: 'center',
    width: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  buttonContainerReps: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  slider: {
    width: '90%',
    height: 40,
  },
  sliderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 120,
    color: '#fff',
  },
});