import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import NotificationService from './services/NotificationService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BackgroundSyncService } from './services/BackgroundSyncService';

// Import your screens here
import DialogueScreen from './screens/DialogueScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotesScreen from './screens/NotesScreen';
import PersonalPhilosophyHub from './screens/PersonalPhilosophyHub';
import LoginScreen from './screens/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivacyScreen from './screens/settings/PrivacyScreen';
import HelpSupportScreen from './screens/settings/HelpSupportScreen';
import DataUsageScreen from './screens/settings/DataUsageScreen';
import NotificationSettingsScreen from './screens/settings/NotificationSettingsScreen';
import PhilosopherHub from './screens/PhilosopherHub';

// Define the type for your navigation parameters
export type RootStackParamList = {
  Home: undefined;
  Dialogue: { initialMessage?: string };
  Profile: undefined;
  Notes: {
    conversationId: string;
    messages: Array<{ role: string; content: string }>;
  };
  PersonalPhilosophyHub: undefined;
  Login: undefined;
  Register: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  DataUsage: undefined;
  NotificationSettings: undefined;
  PhilosopherHub: undefined;
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
            }}
          />
          <Stack.Screen
            name="Dialogue"
            component={DialogueScreen}
            options={{
              title: 'Socratic Dialogue',
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
          <Stack.Screen
            name="PersonalPhilosophyHub"
            component={PersonalPhilosophyHub}
            options={{
              title: 'Personal Philosophy Hub',
            }}
          />
          <Stack.Screen
            name="PhilosopherHub"
            component={PhilosopherHub}
            options={{
              title: 'Philosopher Hub',
            }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{
              title: 'Privacy',
            }}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{
              title: 'Help & Support',
            }}
          />
          <Stack.Screen
            name="DataUsage"
            component={DataUsageScreen}
            options={{
              title: 'Data Usage',
            }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              title: 'Notification Settings',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Start background sync service
    BackgroundSyncService.start();

    // Cleanup on unmount
    return () => {
      BackgroundSyncService.stop();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <Navigation />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}