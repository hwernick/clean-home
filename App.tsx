import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BackgroundSyncService } from './services/BackgroundSyncService';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

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

// Define the type for your navigation parameters
export type RootStackParamList = {
  Home: undefined;
  Dialogue: { initialMessage?: string };
  Profile: undefined;
  Notes: {
    conversationId: string;
    messages: Array<{ role: string; content: string }>;
  };
  Login: undefined;
  Register: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  DataUsage: undefined;
  NotificationSettings: undefined;
  PersonalPhilosophyHub: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();

  const theme = {
    background: isDarkMode ? '#1c1c1c' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    card: isDarkMode ? '#2a2a2a' : '#f8f8f8',
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? "Home" : "Login"}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
            contentStyle: {
              backgroundColor: theme.background,
            },
          }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={({ navigation }) => ({
              title: 'Classical',
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Profile')}
                  style={{ marginRight: 16, padding: 4 }}
                >
                  <Ionicons name="person-circle" size={28} color={theme.text} />
                </TouchableOpacity>
              ),
              contentStyle: {
                backgroundColor: theme.background,
              },
            })}
          />
          <Stack.Screen
            name="Dialogue"
            component={DialogueScreen}
            options={{
              title: 'Socratic Dialogue',
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profile',
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="Notes"
            component={NotesScreen}
            options={{
              title: 'Notes',
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="PersonalPhilosophyHub"
            component={PersonalPhilosophyHub}
            options={{
              title: 'Personal Philosophy Hub',
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{
              title: 'Privacy',
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{
              title: 'Help & Support',
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="DataUsage"
            component={DataUsageScreen}
            options={{
              title: 'Data Usage',
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              title: 'Notification Settings',
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const { isDarkMode } = useTheme();
  const theme = {
    background: isDarkMode ? '#1c1c1c' : '#fff',
  };

  const navigationTheme = isDarkMode ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.background,
      card: theme.background,
      text: '#fff',
      border: '#444',
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.background,
      text: '#000',
      border: '#ddd',
    },
  };

  useEffect(() => {
    // Start background sync service
    BackgroundSyncService.start();

    // Cleanup on unmount
    return () => {
      BackgroundSyncService.stop();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer theme={navigationTheme}>
              <Navigation />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}