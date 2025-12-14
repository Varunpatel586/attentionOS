This is a **React Native** project built using the **React Native CLI**, designed for Android development and integrated with **Firebase** services and custom UI components.

# Getting Started

> **Note**: Before continuing, make sure you have completed the official  
> [React Native Environment Setup](https://reactnative.dev/docs/getting-started-without-a-framework?package-manager=npm).

---

## Step 1: Install Dependencies

From the root of the project, install all required JavaScript dependencies:

```sh
# Using npm
npm install
````

---

## Step 2: Start Metro

Metro is the JavaScript bundler for React Native. Start it by running:

```sh
# Using npm
npm start
```

Keep this terminal running.

---

## Step 3: Build and Run the App

Open a **new terminal** in the project root while Metro is running.

### Android

```sh
# Using npm
npm run android

# OR
npx react-native run-android
```

This will build the app and launch it on an Android emulator or connected device.

> **Important**: If you installed native libraries (e.g. vector icons or Firebase), run a clean build:
>
> ```sh
> cd android
> .\gradlew clean
> cd ..
> ```

---

### iOS (macOS only)

Install CocoaPods dependencies (required on first setup or after native changes):

```sh
bundle install
bundle exec pod install
```

Run the app:

```sh
# Using npm
npm run ios
```

---

## Step 4: Modify the App

Open `App.js` (or files inside `src/`) in your editor and make changes.

When you save, the app will automatically update using
[Fast Refresh](https://reactnative.dev/docs/fast-refresh).

To force a full reload:

* **Android**: Press <kbd>R</kbd> twice or open the Dev Menu with <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux)
* **iOS**: Press <kbd>R</kbd> in the iOS Simulator

---

## Project Structure (Overview)

```
src/
 ├─ screens/
 ├─ components/
 ├─ navigation/
 └─ ...
```

---

## Common Commands

```sh
npm start              # Start Metro
npm run android        # Run Android app
npm run ios            # Run iOS app (macOS)
npm install            # Install dependencies
```

---

## Troubleshooting

If you encounter issues:

* Ensure Android Studio and SDK are correctly installed
* Run a clean build for Android:

  ```sh
  cd android
  .\gradlew clean
  cd ..
  ```
* Restart Metro with cache reset:

  ```sh
  npx react-native start --reset-cache
  ```

For more help, visit the official
[Troubleshooting Guide](https://reactnative.dev/docs/troubleshooting).

---

## Learn More

* [React Native Website](https://reactnative.dev)
* [Getting Started Guide](https://reactnative.dev/docs/getting-started)
* [Environment Setup](https://reactnative.dev/docs/environment-setup)
* [React Native Blog](https://reactnative.dev/blog)
* [React Native GitHub](https://github.com/facebook/react-native)

---

## Congratulations 🎉

You’ve successfully set up and run the project.
You can now continue building features, integrating Firebase services, and improving the UI.


