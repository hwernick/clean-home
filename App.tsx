import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

// Import your screens here
import DialogueScreen from './screens/DialogueScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotesScreen from './screens/NotesScreen';
import PhilosopherCenter from './screens/PhilosopherCenter';
import PersonalPhilosophyHub from './screens/PersonalPhilosophyHub';
import LoginScreen from './screens/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivacyScreen from './screens/settings/PrivacyScreen';
import HelpSupportScreen from './screens/settings/HelpSupportScreen';
import DataUsageScreen from './screens/settings/DataUsageScreen';
import NotificationSettingsScreen from './screens/settings/NotificationSettingsScreen';

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
  PersonalPhilosophyHub: undefined;
  Login: undefined;
  Register: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  DataUsage: undefined;
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c1c' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? "Home" : "Login"}
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
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
      ) : (
        <>
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
          <Stack.Screen
            name="PersonalPhilosophyHub"
            component={PersonalPhilosophyHub}
            options={{
              title: 'Personal Philosophy Hub',
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
            name="Privacy"
            component={PrivacyScreen}
            options={{
              title: 'Privacy',
              headerStyle: {
                backgroundColor: '#1c1c1c',
              },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{
              title: 'Help & Support',
              headerStyle: {
                backgroundColor: '#1c1c1c',
              },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="DataUsage"
            component={DataUsageScreen}
            options={{
              headerStyle: {
                backgroundColor: '#1c1c1c',
              },
              headerTintColor: '#fff',
              headerTitle: 'Data Usage',
            }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              headerStyle: {
                backgroundColor: '#1c1c1c',
              },
              headerTintColor: '#fff',
              headerTitle: 'Notification Settings',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    </AuthProvider>
  );
}