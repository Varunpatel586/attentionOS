# AttentionOS Android Widgets Implementation

This document describes the complete Android widget implementation for the AttentionOS React Native app.

## Overview

The implementation provides 4 native Android widgets that receive data from the React Native app through a bridge module:

1. **Focus vs Scroll Widget** - Horizontal pill showing focus and scroll time
2. **Focus vs Scroll Compact Widget** - Smaller variant with just time values
3. **Today's Tasks Widget** - Shows up to 3 tasks due today
4. **Focus Timer Widget** - Live timer with pause/resume/reset controls

## Architecture

```
React Native App
      ↓
WidgetBridgeModule (Native Bridge)
      ↓
WidgetUpdateService
      ↓
SharedPreferences + Widget Providers
      ↓
Android Home Screen Widgets
```

## Files Created

### Layout Files
- `android/app/src/main/res/layout/widget_focus_scroll.xml`
- `android/app/src/main/res/layout/widget_focus_scroll_small.xml`
- `android/app/src/main/res/layout/widget_tasks.xml`
- `android/app/src/main/res/layout/widget_timer.xml`

### Drawable Resources
- `android/app/src/main/res/drawable/widget_background.xml`
- `android/app/src/main/res/drawable/widget_selected_background.xml`
- `android/app/src/main/res/drawable/widget_button_background.xml`

### Widget Providers
- `android/app/src/main/java/com/attentionos/widgets/FocusScrollWidgetProvider.kt`
- `android/app/src/main/java/com/attentionos/widgets/FocusScrollSmallWidgetProvider.kt`
- `android/app/src/main/java/com/attentionos/widgets/TasksWidgetProvider.kt`
- `android/app/src/main/java/com/attentionos/widgets/TimerWidgetProvider.kt`

### Service & Bridge
- `android/app/src/main/java/com/attentionos/service/WidgetUpdateService.kt`
- `android/app/src/main/java/com/attentionos/bridge/WidgetBridgeModule.kt`
- `android/app/src/main/java/com/attentionos/receiver/TimerControlReceiver.kt`

### Configuration
- `android/app/src/main/res/xml/widget_focus_scroll_info.xml`
- `android/app/src/main/res/xml/widget_focus_scroll_small_info.xml`
- `android/app/src/main/res/xml/widget_tasks_info.xml`
- `android/app/src/main/res/xml/widget_timer_info.xml`

### React Native
- `src/utils/widgetUpdater.ts` - Utility functions for widget updates
- `src/components/WidgetExample.tsx` - Example component showing usage

## Usage

### React Native Side

```typescript
import { updateWidgets, updateFocusScroll, updateTasks, updateTimer } from './utils/widgetUpdater'

// Update all widgets
const data = {
  focus: 8880, // 2h 28m in seconds
  scroll: 6000, // 1h 40m in seconds
  tasks: [
    { id: '1', title: 'Task 1', done: false },
    { id: '2', title: 'Task 2', done: false }
  ],
  timer: 1004, // 16:44 in seconds
  running: true
}
await updateWidgets(data)

// Or update individual widgets
await updateFocusScroll(8880, 6000)
await updateTasks(tasks)
await updateTimer(1004, true)
```

### Timer Control from Widget

The timer widget sends broadcast events that can be handled in React Native:

```typescript
import { DeviceEventEmitter } from 'react-native'

useEffect(() => {
  const pauseSub = DeviceEventEmitter.addListener('timerPause', () => {
    // Handle timer pause
  })
  const resumeSub = DeviceEventEmitter.addListener('timerResume', () => {
    // Handle timer resume
  })
  const resetSub = DeviceEventEmitter.addListener('timerReset', () => {
    // Handle timer reset
  })

  return () => {
    pauseSub.remove()
    resumeSub.remove()
    resetSub.remove()
  }
}, [])
```

## Data Storage

Widget data is stored in SharedPreferences under the key `"widget_data"`:

```json
{
  "focusTime": 8880,
  "scrollTime": 6000,
  "tasks": "[{\"title\":\"Task1\",\"done\":false,\"id\":\"1\"}]",
  "timerSeconds": 1004,
  "timerRunning": true
}
```

## Widget Features

### 1. Focus vs Scroll Widget
- **Size**: 250x60dp minimum
- **Update Frequency**: Every 15 minutes
- **Data**: Focus time and scroll time for today
- **Interaction**: Tap to open app

### 2. Focus vs Scroll Compact Widget
- **Size**: 180x40dp minimum
- **Update Frequency**: Every 15 minutes
- **Data**: Same as full widget but compact layout

### 3. Today's Tasks Widget
- **Size**: 250x120dp minimum
- **Update Frequency**: Every 15 minutes
- **Data**: First 3 tasks due today
- **Interaction**: Tap to open app to todo screen

### 4. Focus Timer Widget
- **Size**: 180x120dp minimum
- **Update Frequency**: Every 1 minute
- **Data**: Live timer display with controls
- **Controls**: Pause, Resume, Reset buttons

## Design System

### Colors
- Background: `#E9E5DC`
- Text: `#000000`
- Dark mode: `#262626`
- Accent: `#353535`

### Typography
- Labels: 12sp, sans-serif-medium
- Values: 14-16sp, sans-serif-bold
- Timer: 32sp, sans-serif-light

### Layout
- Rounded corners: 16dp for containers, 12dp for sections
- Padding: 12-16dp
- Minimal aesthetic matching AttentionOS design

## Installation & Setup

1. **Build the Android project**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

2. **Install on device**:
   ```bash
   ./gradlew installDebug
   ```

3. **Add widgets**:
   - Long press on home screen
   - Select "Widgets"
   - Find AttentionOS widgets
   - Drag to home screen

## Testing

Use the `WidgetExample` component to test widget functionality:

```typescript
import WidgetExample from './src/components/WidgetExample'
// Add this component to your app navigation
```

## Troubleshooting

### Widget not updating
- Check if WidgetBridge module is available
- Verify SharedPreferences data
- Ensure WidgetUpdateService is running

### Timer controls not working
- Verify TimerControlReceiver is registered in AndroidManifest
- Check broadcast events are being sent
- Ensure React Native event listeners are set up

### Build errors
- Clean and rebuild: `./gradlew clean`
- Check for missing dependencies in build.gradle
- Verify all XML files are well-formed

## API Reference

### WidgetBridgeModule Methods

- `updateFocusScroll(focusSeconds, scrollSeconds)` - Update focus/scroll times
- `updateTasks(tasks)` - Update tasks array
- `updateTimer(seconds, running)` - Update timer state
- `refreshWidgets()` - Refresh all widgets
- `getWidgetData()` - Get current widget data

### WidgetUpdater Class Methods

- `updateAllWidgets(data)` - Update all widgets at once
- `updateFocusScroll(focus, scroll)` - Update focus/scroll widgets
- `updateTasks(tasks)` - Update tasks widget
- `updateTimer(seconds, running)` - Update timer widget
- `refreshAllWidgets()` - Refresh all widgets
- `getWidgetData()` - Get current data
- `formatTime(seconds)` - Format seconds to "Xh Ym"
- `formatTimer(seconds)` - Format seconds to "MM : SS"

## Future Enhancements

- Dark mode support for widgets
- Widget configuration screens
- Multiple widget instances support
- Real-time updates without 15-minute limit
- Widget preview in app chooser
