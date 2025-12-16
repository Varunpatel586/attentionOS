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
          <View style={styles.accentBarContainer}>
            <View style={styles.accentBar} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              You planned **{data.plannedTasks} tasks** and completed **{data.completedTasks}**
            </Text>
            <Text style={styles.summaryText}>
              You spent **{data.focusedTime} focused** and **{data.scrollingTime} scrolling**.
            </Text>
            <Text style={styles.summaryText}>
              Your most productive slot was **{data.productiveSlot}**.
            </Text>
          </View>
        </View>

        {/* 2. Context Switches & Big Three Row */}
        <View style={styles.cardsRow}>
          {/* Context Switches Card (Dark Card) */}
          <View style={styles.contextCard}>
            <Text style={styles.contextNumber}>{data.contextSwitches}</Text>
            <Text style={styles.contextLabel}>Context switches</Text>
            <Text style={styles.contextToday}>Today</Text>
            <Text style={styles.contextLost}>{data.timeLost}</Text>
          </View>

          {/* Big Three Card (Light Card with Bars) */}
          <View style={styles.bigThreeCard}>
            <View style={styles.bigThreeHeader}>
              <Text style={styles.bigThreeTitle}>Big Three</Text>
              <TouchableOpacity style={styles.openIcon}>
                <Icon name="open-outline" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Progress Bars */}
            <View style={styles.progressContainer}>
              {data.bigThreeProgress.map((progress, index) => (
                <View key={index} style={styles.progressBarWrapper}>
                  <View style={styles.progressBarBg} />
                  <View style={[styles.progressBarFill, { width: progress }]} />
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
                If you reduced scrolling by 30 minutes, you could complete 1 extra task daily.
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
  // --- General Styles ---
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9', // Adjusted background to match image
  },
  scrollContent: {
    paddingTop: 60,
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
    borderRadius: 17,
    padding: 18,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'stretch', // Ensure children stretch height
    minHeight: 140, // Minimum height for better spacing
  },
  accentBarContainer: {
    width: 10,
    marginRight: 12,
    alignItems: 'center',
  },
  accentBar: {
    width: 4, // Thinner bar
    backgroundColor: '#262626',
    flex: 1,
    borderRadius: 2,
  },
  summaryContent: {
    flex: 1,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#262626',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },

  // --- 2. Context Switches & Big Three Row ---
  cardsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 15, // Increased gap slightly
  },
  contextCard: {
    backgroundColor: '#262626',
    borderRadius: 17,
    padding: 18,
    width: 130, // Adjusted width for better fit
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180, // Set height to match Big Three card
  },
  contextNumber: {
    fontSize: 48, // Larger number
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  contextLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#BFBFBF', // Light grey for subtext
    textAlign: 'center',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  contextToday: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BFBFBF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  contextLost: {
    fontSize: 13,
    fontWeight: '500',
    color: '#262626',
    textAlign: 'center',
    fontFamily: 'Poppins',
    backgroundColor: '#E9E5DC', // Light card background color
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },

  // Big Three Card
  bigThreeCard: {
    flex: 1,
    backgroundColor: '#E9E5DC',
    borderRadius: 17,
    padding: 18,
    minHeight: 180,
    justifyContent: 'center',
  },
  bigThreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  bigThreeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    fontFamily: 'Poppins',
  },
  openIcon: {
      padding: 5,
  },
  
  // Progress Bars
  progressContainer: {
    gap: 12, // Reduced gap between bars
  },
  progressBarWrapper: {
    height: 18, // Reduced height for thinner bars
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarBg: {
    position: 'absolute',
    width: '100%',
    height: 14, // Thinner background bar
    backgroundColor: '#D1CEC5', // Light grey background for the bar
    borderRadius: 7,
  },
  progressBarFill: {
    position: 'absolute',
    height: 14,
    backgroundColor: '#262626', // Dark grey fill color
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
    width: 4,
    backgroundColor: '#262626',
    flex: 1,
    borderRadius: 2,
  },
  tipContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#262626',
    fontFamily: 'Poppins',
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