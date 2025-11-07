import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { locationTracker } from '@/services/locationTracker';
import { storageService } from '@/services/storage';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Restore tracking state on app launch
    const restoreTrackingState = async () => {
      try {
        const wasTracking = await storageService.getTrackerEnabled();
        if (wasTracking) {
          console.log('Restoring tracking state...');
          await locationTracker.startTracking();
        }
      } catch (error) {
        console.error('Error restoring tracking state:', error);
      }
    };

    restoreTrackingState();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
