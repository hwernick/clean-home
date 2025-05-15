import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useTheme } from '../contexts/ThemeContext';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isDarkMode } = useTheme();

  const theme = {
    background: isDarkMode ? '#1c1c1c' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    subtitle: isDarkMode ? '#888' : '#666',
    button: '#007AFF',
    secondaryButton: isDarkMode ? '#2a2a2a' : '#e5e5e5',
    buttonText: '#fff',
  };

  const navigateToPersonalHub = () => {
    navigation.navigate('PersonalPhilosophyHub' as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Welcome to ClassicaI</Text>
        <Text style={[styles.subtitle, { color: theme.subtitle }]}>Your AI philosophy tutor</Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.button }]}
          onPress={() => navigation.navigate('Dialogue' as never)}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Start Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { backgroundColor: theme.secondaryButton }]}
          onPress={navigateToPersonalHub}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>Personal Philosophy Hub</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
