import * as Location from 'expo-location';
import { storageService } from './storage';

class LocationTracker {
  private intervalId: NodeJS.Timeout | null = null;
  private isTracking: boolean = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission not granted');
        return false;
      }

      // Request background permissions
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission not granted');
        // Still return true as we can work with foreground only
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.log('Tracking already started');
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permissions not granted');
    }

    this.isTracking = true;
    await storageService.setTrackerEnabled(true);

    // Track immediately
    await this.trackLocation();

    // Then track every minute (60000 ms)
    this.intervalId = setInterval(async () => {
      await this.trackLocation();
    }, 60000);

    console.log('Location tracking started');
  }

  async stopTracking(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isTracking = false;
    await storageService.setTrackerEnabled(false);
    console.log('Location tracking stopped');
  }

  private async trackLocation(): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      if (location) {
        await storageService.addTrack({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy || undefined,
        });
        console.log('Location tracked:', location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
      console.error('Error tracking location:', error);
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export const locationTracker = new LocationTracker();

