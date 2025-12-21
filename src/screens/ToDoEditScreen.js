import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

/**
 * CALENDAR ICON
 */
const CustomCalendarIcon = () => (
  <View style={styles.calWrapper}>
    <View style={styles.calRingsRow}>
      <View style={styles.calRing} />
      <View style={styles.calRing} />
    </View>
    <View style={styles.calMainBox}>
      <View style={styles.calHeaderLine} />
    </View>
  </View>
);

/**
 * EXACT PENCIL-IN-BOX ICON (FAB)
 * Matches provided image
 */
const CustomEditIcon = () => (
  <View style={styles.editIconWrapper}>
    <View style={styles.editSquare}>
      <View style={styles.pencilWrapper}>
        <View style={styles.pencilBody} />
        <View style={styles.pencilTip} />
      </View>
    </View>
  </View>
);

const ToDoEditScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <Text style={styles.screenTitle}>Edit task</Text>

      <View style={styles.mainPadding}>
        <View style={styles.taskCard}>
          <TextInput
            style={styles.pillInput}
            placeholder="Task title"
            placeholderTextColor="#8C8C8C"
          />

          <TextInput
            style={styles.pillInput}
            placeholder="Task group"
            placeholderTextColor="#8C8C8C"
          />

          {/* Date Selector */}
          <View style={styles.selectorRow}>
            <TouchableOpacity style={styles.blackPill}>
              <Text style={styles.pillText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.blackPill}>
              <Text style={styles.pillText}>Tomorrow</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.calendarCircle}>
              <CustomCalendarIcon />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.pillInput, styles.descriptionInput]}
            placeholder="Description"
            placeholderTextColor="#8C8C8C"
            multiline
          />

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btn, styles.btnCreate]}>
              <Text style={styles.txtWhite}>Create</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnDelete]}>
              <Text style={styles.txtDark}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F2E7',
  },

  deviceStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 10,
    marginBottom: 20,
  },

  statusBold: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  screenTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#242424',
    marginBottom: 25,
  },

  mainPadding: {
    paddingHorizontal: 20,
  },

  /* Card */
  taskCard: {
    backgroundColor: '#EAE8D9',
    borderRadius: 45,
    padding: 25,
    height: height * 0.65,
  },

  pillInput: {
    backgroundColor: '#F3F2E7',
    borderRadius: 25,
    paddingHorizontal: 22,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 12,
  },

  descriptionInput: {
    height: 140,
    textAlignVertical: 'top',
    borderRadius: 30,
  },

  /* Date Selector */
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  blackPill: {
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },

  pillText: {
    color: 'white',
    fontWeight: '500',
  },

  calendarCircle: {
    backgroundColor: '#2D2D2D',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Calendar Icon */
  calWrapper: {
    width: 24,
    height: 22,
    alignItems: 'center',
  },

  calRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 14,
    marginBottom: -4,
    zIndex: 1,
  },

  calRing: {
    width: 2.5,
    height: 6,
    backgroundColor: 'white',
    borderRadius: 1.5,
  },

  calMainBox: {
    width: 22,
    height: 18,
    borderWidth: 2.5,
    borderColor: 'white',
    borderRadius: 4,
  },

  calHeaderLine: {
    height: 2.5,
    backgroundColor: 'white',
    width: '100%',
    marginTop: 4,
  },

  /* Buttons */
  actionRow: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: 10,
  },

  btn: {
    width: 135,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  btnCreate: {
    backgroundColor: '#2D2D2D',
  },

  btnDelete: {
    backgroundColor: '#F3F2E7',
  },

  txtWhite: {
    color: 'white',
    fontWeight: 'bold',
  },

  txtDark: {
    color: '#2D2D2D',
    fontWeight: 'bold',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editIconWrapper: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },

  editSquare: {
    width: 24,
    height: 24,
    borderWidth: 2.5,
    borderColor: '#2D2D2D',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pencilWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },

  pencilBody: {
    width: 14,
    height: 4,
    backgroundColor: '#2D2D2D',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },

  pencilTip: {
    width: 0,
    height: 0,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 4,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#2D2D2D',
  },
});

export default ToDoEditScreen;
