import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SplashScreen = ({ onFinish }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200, // loading duration
      useNativeDriver: false,
    }).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />

        <Text style={styles.appName}>AttentionOS</Text>
        {/* Quote */}
        <Text style={styles.quote}>
          “The secret of change is to focus all your energy not on fighting the
          old, but on building the new.”
        </Text>
        <Text style={styles.quote}>— Socrates</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: widthInterpolated }]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  logo: {
    width: 211,
    height: 211,
    resizeMode: 'contain',
  },

  appName: {
    color: 'black',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '800',
    wordWrap: 'break-word',
    marginTop: -60,
    marginBottom: 32,
  },

  appName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 32,
    color: '#000',
  },

  quote: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '500',
    color: '#000',
    lineHeight: 22,
    marginBottom: 6,
    fontFamily: 'Poppins',
    fontStyle: 'medium',
  },

  author: {
    fontSize: 14,
    color: '#555',
    marginBottom: 36,
  },

  progressTrack: {
    width: '60%',
    height: 6,
    backgroundColor: '#D6D3CC',
    borderRadius: 6,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 6,
  },
});
