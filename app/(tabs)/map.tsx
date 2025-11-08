import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { storageService, GPSTrack } from '@/services/storage';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [tracks, setTracks] = useState<GPSTrack[]>([]);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const colorScheme = useColorScheme();

  const loadTracks = async () => {
    try {
      const loadedTracks = await storageService.getTracks();
      // Sort by timestamp ascending for proper polyline order
      loadedTracks.sort((a, b) => a.timestamp - b.timestamp);
      setTracks(loadedTracks);
      
      // Try to get user's current location
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location);
      } catch (error) {
        console.log('Could not get user location:', error);
      }
      
      // Center map on tracks if available
      if (loadedTracks.length > 0) {
        // Calculate bounds to fit all tracks
        const latitudes = loadedTracks.map(t => t.latitude);
        const longitudes = loadedTracks.map(t => t.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        // Add padding to deltas
        const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
        const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);
        
        setRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        });
      } else if (userLocation) {
        // Center on user location if no tracks
        setRegion({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTracks();
    }, [])
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        mapType="standard"
      >
        {/* Draw polyline connecting all tracks */}
        {tracks.length > 1 && (
          <Polyline
            coordinates={tracks.map(track => ({
              latitude: track.latitude,
              longitude: track.longitude,
            }))}
            strokeColor="#0066FF"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
          />
        )}
        
        {/* Draw markers for each track point */}
        {tracks.map((track, index) => (
          <Marker
            key={track.id}
            coordinate={{
              latitude: track.latitude,
              longitude: track.longitude,
            }}
            title={`Point ${index + 1}`}
            description={formatDate(track.timestamp)}
            pinColor={index === 0 ? 'green' : index === tracks.length - 1 ? 'red' : 'blue'}
          />
        ))}
      </MapView>
      
      {/* Info overlay */}
      <View style={[styles.infoContainer, colorScheme === 'dark' && styles.infoContainerDark]}>
        <ThemedText style={styles.infoText}>
          {tracks.length === 0 
            ? 'No GPS tracks recorded yet' 
            : `${tracks.length} GPS ${tracks.length === 1 ? 'point' : 'points'} tracked`
          }
        </ThemedText>
        {tracks.length > 0 && (
          <ThemedText style={styles.infoSubtext}>
            🟢 Start • 🔵 Points • 🔴 End
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
});

