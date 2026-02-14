# AttentionOS

> A productivity and focus tracking mobile app for Android

AttentionOS is a React Native mobile application designed to help you take control of your attention and maximize productivity. Built for Android, it combines focus time tracking, task management, and distraction monitoring to help you understand and improve how you spend your time. Whether you're using the Pomodoro technique or tracking your focus sessions, AttentionOS provides the tools you need to stay on task and achieve your goals.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Firebase Configuration](#firebase-configuration)
- [Native Module Setup](#native-module-setup)
- [Running the App](#running-the-app)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [Contributing](#contributing)

## About

AttentionOS is a comprehensive productivity app that helps you manage your focus time and track distractions throughout your day. The app features a unique "Big Three" task management system that encourages you to focus on your three most important tasks each day, combined with powerful time tracking capabilities that distinguish between focused work and distracted scrolling.

Built with React Native and Firebase, AttentionOS integrates native Android functionality to monitor app usage in real-time, providing accurate insights into how you spend your time on your device.

## Features

✨ **Firebase Authentication** - Secure login and signup with email/password authentication

⏱️ **Focus & Scroll Mode Tracking** - Toggle between focus and scroll modes with real-time monitoring of your time in each state

🎯 **Big Three Task Management** - Prioritize your day by selecting three key tasks to focus on

✅ **Todo List** - Create and manage your daily tasks with completion tracking

🍅 **Pomodoro Timer** - Built-in 25-minute focus sessions with 5-minute breaks

♾️ **Infinite Timer Mode** - Track extended focus sessions without time limits

📊 **Distraction Tracking** - Monitor context switches and distractions throughout your day

📱 **Native Android Integration** - Real-time app usage tracking using native Kotlin modules

🧭 **Bottom Tab Navigation** - Easy access to Home, Timer, Tracking, and Stats screens

👤 **User Profile** - Personalized experience with user preferences and settings

## Tech Stack

**Framework**
- React Native 0.83.0

**Backend Services**
- Firebase Authentication
- Cloud Firestore

**Navigation**
- React Navigation (native-stack)
- React Navigation (bottom-tabs)

**Languages**
- TypeScript
- JavaScript

**UI Libraries**
- React Native Vector Icons
- React Native Safe Area Context

**Native Modules**
- Custom Android modules (Kotlin) for app usage tracking

**Platform**
- Android (primary target)

## Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** (version 20 or higher)
  ```bash
  node --version
  ```

- **React Native CLI Environment** - Complete the [React Native CLI setup for Android](https://reactnative.dev/docs/environment-setup?platform=android)

- **Android Studio** - Latest version with Android SDK installed

- **JDK** (Java Development Kit) - Version 17 or higher required for React Native 0.83

- **Firebase Account** - You'll need a Firebase project for authentication and database

- **Android Emulator or Physical Device** - For running and testing the app

## Installation

Follow these steps to set up the project locally:

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/attentionOS.git
cd attentionOS
```

2. **Install dependencies**

```bash
npm install
```

3. **Proceed to Firebase Configuration** (see next section)

## Firebase Configuration

AttentionOS requires Firebase for authentication and data storage. Follow these steps to configure Firebase:

1. **Create a Firebase Project**
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard

2. **Add an Android App**
   - In your Firebase project, click "Add app" and select Android
   - Register your app with the package name: `com.attentionos`

3. **Download Configuration File**
   - Download the `google-services.json` file from Firebase Console

4. **Place Configuration File**
   - Place the `google-services.json` file in the following directory:
   ```
   android/app/google-services.json
   ```

5. **Enable Firebase Authentication**
   - In Firebase Console, go to Authentication → Sign-in method
   - Enable "Email/Password" authentication

6. **Enable Cloud Firestore**
   - In Firebase Console, go to Firestore Database
   - Click "Create database"
   - Start in production mode or test mode (configure security rules as needed)

7. **Firestore Collections Setup**
   - The app will automatically create the following collections:
     - `users` - User profiles and settings
     - `users/{userId}/bigThree` - User's Big Three tasks
     - `users/{userId}/todos` - User's todo items

**Troubleshooting Firebase:**
- If you see "Default Firebase app not initialized", ensure `google-services.json` is in the correct location
- Run a clean build after adding Firebase configuration: `cd android && ./gradlew clean && cd ..`
- Verify your package name matches exactly: `com.attentionos`

## Native Module Setup

AttentionOS uses custom native Android modules to track app usage and detect scrolling behavior. Understanding these components will help you work with the app effectively.

### Required Permissions

The app requires the following Android permissions, which are requested at runtime:

- **Usage Stats Permission** - Allows the app to track which apps you're using and for how long. This is essential for distinguishing between focus time and distracted scrolling.

- **Accessibility Permission** - Enables detection of scrolling behavior within apps. This helps identify when you're actively scrolling through social media or other distracting content.

- **Notification Permission** - Required for the foreground service that runs the tracking functionality in the background.

These permissions are requested through the app's UI when you first enable tracking features. The app will guide you through granting these permissions in your device settings.

### AttentionOSBridge Native Module

The `AttentionOSBridge` is a custom native module written in Kotlin that provides the bridge between React Native and Android's native APIs. It handles:

- Starting and stopping usage tracking
- Retrieving daily distracted time statistics
- Checking permission status
- Managing the foreground service

**Example usage in JavaScript:**

```javascript
import AttentionOSBridge from '../utils/AttentionOSBridge';

// Check if tracking is running
const isRunning = await AttentionOSBridge.isTrackingRunning();

// Start tracking
AttentionOSBridge.startTracking();

// Stop tracking
AttentionOSBridge.stopTracking();

// Get today's distracted time (in milliseconds)
const distractedTime = await AttentionOSBridge.getTodayDistractedTime();

// Check permissions
const permissions = await AttentionOSBridge.checkPermissions();
```

**Important Note:** Any changes to native code (Kotlin files in `android/app/src/main/java/com/attentionos/`) require a clean build to take effect. See the troubleshooting section for clean build instructions.

## Running the App

### Start Metro Bundler

First, start the Metro bundler (React Native's JavaScript bundler):

```bash
npm start
```

Keep this terminal running. Metro will watch for file changes and rebuild your JavaScript bundle.

### Build and Run on Android

Open a new terminal and run:

```bash
npm run android
```

This command will:
- Build the Android app
- Install it on your connected device or running emulator
- Launch the app automatically

**Requirements:**
- Metro bundler must be running (from the previous step)
- An Android emulator must be running, OR
- An Android device must be connected via USB with USB debugging enabled

### Clean Build (When Needed)

If you've made changes to native code, installed new native dependencies, or encounter build issues, perform a clean build:

```bash
cd android
./gradlew clean
cd ..
npm run android
```

On Windows, use:
```bash
cd android
.\gradlew clean
cd ..
npm run android
```

## Development Workflow

### Fast Refresh

React Native's Fast Refresh automatically updates the app when you save changes to your JavaScript/TypeScript files. You'll see your changes reflected immediately without losing component state.

### Manual Reload

To manually reload the app:
- Press `R` twice quickly in the terminal where Metro is running, OR
- Shake your device and select "Reload" from the developer menu

### Developer Menu

Access the React Native developer menu:
- **Android Emulator:** Press `Ctrl + M` (Windows/Linux) or `Cmd + M` (macOS)
- **Android Device:** Shake the device

From the developer menu, you can:
- Reload the app
- Enable/disable Fast Refresh
- Toggle element inspector
- Show performance monitor
- Access debugging tools

### Reset Metro Cache

If you encounter unexpected behavior or caching issues:

```bash
npx react-native start --reset-cache
```

### When to Perform a Full Rebuild

You need a full rebuild (clean build) when:
- Adding or updating native dependencies (e.g., React Native libraries with native code)
- Modifying native Android code (Kotlin/Java files)
- Changing Android manifest or build configuration
- Updating Firebase configuration
- Experiencing persistent build or runtime errors

## Project Structure

```
attentionOS/
├── android/                          # Native Android code
│   └── app/
│       ├── src/main/java/com/attentionos/  # Kotlin native modules
│       └── google-services.json      # Firebase configuration (you add this)
├── src/                              # React Native source code
│   ├── screens/                      # Screen components
│   │   ├── HomeScreen.js            # Main dashboard with Big Three and todos
│   │   ├── TimerScreen.js           # Pomodoro and infinite timer
│   │   ├── TrackingScreen.tsx       # App usage tracking interface
│   │   ├── StatsScreen.js           # Statistics and insights
│   │   ├── LoginScreen.js           # Authentication - login
│   │   ├── SignupScreen.js          # Authentication - signup
│   │   └── SplashScreen.js          # App launch screen
│   ├── components/                   # Reusable UI components
│   │   └── BottomNavbar.js          # Bottom tab navigation
│   ├── navigation/                   # Navigation configuration
│   │   ├── RootNavigator.tsx        # Root navigation logic
│   │   ├── AppStack.tsx             # Authenticated app navigation
│   │   └── AppTabs.tsx              # Bottom tab navigator
│   ├── utils/                        # Utility functions and helpers
│   │   └── AttentionOSBridge.ts     # Native module bridge interface
│   └── App.tsx                       # App entry point
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

**Key Directories:**

- **`src/screens/`** - All screen components. Each screen represents a full-page view in the app.
- **`src/components/`** - Reusable UI components used across multiple screens.
- **`src/navigation/`** - React Navigation configuration for app routing and navigation flow.
- **`src/utils/`** - Helper functions, constants, and the native module bridge.
- **`android/app/src/main/java/com/attentionos/`** - Native Android code including the AttentionOSBridge module.

## Troubleshooting

### Metro Bundler Issues

**Problem:** Metro bundler fails to start or shows port conflicts

**Solution:**
```bash
# Kill any process using port 8081
npx react-native start --reset-cache

# On Windows, if port is in use:
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### Android Build Failures

**Problem:** Build fails with Gradle errors or dependency issues

**Solution:**
```bash
# Clean the build
cd android
./gradlew clean
cd ..

# Clear Gradle cache (if issues persist)
cd android
./gradlew clean --refresh-dependencies
cd ..

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Firebase Connection Issues

**Problem:** App crashes or shows Firebase initialization errors

**Solution:**
- Verify `google-services.json` is in `android/app/` directory
- Confirm package name in Firebase Console matches `com.attentionos`
- Ensure Firebase Authentication and Firestore are enabled in Firebase Console
- Perform a clean build after adding/updating Firebase configuration
- Check that your Firebase project has the correct Android app registered

### Native Module Errors

**Problem:** AttentionOSBridge methods fail or return undefined

**Solution:**
- Ensure you've performed a clean build after any native code changes
- Verify permissions are granted in device settings
- Check Android logs for native errors:
  ```bash
  npx react-native log-android
  ```
- Rebuild the app completely:
  ```bash
  cd android
  ./gradlew clean
  cd ..
  npm run android
  ```

### Permission-Related Issues

**Problem:** Tracking features don't work or permissions aren't requested

**Solution:**
- Manually grant permissions in device Settings → Apps → AttentionOS → Permissions
- For Usage Stats: Settings → Apps → Special app access → Usage access → AttentionOS
- For Accessibility: Settings → Accessibility → AttentionOS
- Restart the app after granting permissions

### General Troubleshooting Steps

If you encounter any issues:

1. **Clear all caches:**
   ```bash
   # Clear Metro cache
   npx react-native start --reset-cache
   
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

2. **Perform a complete clean build:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

3. **Check for error logs:**
   ```bash
   # View Android logs
   npx react-native log-android
   ```

## Resources

- **[React Native Documentation](https://reactnative.dev/docs/getting-started)** - Official React Native guides and API reference
- **[Firebase Documentation](https://firebase.google.com/docs)** - Firebase setup, authentication, and Firestore guides
- **[React Navigation Documentation](https://reactnavigation.org/docs/getting-started)** - Navigation library documentation
- **[React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)** - Icon library documentation and icon directory
- **[Android Developers](https://developer.android.com/)** - Android development resources and native API documentation

## Contributing

We welcome contributions to AttentionOS! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Reporting Issues

If you encounter bugs or have feature requests:
- Check existing issues to avoid duplicates
- Provide detailed information about the problem
- Include steps to reproduce the issue
- Share relevant error messages or screenshots

### License

This project is currently unlicensed. License information will be added in a future update.

---

**Built with ❤️ for better focus and productivity**
