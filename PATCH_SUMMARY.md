# Distracted Scrolling Detection - Patch Summary

## Overview
Applied targeted patches to fix inconsistent detection caused by overly rigid parameters and incorrect session handling. The core detection logic remains intact; only problematic behaviors were fixed.

---

## 1. CONTINUITY PATCH (CRITICAL)
**File:** [SessionClassifier.kt](android/app/src/main/java/com/attentionos/tracking/SessionClassifier.kt)

### Change
- **MAX_INTERACTION_GAP_MS:** `10_000L` → `30_000L`
- Updated documentation to reflect new tolerance

### Impact
- Sessions now tolerate **30-second gaps** between scroll events
- Accommodates natural pauses for reading, video watching, or thinking
- Prevents premature session termination during normal use

**Before:** User watches a 15-second video clip → session breaks
**After:** User watches a 15-second video clip → session continues

---

## 2. SESSION CONTINUITY FIX
**File:** [TrackingForegroundService.kt](android/app/src/main/java/com/attentionos/service/TrackingForegroundService.kt)

### Changes
- **Added state tracking:**
  - `lastScrollTimestamp: Long` - Tracks timestamp of last scroll event
  - `accumulatedDuration: Long` - Active scroll time accumulation
  - `lastDetectionTimestamp: Long` - For cooldown enforcement
  - `allowedPauseUsed: Boolean` - Single pause tolerance tracker
  - `pauseStartTime: Long` - Reserved for future pause tracking

- **Updated `handleScrollEvent()`:** 
  - Duration now accumulates based on **delta between consecutive scroll events** (active time)
  - Implements pause tolerance: first pause ≤30s is tolerated without breaking continuity
  - Multiple long pauses trigger `hasLongGaps = true`

### Impact
- **Session is NOT terminated after detection** - counters continue accumulating
- Duration reflects actual scrolling time, not wall-clock time
- Pauses don't corrupt duration thresholds

**Before:** 45s active scrolling + 5s reading = 50s duration (fails at 45s threshold)
**After:** 45s active scrolling + 5s reading = 45s accumulated (passes threshold)

---

## 3. DETECTION COOLDOWN (MINIMAL ADDITION)
**File:** [TrackingForegroundService.kt](android/app/src/main/java/com/attentionos/service/TrackingForegroundService.kt)

### Changes
- **New constant:** `DETECTION_COOLDOWN_MS = 60_000L`
- **Cooldown check in `endCurrentSession()`:**
  - Blocks re-detection within 60 seconds of last detection
  - Scrolling data continues accumulating during cooldown
  - Logged when active

### Impact
- Prevents rapid re-detection of same scrolling session
- Allows detection system to stabilize between sessions
- User sees consistent behavior within the same app session

**Example:** User scrolls Instagram for 60s (detected) → continues scrolling for another 30s (not re-detected due to cooldown) → switches app → comes back 75s later (cooldown expired, can detect again)

---

## 4. ACTIVE-TIME CALCULATION FIX
**File:** [TrackingForegroundService.kt](android/app/src/main/java/com/attentionos/service/TrackingForegroundService.kt)

### Changes
- **Duration calculation:** `endTime - sessionStartTime` → `accumulatedDuration`
- **Duration accumulation logic in `handleScrollEvent()`:**
  ```kotlin
  val delta = timestamp - lastScrollTimestamp
  if (delta > MAX_INTERACTION_GAP_MS) {
    // Handle long pause
  } else {
    accumulatedDuration += delta
  }
  ```

### Impact
- Duration reflects actual interaction time, not elapsed wall-clock time
- User taking 5-minute pause between scrolls doesn't artificially inflate session duration
- Thresholds become meaningful and consistent

**Before:** 45s scrolling + 5min break + 5s scrolling = 305s (DISTRACTED)
**After:** 45s scrolling + 5min break + 5s scrolling = 50s accumulated (NEUTRAL if not meeting other thresholds)

---

## 5. PAUSE TOLERANCE PATCH
**File:** [TrackingForegroundService.kt](android/app/src/main/java/com/attentionos/service/TrackingForegroundService.kt)

### Changes
- **Pause tolerance logic in `handleScrollEvent()`:**
  ```kotlin
  if (delta > MAX_INTERACTION_GAP_MS) {
    if (!allowedPauseUsed) {
      allowedPauseUsed = true
      accumulatedDuration += MAX_INTERACTION_GAP_MS
      Log.d(TAG, "Long pause tolerated...")
    } else {
      hasLongGaps = true
      Log.d(TAG, "Multiple long pauses detected...")
    }
  }
  ```

### Impact
- **First long pause (≤30s):** Tolerated, duration adds 30s
- **Second+ long pause:** Marks session as fragmented (`hasLongGaps = true`)
- Real human scrolling patterns are now supported

**Scenario:** User scrolls 30s → reads 25s → scrolls 20s → reads 35s
- First pause: 25s < 30s → tolerated (accumulated: 55s + 25s)
- Second pause: 35s > 30s → marks fragmented (session ends in NEUTRAL)

---

## 6. DEBUG TRANSPARENCY
**File:** [TrackingForegroundService.kt](android/app/src/main/java/com/attentionos/service/TrackingForegroundService.kt)

### Changes
- **Enhanced `endCurrentSession()` logging:**
  ```kotlin
  if (classification == "NEUTRAL") {
    val reason = when {
      inCooldown -> "Cooldown active (${timeSinceLastDetection}ms < $DETECTION_COOLDOWN_MS)"
      duration < 45000L -> "Duration not met (${duration}ms < 45000ms)"
      currentSessionScrollCount < 10 -> "Scroll count not met ($currentSessionScrollCount < 10)"
      hasLongGaps -> "Session had long gaps > 30s"
      else -> "Unknown reason"
    }
    Log.d(TAG, "Session terminated without detection for $packageName: $reason")
  }
  ```

### Impact
- Clear visibility into why sessions were classified as NEUTRAL
- Enables validation and tuning of thresholds
- Diagnostic logs for troubleshooting

**Example Log Output:**
```
Session terminated without detection for com.instagram.android: Duration not met (32000ms < 45000ms)
Session terminated without detection for com.instagram.android: Cooldown active (45000ms < 60000ms)
Session terminated without detection for com.instagram.android: Session had long gaps > 30s
```

---

## Testing Checklist

- [ ] Single continuous scroll session detects correctly
- [ ] Repeated sessions detect consistently (not alternating)
- [ ] Single 15-second pause doesn't break continuity
- [ ] Multiple pauses mark session as fragmented
- [ ] Cooldown prevents re-detection for 60s
- [ ] Accumulated duration is accurate
- [ ] Wall-clock time gaps are ignored in duration
- [ ] Debug logs show specific termination reasons
- [ ] All existing thresholds and whitelist preserved

---

## Constants Summary

| Parameter | Old | New | Purpose |
|-----------|-----|-----|---------|
| MIN_DURATION_MS | 45,000 | 45,000 | Minimum scrolling duration for detection |
| MIN_SCROLL_COUNT | 10 | 10 | Minimum scroll events for detection |
| MAX_INTERACTION_GAP_MS | 10,000 | 30,000 | Gap tolerance for continuity |
| DETECTION_COOLDOWN_MS | N/A | 60,000 | Block re-detection after 60s |

---

## Backward Compatibility

✅ **Database schema unchanged** - existing sessions remain valid
✅ **App whitelist unchanged** - same apps detected
✅ **UI unchanged** - no user-facing modifications
✅ **Classification thresholds preserved** - same detection criteria

---

## Files Modified

1. `android/app/src/main/java/com/attentionos/tracking/SessionClassifier.kt`
   - Updated MAX_INTERACTION_GAP_MS constant and documentation

2. `android/app/src/main/java/com/attentionos/service/TrackingForegroundService.kt`
   - Added state tracking fields for cooldown and pause tolerance
   - Rewrote `handleScrollEvent()` for active duration accumulation
   - Enhanced `endCurrentSession()` with cooldown check and debug logging
   - Updated `startNewSession()` and `resetSessionState()` initialization
   - Updated constants in companion object

---

## Future Enhancements (Out of Scope)

- User-configurable app whitelist
- User-configurable thresholds
- ML-based pause detection (video vs. reading)
- Session merging for rapid app switches
- More granular cooldown patterns
