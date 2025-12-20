import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Assuming this path is correct
import BottomNavbar from '../components/BottomNavbar';
import Icon from 'react-native-vector-icons/Ionicons';

const StatsScreen = () => {
  // Using dummy data fields to make the components dynamic
  const data = {
    plannedTasks: 4,
    completedTasks: 3,
    focusedTime: '2h 15m',
    scrollingTime: '1h 40m',
    productiveSlot: '10–12 AM',
    contextSwitches: 7,
    timeLost: '~50 mins lost',
    bigThreeProgress: ['90%', '75%', '50%'], // Example progress values
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Insights</Text>
        </View>

        {/* 1. Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryBar} />

          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              You planned {data.plannedTasks} tasks and completed{' '}
              {data.completedTasks}
            </Text>

            <Text style={styles.summaryText}>
              You spent {data.focusedTime} focused and {data.scrollingTime}{' '}
              scrolling.
            </Text>

            <Text style={styles.summaryText}>
              Your most productive slot was {data.productiveSlot}.
            </Text>
          </View>
        </View>

        {/* 2. Context Switches & Big Three Row */}
        <View style={styles.cardsRow}>
          {/* Context Switches Card */}
          <View style={{ width: 110 }}>
            <View style={styles.contextWrapper}>
              {/* Dark Card */}
              <View style={styles.contextCard}>
                <Text style={styles.contextNumber}>{data.contextSwitches}</Text>
                <Text style={styles.contextLabel}>Context</Text>
                <Text style={styles.contextLabel}>switches</Text>
                <Text style={styles.contextToday}>Today</Text>
              </View>

              {/* OUTSIDE pill */}
              <View style={styles.contextPill}>
                <Text style={styles.contextPillText}>{data.timeLost}</Text>
              </View>
            </View>
          </View>
          {/* Big Three Card */}
          <View style={styles.bigThreeCard}>
            <View style={styles.bigThreeHeader}>
              <Text style={styles.bigThreeTitle}>Big Three</Text>
              <TouchableOpacity>
                <Icon name="open-outline" size={18} color="#262626" />
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              {data.bigThreeProgress.map((progress, index) => (
                <View key={index} style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: progress }]} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 3. Tips Row */}
        <View style={styles.tipsRow}>
          {/* Tip Card */}
          <View style={styles.tipCard}>
            <View style={styles.tipAccentBarContainer}>
              <View style={styles.tipAccentBar} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipText}>
                If you reduced scrolling by 30 minutes, you could complete 1
                extra task daily.
              </Text>
            </View>
          </View>

          {/* More Tips Button (Dark Card) */}
          <TouchableOpacity style={styles.moreTipsButton}>
            <Icon
              name="chevron-forward"
              size={50}
              color="#FFF"
              style={styles.arrowIcon}
            />
            <Text style={styles.moreTipsText}>More Tips</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Reset Button */}
        <TouchableOpacity style={styles.resetButton}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navbar */}
      <BottomNavbar />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9', // Adjusted background to match image
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30, // Increased margin for spacing
  },
  headerTitle: {
    fontSize: 24, // Larger title to match image
    fontWeight: 'bold', // Bolder title
    color: '#262626',
    fontFamily: 'Poppins',
  },

  // --- 1. Summary Card ---
  summaryCard: {
    backgroundColor: '#E9E5DC',
    borderRadius: 20,
    paddingVertical: 20,
    paddingRight: 20,
    paddingLeft: 14,
    flexDirection: 'row',
    marginBottom: 16,
  },

  accentBarContainer: {
    width: 10,
    marginRight: 12,
    alignItems: 'center',
  },
  accentBar: {
    width: 7, // Thinner bar
    backgroundColor: '#262626',
    flex: 1,
    borderRadius: 3,
  },

  summaryBar: {
    width: 6,
    backgroundColor: '#262626',
    borderRadius: 6,
    marginRight: 14,
  },

  summaryContent: {
    flex: 1,
  },

  summaryText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#262626',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },

  summaryTextLast: {
    marginBottom: 0,
  },

  // --- 2. Context Switches & Big Three Row ---
  cardsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 15, // Increased gap slightly
  },

  contextWrapper: {
    alignItems: 'center',
  },

  contextCard: {
    backgroundColor: '#262626',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contextNumber: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: 35,
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
  },

  contextLabel: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 'normal',
  },

  contextToday: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
    marginTop: 6,
  },

  contextLost: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
    backgroundColor: '#E9E5DC',
  },

  contextPill: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },

  contextPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#262626',
    fontFamily: 'Poppins',
  },

  // Big Three Card
  bigThreeCard: {
    flex: 1,
    backgroundColor: '#E9E5DC',
    borderRadius: 18,
    padding: 16,
  },

  bigThreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  bigThreeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    fontFamily: 'Poppins',
  },

  openIcon: {
    padding: 5,
  },

  // Progress Bars
  progressContainer: {
    gap: 13,
    paddingHorizontal: 6,
  },

  progressTrack: {
    height: 25,
    backgroundColor: '#DAD6CC',
    borderRadius: 7,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#262626',
    borderRadius: 7,
  },

  // --- 3. Tips Row ---
  tipsRow: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 15,
  },
  tipCard: {
    flex: 1, // Let flex handle the width
    backgroundColor: '#E9E5DC',
    borderRadius: 17,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 140,
  },
  tipAccentBarContainer: {
    width: 10,
    marginRight: 12,
    alignItems: 'center',
  },

  tipAccentBar: {
    flex: 1,
    width: 6,
    backgroundColor: '#262626',
    borderRadius: 6,
    marginRight: 14,
  },
  tipContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#262626',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  moreTipsButton: {
    width: 130, // Fixed width for the button (adjusts to design)
    backgroundColor: '#262626',
    borderRadius: 17,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 60, // Larger size to match design
    fontWeight: '100', // Thin arrow look
    color: '#FFF',
    marginBottom: 0,
    // No rotation needed for simple chevron-forward
  },
  moreTipsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    marginTop: -10, // Pull text up closer to the arrow
  },

  // --- 4. Reset Button ---
  resetButton: {
    backgroundColor: '#262626',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: 'center',
  },
  resetText: {
    fontSize: 18,
    fontWeight: '600', // Slightly bolder text
    color: '#FFF',
    fontFamily: 'Poppins',
  },
});

export default StatsScreen;
