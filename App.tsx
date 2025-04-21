import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens here
import DialogueScreen from './screens/DialogueScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotesScreen from './screens/NotesScreen';
import PhilosopherCenter from './screens/PhilosopherCenter';

// Define the type for your navigation parameters
export type RootStackParamList = {
  Home: undefined;
  Dialogue: { initialMessage?: string };
  Profile: undefined;
  Notes: {
    conversationId: string;
    messages: Array<{ role: string; content: string }>;
  };
  PhilosopherCenter: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1c1c1c',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Classical',
            headerStyle: {
              backgroundColor: '#1c1c1c',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="Dialogue"
          component={DialogueScreen}
          options={{
            title: 'Socratic Dialogue',
            headerStyle: {
              backgroundColor: '#1c1c1c',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Profile',
            headerStyle: {
              backgroundColor: '#1c1c1c',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="Notes"
          component={NotesScreen}
          options={{
            title: 'Notes',
            headerStyle: {
              backgroundColor: '#1c1c1c',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="PhilosopherCenter"
          component={PhilosopherCenter}
          options={{
            title: 'Philosopher Center',
            headerStyle: {
              backgroundColor: '#1c1c1c',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}