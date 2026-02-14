# AttentionOS

**An attention tracking and digital wellness platform for Android.**

AttentionOS is a productivity system built to measure and improve how users spend their attention. It combines structured focus sessions, task prioritization, and real-time behavioral tracking to provide actionable insights into digital distraction.

Unlike traditional productivity apps that rely only on manual timers or task lists, AttentionOS integrates native Android services to detect scrolling behavior and context switching. The result is a measurable model of focus versus distraction.

---

## Overview

AttentionOS is built as a hybrid architecture:

- **React Native** for UI and application logic
- **Firebase** for authentication and cloud data
- **Native Kotlin modules** for real-time app usage and scrolling detection

All behavioral classification runs locally on-device.

---

## Core Capabilities

### Focus Tracking
- Pomodoro mode (25/5 cycles)
- Unlimited focus sessions
- Live focus duration tracking
- Context switch detection

### Distraction Detection
- Foreground app monitoring via `UsageStatsManager`
- Scroll event detection via `AccessibilityService`
- Session classification (active scrolling, passive consumption, hybrid)
- Real-time background tracking via foreground service

### Task System
- "Big Three" daily priorities
- Todo list with completion tracking
- Firestore-backed persistence

### Analytics
- Daily focus vs scroll breakdown
- Context switch count
- Time-loss estimation model
- Session-based statistics

---

## Architecture

```
React Native Layer
    UI, Navigation, State Management
            ↓
Firebase
    Authentication + Cloud Firestore
            ↓
Native Android Layer (Kotlin)
    UsageStatsManager
    AccessibilityService
    ForegroundService
    Room Database
            ↓
Behavior Classification Engine
```

Widgets read directly from local storage for low-latency updates.

---

## Technology Stack

**Frontend**
- React Native (CLI)
- TypeScript
- React Navigation

**Backend**
- Firebase Authentication
- Cloud Firestore

**Native Android**
- Kotlin
- Room (local database)
- Coroutines
- UsageStatsManager
- AccessibilityService
- Foreground Service

**Platform**
- Android (primary)

---

## Privacy Model

AttentionOS is designed with a strict local-first privacy model:

- No content is read or stored
- No screen recording
- No keystroke capture
- Only foreground app state and scroll events are monitored
- Behavioral processing runs entirely on-device

---

## Installation

### Requirements

- Node.js ≥ 20
- JDK 17+
- Android Studio with SDK
- Firebase project configured

### Setup

```bash
git clone https://github.com/yourusername/attentionOS.git
cd attentionOS
npm install
```

Add your Firebase configuration:

```
android/app/google-services.json
```

Then run:

```bash
npm start
npm run android
```

If native changes were made:

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Required Android Permissions

The app requires:

- Usage Stats access
- Accessibility Service access
- Notification permission (foreground service)

These are requested at runtime when enabling tracking features.

---

## Project Structure

```
android/
    Native Kotlin modules and services

src/
    screens/
    components/
    navigation/
    utils/
    App.tsx
```

Native tracking logic lives in:

```
android/app/src/main/java/com/attentionos/
```

---

## Engineering Notes

- Native changes require a clean rebuild.
- Behavioral sessions are stored locally before cloud sync.
- Classification is rule-based (threshold-driven).
- Tracking runs via a persistent foreground service.
- All widgets read from local Room database.

---

## Roadmap

- Expanded analytics model
- Weekly trend reports
- Attention scoring system
- Multi-size home screen widgets
- iOS implementation

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss scope and implementation approach.

---

## License

License to be added.
