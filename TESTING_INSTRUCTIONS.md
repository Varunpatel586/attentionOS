# Testing Instructions for AttentionOS Session Timing Fixes

## Overview
This document provides step-by-step instructions to verify that session timing bugs have been fixed.

## Setup

1. **Build and Install**
   ```bash
   cd android
   ./gradlew installDebug
   ```

2. **Enable Accessibility Service**
   - Open AttentionOS app
   - Navigate to Settings → Accessibility
   - Enable "ScrollDetectionAccessibilityService"

3. **Grant Permissions**
   - Allow app to access usage stats
   - Allow notification permissions

4. **View Logs**
   ```bash
   adb logcat | grep "TrackingService"
   ```

---

## Test Case 1: Basic Scroll Detection + Session Bootstrap

### Steps
1. Open Instagram or any tracked distraction app
2. Scroll continuously for 30 seconds (multiple fast scrolls)
3. Exit the app
4. Check logs and database

### Expected Results

**Logs**:
```
⚠️ [BOOTSTRAP] No active session — starting from scroll: com.instagram.android
========================================
📱 SESSION_STARTED: com.instagram.android
   startTime: 1702XXXXms
   scrollCount: 0, scrollTime: 0ms, attentionTime: 0ms
========================================

📊 [SCROLL] com.instagram.android | #1 | scrollTime=XXXms | attentionTime=XXXms | total=XXXms
📊 [SCROLL] com.instagram.android | #2 | scrollTime=XXXms | attentionTime=XXXms | total=XXXms
📊 [SCROLL] com.instagram.android | #3 | scrollTime=XXXms | attentionTime=XXXms | total=XXXms
...

========================================
✅ SESSION_ENDED: com.instagram.android (DISTRACTED)
   Duration: 30s (30XXXms)
   scrollTime: XXXms | attentionTime: XXXms | scrollCount: 15+
   Reason: App switched
========================================

💾 Session saved to database: com.instagram.android, 30s, DISTRACTED
```

**Key Points**:
- ✅ Session bootstraps on first scroll (even before UsageStats stabilizes)
- ✅ Multiple scrolls are logged with incremental IDs (#1, #2, #3, ...)
- ✅ scrollTime increases with each scroll
- ✅ attentionTime increases each second (if scrolling continues)
- ✅ Session duration > 30 seconds (not zero!)
- ✅ Classification is DISTRACTED

---

## Test Case 2: Scroll Time Delta Calculation

### Steps
1. Scroll in Instagram
2. Observe the delta times between scrolls in logs
3. Verify they're calculated correctly

### Expected Results

**Logs**:
```
⏱️ First scroll detected (timestamp=1702662XXXXms)

⏱️ Scroll delta: 250ms (total scrollTime=250ms)
⏱️ Scroll delta: 180ms (total scrollTime=430ms)
⏱️ Scroll delta: 320ms (total scrollTime=750ms)
...
```

**Verification**:
- ✅ First scroll has no delta (just detection)
- ✅ Subsequent scrolls show delta in milliseconds
- ✅ Total scrollTime increases monotonically
- ✅ Deltas are reasonable (100-500ms typical for human scrolling)

---

## Test Case 3: Attention Time Accumulation (15-Second Decay)

### Steps
1. Scroll in Instagram for 5 seconds
2. Stop scrolling (don't touch the screen)
3. Wait 15 seconds without scrolling
4. Check logs

### Expected Results

**While Scrolling (first 5s)**:
```
📊 Attention accumulated: 1000ms (idleTime=123ms)
📊 Attention accumulated: 2000ms (idleTime=234ms)
📊 Attention accumulated: 3000ms (idleTime=345ms)
📊 Attention accumulated: 4000ms (idleTime=456ms)
📊 Attention accumulated: 5000ms (idleTime=567ms)
```

**After Stopping (5s → 20s)**:
```
⏸️ Attention paused: interaction decay (idleTime=15001ms > 15000ms)
⏸️ Attention paused: interaction decay (idleTime=16001ms > 15000ms)
⏸️ Attention paused: interaction decay (idleTime=17001ms > 15000ms)
...
```

**Key Points**:
- ✅ Attention accumulates for first 5s while scrolling
- ✅ Attention pauses after 15s of inactivity
- ✅ Idle time is tracked correctly

---

## Test Case 4: Detection Rule Triggering

### Steps
1. Scroll in Instagram continuously for 20-30 seconds
2. Check logs for detection rule firing
3. Note the rule that triggered

### Expected Results

**Logs** (one of the following):
```
🚨 DETECTION RULE 1 (Active Scrolling): scrollTime=25000 >= 20000 AND scrollCount=15 >= 5

🚨 DETECTION RULE 2 (Passive Consumption): attentionTime=22000 >= 20000 AND scrollCount=1 < 5

🚨 DETECTION RULE 3 (Hybrid): (scrollTime + attentionTime)=35000 >= 20000 AND scrollCount=3 >= 3
```

**UI Expected**:
```
Toast: "⚠️ Distracted on Instagram (25s, 15 scrolls)"
```

---

## Test Case 5: Non-Zero Duration Guarantee

### Steps
1. Perform Test Case 1 (30-second scroll)
2. Query the database

### Expected Results

**Database Query**:
```
SELECT durationMillis, scrollCount, classification FROM app_sessions 
WHERE appPackageName = 'com.instagram.android' 
ORDER BY startTime DESC 
LIMIT 1;
```

**Expected Row**:
| durationMillis | scrollCount | classification |
|---|---|---|
| 30000+ | 15+ | DISTRACTED |

**Key Points**:
- ✅ durationMillis is NOT 0
- ✅ durationMillis matches actual scroll duration (~30000ms)
- ✅ scrollCount > 0
- ✅ classification is DISTRACTED (not NEUTRAL)

---

## Test Case 6: Non-Distraction Apps Ignored

### Steps
1. Open Google Maps (non-distraction app)
2. Scroll the map
3. Check logs

### Expected Results

**Logs**:
```
⏭️ Scroll ignored: com.google.maps is not a distraction app
```

**Key Points**:
- ✅ Non-distraction apps don't create sessions
- ✅ Clear log message explaining why

---

## Test Case 7: App Switch Session Boundary

### Steps
1. Scroll in Instagram for 10 seconds
2. Switch to YouTube (another distraction app)
3. Scroll in YouTube for 10 seconds
4. Check logs

### Expected Results

**Logs**:
```
========================================
📱 SESSION_STARTED: com.instagram.android
...
[Multiple scrolls in Instagram]
...
========================================
✅ SESSION_ENDED: com.instagram.android (...)
   Duration: 10s+
   ...
========================================

⚠️ [BOOTSTRAP] No active session — starting from scroll: com.google.android.youtube
========================================
📱 SESSION_STARTED: com.google.android.youtube
...
[Multiple scrolls in YouTube]
...
========================================
✅ SESSION_ENDED: com.google.android.youtube (...)
   Duration: 10s+
   ...
```

**Key Points**:
- ✅ Two separate sessions created
- ✅ Each session has non-zero duration
- ✅ Session boundaries are clean

---

## Troubleshooting

### Issue: No [BOOTSTRAP] message
**Cause**: ScrollDetectionAccessibilityService not detecting scrolls  
**Solution**:
- Verify accessibility service is enabled
- Check that you're scrolling in a recognized distraction app
- Check AccessibilityService logs: `adb logcat | grep "ScrollDetection"`

### Issue: Session duration is still 0
**Cause**: Total time < 1000ms  
**Solution**:
- Scroll for longer than 1 second
- Ensure scrollTime or attentionTime is accumulating (check logs)

### Issue: scrollTime not incrementing
**Cause**: Scroll deltas not being calculated  
**Solution**:
- Check logs for "First scroll detected" message
- Verify timestamps in subsequent scroll events
- Check that lastScrollTimestamp is being updated

### Issue: attentionTime not incrementing
**Cause**: No recent scroll activity (beyond 15s decay window)  
**Solution**:
- Scroll more frequently (within 15 seconds)
- Check logs for "Attention paused" messages
- Verify idleTime is being calculated

---

## Summary Checklist

- [ ] Build succeeds without errors
- [ ] App installs on device
- [ ] Accessibility service detects scrolls
- [ ] [BOOTSTRAP] message appears on first scroll
- [ ] Multiple scrolls are logged with IDs (#1, #2, #3)
- [ ] scrollTime increases with each scroll
- [ ] attentionTime increases while scrolling
- [ ] Session ends with non-zero duration
- [ ] Session saved to database
- [ ] Database shows correct durationMillis, scrollCount, classification
- [ ] Detection rule triggers at appropriate time (20+ seconds)
- [ ] Toast notification appears with duration and scroll count

---

## Expected Log Pattern (Complete Session)

```
⚠️ [BOOTSTRAP] No active session — starting from scroll: com.instagram.android
========================================
📱 SESSION_STARTED: com.instagram.android
   startTime: 1702662XXXXms
   scrollCount: 0, scrollTime: 0ms, attentionTime: 0ms
========================================

⏱️ First scroll detected (timestamp=1702662XXXXms)
📊 [SCROLL] com.instagram.android | #1 | scrollTime=0ms | attentionTime=XXXms | total=XXXms

⏱️ Scroll delta: 250ms (total scrollTime=250ms)
📊 [SCROLL] com.instagram.android | #2 | scrollTime=250ms | attentionTime=2000ms | total=2250ms

⏱️ Scroll delta: 180ms (total scrollTime=430ms)
📊 [SCROLL] com.instagram.android | #3 | scrollTime=430ms | attentionTime=3000ms | total=3430ms

[... many more scrolls ...]

📊 Attention accumulated: 20000ms (idleTime=345ms)

🚨 DETECTION RULE 1 (Active Scrolling): scrollTime=25000 >= 20000 AND scrollCount=15 >= 5

🚨 DISTRACTED DETECTION: com.instagram.android - scrollTime:25000ms, attentionTime:20000ms, scrolls:15

========================================
✅ SESSION_ENDED: com.instagram.android (DISTRACTED)
   Duration: 45s (45000ms)
   scrollTime: 25000ms | attentionTime: 20000ms | scrollCount: 15
   Reason: App switched
========================================

💾 Session saved to database: com.instagram.android, 45s, DISTRACTED
```

---

**All tests passing?** ✅ Session timing fixes are working correctly!
