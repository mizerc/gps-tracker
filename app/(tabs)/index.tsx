import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { GPSTrack, storageService } from "@/services/storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TracksScreen() {
  const [tracks, setTracks] = useState<GPSTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const loadTracks = async () => {
    setIsLoading(true);
    const loadedTracks = await storageService.getTracks();
    // Sort by timestamp descending (newest first)
    loadedTracks.sort((a, b) => b.timestamp - a.timestamp);
    setTracks(loadedTracks);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTracks();
    }, [])
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const renderTrackItem = ({ item }: { item: GPSTrack }) => (
    <View style={[styles.trackItem, { borderBottomColor: textColor + "20" }]}>
      <View style={styles.trackHeader}>
        <Text style={[styles.timestamp, { color: textColor }]}>
          {formatDate(item.timestamp)}
        </Text>
        {item.accuracy && (
          <Text style={[styles.accuracy, { color: textColor + "80" }]}>
            ±{item.accuracy.toFixed(0)}m
          </Text>
        )}
      </View>
      <Text style={[styles.coordinates, { color: tintColor }]}>
        {formatCoordinates(item.latitude, item.longitude)}
      </Text>
      <View style={styles.detailsRow}>
        <Text style={[styles.detail, { color: textColor + "80" }]}>
          Lat: {item.latitude.toFixed(6)}
        </Text>
        <Text style={[styles.detail, { color: textColor + "80" }]}>
          Lng: {item.longitude.toFixed(6)}
        </Text>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          GPS Tracks
        </ThemedText>
        <ThemedText style={styles.count}>
          {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
        </ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ThemedText>Loading tracks...</ThemedText>
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.centerContent}>
          <ThemedText style={styles.emptyText}>
            No GPS tracks recorded yet
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Enable tracking in Settings to start collecting data
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={tracks}
          renderItem={renderTrackItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    fontWeight: "bold",
    marginBottom: 8,
  },
  count: {
    fontSize: 16,
    opacity: 0.6,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  trackItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  trackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    fontWeight: "600",
  },
  accuracy: {
    fontSize: 12,
  },
  coordinates: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detail: {
    fontSize: 12,
  },
});
