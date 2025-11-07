import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { locationTracker } from '@/services/locationTracker';
import { storageService } from '@/services/storage';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trackCount, setTrackCount] = useState(0);
  
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'background');

  const loadSettings = async () => {
    const enabled = await storageService.getTrackerEnabled();
    setIsTracking(enabled);
    
    const tracks = await storageService.getTracks();
    setTrackCount(tracks.length);
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const handleToggleTracking = async (value: boolean) => {
    setIsLoading(true);
    try {
      if (value) {
        // Start tracking
        await locationTracker.startTracking();
        setIsTracking(true);
        Alert.alert(
          'Tracking Started',
          'GPS tracking is now active. Location will be recorded every minute.',
          [{ text: 'OK' }]
        );
      } else {
        // Stop tracking
        await locationTracker.stopTracking();
        setIsTracking(false);
        Alert.alert(
          'Tracking Stopped',
          'GPS tracking has been disabled.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to toggle tracking. Please check location permissions.',
        [{ text: 'OK' }]
      );
      setIsTracking(!value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLocation = async () => {
    try {
      const location = await locationTracker.getCurrentLocation();
      if (location) {
        Alert.alert(
          'Current Location',
          `Latitude: ${location.coords.latitude.toFixed(6)}\n` +
          `Longitude: ${location.coords.longitude.toFixed(6)}\n` +
          `Accuracy: ±${location.coords.accuracy?.toFixed(0) || 'N/A'}m`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Could not get current location', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Check permissions.', [{ text: 'OK' }]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          Settings
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Configure GPS tracking
        </ThemedText>
      </View>

      <View style={styles.content}>
        {/* Main Tracking Toggle */}
        <View style={[styles.card, { backgroundColor: cardBackground, shadowColor: textColor }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <ThemedText style={styles.cardTitle}>GPS Tracking</ThemedText>
              <ThemedText style={styles.cardDescription}>
                Track location every minute
              </ThemedText>
            </View>
            <Switch
              value={isTracking}
              onValueChange={handleToggleTracking}
              disabled={isLoading}
              trackColor={{ false: '#767577', true: tintColor + '80' }}
              thumbColor={isTracking ? tintColor : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
          
          {isTracking && (
            <View style={[styles.statusBanner, { backgroundColor: tintColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: tintColor }]} />
              <Text style={[styles.statusText, { color: tintColor }]}>
                Tracking Active
              </Text>
            </View>
          )}
        </View>

        {/* Stats Card */}
        <View style={[styles.card, { backgroundColor: cardBackground, shadowColor: textColor }]}>
          <ThemedText style={styles.cardTitle}>Statistics</ThemedText>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{trackCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Total Tracks</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>1 min</ThemedText>
              <ThemedText style={styles.statLabel}>Interval</ThemedText>
            </View>
          </View>
        </View>

        {/* Test Location Button */}
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: tintColor }]}
          onPress={handleTestLocation}
        >
          <Text style={styles.testButtonText}>Test Current Location</Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: cardBackground, shadowColor: textColor }]}>
          <ThemedText style={styles.infoTitle}>How it works</ThemedText>
          <ThemedText style={styles.infoText}>
            • Enable tracking to start recording GPS coordinates{'\n'}
            • Location is captured every 60 seconds{'\n'}
            • Data is stored locally on your device{'\n'}
            • View all recorded tracks in the Tracks tab{'\n'}
            • Works in background when app is minimized
          </ThemedText>
        </View>

        {/* Platform Info */}
        <View style={styles.platformInfo}>
          <ThemedText style={styles.platformText}>
            Platform: {Platform.OS === 'ios' ? 'iOS' : 'Android'}
          </ThemedText>
          <ThemedText style={styles.platformText}>
            Version: 1.0.0
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  testButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  platformInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  platformText: {
    fontSize: 12,
    opacity: 0.4,
    marginBottom: 4,
  },
});
