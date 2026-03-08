// Example JavaScript implementation for permission handling
// This file shows how to use the updated AttentionOSModule

import { NativeModules, Alert, Linking } from 'react-native';
const { AttentionOSModule } = NativeModules;

export const startTrackingWithPermissions = async () => {
  try {
    const result = await AttentionOSModule.startTracking();
    
    if (result.canStart) {
      // All permissions granted, start tracking
      AttentionOSModule.startTrackingWithPermissions();
      console.log('Tracking started successfully');
    } else {
      // Show permission dialog to user
      const missingPermissions = [];
      if (!result.hasUsageStats) missingPermissions.push('Usage Stats');
      if (!result.hasAccessibility) missingPermissions.push('Accessibility');
      
      const message = `AttentionOS requires the following permissions to track your screen time:\n\n` +
        missingPermissions.map(p => `• ${p}`).join('\n') +
        '\n\nWould you like to enable these permissions now?`;
      
      Alert.alert(
        'Permissions Required',
        message,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => console.log('User declined to grant permissions')
          },
          {
            text: 'Enable Permissions',
            onPress: () => openPermissionSettings(result)
          }
        ],
        { cancelable: false }
      );
    }
  } catch (error) {
    console.error('Error starting tracking:', error);
  }
};

const openPermissionSettings = async (permissionStatus) => {
  try {
    // Open Usage Stats settings if needed
    if (!permissionStatus.hasUsageStats) {
      await AttentionOSModule.requestUsageStatsPermission();
    }
    
    // Open Accessibility settings if needed (with small delay)
    if (!permissionStatus.hasAccessibility) {
      setTimeout(() => {
        AttentionOSModule.requestAccessibilityPermission();
      }, 1000);
    }
  } catch (error) {
    console.error('Error opening permission settings:', error);
  }
};

// Usage example:
// import { startTrackingWithPermissions } from './permissionHandler';
// 
// const handleStartTracking = () => {
//   startTrackingWithPermissions();
// };
