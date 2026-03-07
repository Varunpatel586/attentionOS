import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AttentionOSBridge, {
  PermissionStatus,
} from '../utils/AttentionOSBridge';
import TrackingSyncService from '../services/TrackingSyncService';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * Screen for managing distracted scrolling tracking.
 * Displays today's and weekly distracted scrolling time,
 * handles permission requests, and controls tracking service.
 */
const TrackingScreen = () => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    usageStats: false,
    accessibility: false,
    notifications: false,
  });
  const [todayTime, setTodayTime] = useState(0);
  const [weeklyTime, setWeeklyTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  // Check permissions and load stats on mount
  useEffect(() => {
    loadData();

    // Sync tracking state with actual service status
    const syncTrackingState = async () => {
      try {
        const isRunning = await AttentionOSBridge.isTrackingRunning();
        setIsTracking(isRunning);
      } catch (error) {
        console.error('Error checking tracking state:', error);
      }
    };
    syncTrackingState();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadStats();
      syncTrackingState(); // Sync tracking state on each refresh
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Load permissions and statistics.
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([checkPermissions(), loadStats()]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check all required permissions.
   */
  const checkPermissions = async () => {
    try {
      const perms = await AttentionOSBridge.checkPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  /**
   * Load today's and weekly statistics.
   */
  const loadStats = async () => {
    try {
      const [today, weekly] = await Promise.all([
        AttentionOSBridge.getTodayDistractedTime(),
        AttentionOSBridge.getWeeklyDistractedTime(),
      ]);
      setTodayTime(today);
      setWeeklyTime(weekly);

      // Update widgets with new tracking data
      await TrackingSyncService.forceSync();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  /**
   * Start tracking service.
   */
  const handleStartTracking = () => {
    // Check if all permissions are granted
    if (!permissions.usageStats || !permissions.accessibility) {
      Alert.alert(
        'Permissions Required',
        'Please grant all required permissions before starting tracking.',
        [{ text: 'OK' }],
      );
      return;
    }

    AttentionOSBridge.startTracking();
    setIsTracking(true);
    Alert.alert(
      'Tracking Started',
      'AttentionOS is now monitoring your app usage.',
    );

    // Update widgets with new tracking state
    setTimeout(() => {
      TrackingSyncService.forceSync();
    }, 1000);
  };

  /**
   * Stop tracking service.
   */
  const handleStopTracking = () => {
    AttentionOSBridge.stopTracking();
    setIsTracking(false);
    Alert.alert('Tracking Stopped', 'AttentionOS has stopped monitoring.');

    // Update widgets with final tracking data
    TrackingSyncService.forceSync();
  };

  /**
   * Request Usage Stats permission.
   */
  const handleRequestUsageStats = () => {
    Alert.alert(
      'Usage Stats Permission',
      'AttentionOS needs access to usage stats to detect which app is currently open. This is required for tracking distracted scrolling.\n\nYou will be taken to Settings to grant this permission.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            AttentionOSBridge.requestUsageStatsPermission();
            // Re-check permissions after a delay (user might return from settings)
            setTimeout(checkPermissions, 2000);
          },
        },
      ],
    );
  };

  /**
   * Request Accessibility permission.
   */
  const handleRequestAccessibility = () => {
    Alert.alert(
      'Accessibility Permission',
      'AttentionOS uses Accessibility Service to detect scrolling behavior in apps like Instagram and YouTube.\n\nWe do NOT read your messages, posts, or any personal content. We only detect scroll events.\n\nYou will be taken to Settings to enable this service.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            AttentionOSBridge.requestAccessibilityPermission();
            // Re-check permissions after a delay
            setTimeout(checkPermissions, 2000);
          },
        },
      ],
    );
  };

  const allPermissionsGranted =
    permissions.usageStats && permissions.accessibility;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#262626" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Distracted Scrolling</Text>
          <Text style={styles.headerSubtitle}>
            Track your time spent on social media
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          {/* Today's Time */}
          <View style={[styles.statCard, styles.darkCard]}>
            <Ionicons name="today-outline" size={32} color="#FFF" />
            <Text style={styles.statValue}>
              {AttentionOSBridge.formatTime(todayTime)}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>

          {/* Weekly Time */}
          <View style={[styles.statCard, styles.lightCard]}>
            <Ionicons name="calendar-outline" size={32} color="#000" />
            <Text style={[styles.statValue, styles.darkText]}>
              {AttentionOSBridge.formatTime(weeklyTime)}
            </Text>
            <Text style={[styles.statLabel, styles.darkText]}>This Week</Text>
          </View>
        </View>

        {/* Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>

          {/* Usage Stats Permission */}
          <TouchableOpacity
            style={styles.permissionCard}
            onPress={handleRequestUsageStats}
            disabled={permissions.usageStats}
          >
            <View style={styles.permissionLeft}>
              <Ionicons
                name={
                  permissions.usageStats
                    ? 'checkmark-circle'
                    : 'alert-circle-outline'
                }
                size={24}
                color={permissions.usageStats ? '#4CAF50' : '#FF9800'}
              />
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>Usage Stats</Text>
                <Text style={styles.permissionDescription}>
                  Required to detect foreground app
                </Text>
              </View>
            </View>
            {!permissions.usageStats && (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>

          {/* Accessibility Permission */}
          <TouchableOpacity
            style={styles.permissionCard}
            onPress={handleRequestAccessibility}
            disabled={permissions.accessibility}
          >
            <View style={styles.permissionLeft}>
              <Ionicons
                name={
                  permissions.accessibility
                    ? 'checkmark-circle'
                    : 'alert-circle-outline'
                }
                size={24}
                color={permissions.accessibility ? '#4CAF50' : '#FF9800'}
              />
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>
                  Accessibility Service
                </Text>
                <Text style={styles.permissionDescription}>
                  Required to detect scrolling events
                </Text>
              </View>
            </View>
            {!permissions.accessibility && (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>
        </View>

        {/* Tracking Control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking Control</Text>

          {allPermissionsGranted ? (
            <TouchableOpacity
              style={[
                styles.trackingButton,
                isTracking ? styles.stopButton : styles.startButton,
              ]}
              onPress={isTracking ? handleStopTracking : handleStartTracking}
            >
              <Ionicons
                name={isTracking ? 'stop-circle' : 'play-circle'}
                size={24}
                color="#FFF"
              />
              <Text style={styles.trackingButtonText}>
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.warningCard}>
              <Ionicons name="warning-outline" size={24} color="#FF9800" />
              <Text style={styles.warningText}>
                Please grant all permissions to start tracking
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              AttentionOS tracks your attention capture in distraction apps like
              Instagram, YouTube, and TikTok.
            </Text>
            <Text style={styles.infoText}>
              • We detect attention capture in distraction apps
            </Text>
            <Text style={styles.infoText}>
              • This includes watching reels, shorts, or continuous feeds
            </Text>
            <Text style={styles.infoText}>
              • Detection works even without frequent scrolling
            </Text>
            <Text style={styles.infoText}>
              • We do NOT read your content or messages
            </Text>
            <Text style={styles.infoText}>
              • All data is stored locally on your device
            </Text>
            <Text style={styles.infoText}>
              • Statistics update every minute
            </Text>
          </View>
        </View>

        {/* Widget Refresh */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Widget Sync</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={async () => {
              try {
                await TrackingSyncService.forceSync();
                Alert.alert(
                  'Success',
                  'Widgets updated with latest tracking data',
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to update widgets');
              }
            }}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.refreshButtonText}>Refresh Widgets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.refreshButton,
              { marginTop: 12, backgroundColor: '#FF6B6B' },
            ]}
            onPress={async () => {
              try {
                console.log('🧪 Testing immediate sync...');
                const todayDistractedTime =
                  await AttentionOSBridge.getTodayDistractedTime();
                console.log(
                  '📊 Test - Today distracted time:',
                  todayDistractedTime,
                );

                const widgetData = await TrackingSyncService.getWidgetData();
                console.log('📱 Test - Widget data:', widgetData);

                Alert.alert(
                  'Test Results',
                  `Distracted time: ${todayDistractedTime}ms\nWidget data: ${JSON.stringify(
                    widgetData,
                    null,
                    2,
                  )}`,
                );
              } catch (error: any) {
                console.error('Test failed:', error);
                Alert.alert('Test Error', error?.message || 'Unknown error');
              }
            }}
          >
            <Ionicons name="bug" size={20} color="#FFF" />
            <Text style={styles.refreshButtonText}>Test Debug</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  darkCard: {
    backgroundColor: '#262626',
  },
  lightCard: {
    backgroundColor: '#E9E5DC',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
    fontFamily: 'Poppins',
  },
  statLabel: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 4,
    fontFamily: 'Poppins',
  },
  darkText: {
    color: '#000',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    fontFamily: 'Poppins',
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E9E5DC',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    marginLeft: 12,
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
  },
  permissionDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  trackingButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    fontFamily: 'Poppins',
  },
  infoCard: {
    backgroundColor: '#E9E5DC',
    padding: 16,
    borderRadius: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
});

export default TrackingScreen;
