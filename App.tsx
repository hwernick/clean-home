import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens here
import DialogueScreen from './screens/DialogueScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotesScreen from './screens/NotesScreen';

// Define the type for your navigation parameters
export type RootStackParamList = {
  Home: undefined;
  Dialogue: undefined;
  Profile: undefined;
  Notes: {
    conversationId: string;
    messages: Array<{ role: string; content: string }>;
  };
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
            title: 'Clean Home',
          }}
        />
        <Stack.Screen 
          name="Dialogue" 
          component={DialogueScreen}
          options={{
            title: 'Chat',
          }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            title: 'Profile',
          }}
        />
        <Stack.Screen 
          name="Notes" 
          component={NotesScreen}
          options={{
            title: 'Notes',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}