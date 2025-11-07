import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GPSTrack {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

const TRACKS_STORAGE_KEY = '@gps_tracks';
const TRACKER_ENABLED_KEY = '@tracker_enabled';

export const storageService = {
  // Get all GPS tracks
  async getTracks(): Promise<GPSTrack[]> {
    try {
      const tracksJson = await AsyncStorage.getItem(TRACKS_STORAGE_KEY);
      return tracksJson ? JSON.parse(tracksJson) : [];
    } catch (error) {
      console.error('Error loading tracks:', error);
      return [];
    }
  },

  // Add a new GPS track
  async addTrack(track: Omit<GPSTrack, 'id'>): Promise<void> {
    try {
      const tracks = await this.getTracks();
      const newTrack: GPSTrack = {
        ...track,
        id: Date.now().toString(),
      };
      tracks.push(newTrack);
      await AsyncStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(tracks));
    } catch (error) {
      console.error('Error saving track:', error);
    }
  },

  // Clear all tracks
  async clearTracks(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TRACKS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing tracks:', error);
    }
  },

  // Get tracker enabled state
  async getTrackerEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(TRACKER_ENABLED_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error loading tracker state:', error);
      return false;
    }
  },

  // Set tracker enabled state
  async setTrackerEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(TRACKER_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.error('Error saving tracker state:', error);
    }
  },
};

