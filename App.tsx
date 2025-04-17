import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens here
import DialogueScreen from './screens/DialogueScreen';
import HomeScreen from './screens/HomeScreen';

// Define the type for your navigation parameters
export type RootStackParamList = {
  Home: undefined;
  Dialogue: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1c1c1c',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Clean Home',
          }}
        />
        <Stack.Screen 
          name="Dialogue" 
          component={DialogueScreen}
          options={{
            title: 'Chat with Claude',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}