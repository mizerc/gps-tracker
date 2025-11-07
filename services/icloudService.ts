import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { GPSTrack } from './storage';

const TRACKS_FILENAME = 'gps-tracks.json';

class ICloudService {
  private getLocalFile(): File {
    return new File(Paths.cache, TRACKS_FILENAME);
  }

  /**
   * Check if iCloud is available on the device
   */
  isAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  /**
   * Check if sharing is available
   */
  async isSharingAvailable(): Promise<boolean> {
    return await Sharing.isAvailableAsync();
  }

  /**
   * Export GPS tracks to iCloud Drive via sharing
   * User can choose to save to iCloud Drive, Files app, or other locations
   */
  async exportToICloud(tracks: GPSTrack[]): Promise<boolean> {
    try {
      // Create formatted export data with metadata
      const exportData = this.formatExportData(tracks);
      
      // Write to local temporary file
      const file = this.getLocalFile();
      await file.write(exportData);
      
      // Check if sharing is available
      const canShare = await this.isSharingAvailable();
      
      if (!canShare) {
        Alert.alert('Not Available', 'Sharing is not available on this device');
        return false;
      }
      
      // Share the file - on iOS, user can save to iCloud Drive
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save GPS Tracks to iCloud Drive',
        UTI: 'public.json',
      });
      
      return true;
    } catch (error) {
      console.error('Error exporting to iCloud:', error);
      Alert.alert('Export Failed', 'Failed to export GPS tracks. Please try again.');
      return false;
    }
  }

  /**
   * Import GPS tracks from a file using document picker
   */
  async importFromICloud(): Promise<GPSTrack[] | null> {
    try {
      // Open document picker to select a JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return null;
      }
      
      const file = result.assets[0];
      
      if (!file || !file.uri) {
        Alert.alert('Import Failed', 'No file selected');
        return null;
      }
      
      // Import from the selected file
      return await this.importFromFile(file.uri);
    } catch (error) {
      console.error('Error importing from iCloud:', error);
      Alert.alert('Import Failed', 'Failed to import GPS tracks. Please try again.');
      return null;
    }
  }

  /**
   * Import GPS tracks from a JSON file
   */
  async importFromFile(fileUri: string): Promise<GPSTrack[] | null> {
    try {
      // Read the file content
      const file = new File(fileUri);
      const fileContent = await file.text();
      
      // Parse JSON
      const data = JSON.parse(fileContent);
      
      // Handle both old format (direct array) and new format (with metadata)
      let tracks: GPSTrack[];
      if (Array.isArray(data)) {
        tracks = data;
      } else if (data.tracks && Array.isArray(data.tracks)) {
        tracks = data.tracks;
      } else {
        throw new Error('Invalid file format: expected tracks array');
      }
      
      // Validate each track has required fields
      const isValid = tracks.every(track => 
        track.id && 
        typeof track.latitude === 'number' && 
        typeof track.longitude === 'number' && 
        typeof track.timestamp === 'number'
      );
      
      if (!isValid) {
        throw new Error('Invalid file format: tracks missing required fields');
      }
      
      return tracks;
    } catch (error) {
      console.error('Error importing from file:', error);
      Alert.alert(
        'Import Failed', 
        'Failed to import GPS tracks. Please ensure the file is valid.'
      );
      return null;
    }
  }

  /**
   * Create a backup of current tracks to local storage
   */
  async createLocalBackup(tracks: GPSTrack[]): Promise<string | null> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `gps-tracks-backup-${timestamp}.json`;
      const backupFile = new File(Paths.cache, backupFilename);
      
      const tracksJson = JSON.stringify(tracks, null, 2);
      await backupFile.write(tracksJson);
      
      return backupFile.uri;
    } catch (error) {
      console.error('Error creating local backup:', error);
      return null;
    }
  }

  /**
   * Format tracks data for export with metadata
   */
  formatExportData(tracks: GPSTrack[]): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
      appName: 'AI GPS Tracker',
      tracksCount: tracks.length,
      tracks: tracks,
    };
    
    return JSON.stringify(exportData, null, 2);
  }
}

export const icloudService = new ICloudService();
