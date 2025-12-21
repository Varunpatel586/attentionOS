# CRITICAL FOREGROUND TIMER FIXES

## Problem Statement
Sessions were ending after 1-2 scrolls with log message:
```
Foreground unknown for 176629203xxxxms
```

Root cause: `lastNonNullForegroundTime` was uninitialized (= 0), so when `foregroundApp == null`, the grace window check (`now - 0 > 3000`) instantly failed.

---

## FIX 1: Initialize Foreground Timer on Scroll Bootstrap ⭐ CRITICAL

**File:** `TrackingForegroundService.kt` → `handleScrollEvent()` (lines 312-328)

**Problem:** 
- Session bootstrapped from scroll, but `lastNonNullForegroundTime` remained 0
- Next `checkForegroundApp()` call would see null and calculate `now - 0` = huge duration
- Session killed instantly

**Solution:**
```kotlin
if (currentSessionPackage == null) {
    if (SessionClassifier.isDistractionApp(packageName)) {
        Log.w(TAG, "⚠️ [BOOTSTRAP] No active session — starting from scroll: $packageName")
        startNewSession(packageName)
        
        // 🔥 FIX 1a: Initialize foreground timer when bootstrapping from scroll
        // CRITICAL: Scroll is proof of foreground presence
        // Without this, a null foregroundApp 1ms later will kill the session
        lastNonNullForegroundApp = packageName
        lastNonNullForegroundTime = timestamp
        Log.w(TAG, "⚠️ Foreground timer initialized from scroll: lastNonNullForegroundTime=$timestamp")
    }
}
```

**Why it works:** Scroll events are proof the user is in the app. Initializing the timer at scroll time prevents false "prolonged unknown foreground" errors.

---

## FIX 2: Proper NULL Grace Window with Validation

**File:** `TrackingForegroundService.kt` → `checkForegroundApp()` (lines 188-247)

**Problem:**
- Grace window check didn't validate `lastNonNullForegroundTime` initialization
- Could get past invalid (0) timestamps if uninitialized

**Solution:**
```kotlin
if (currentSessionPackage != null) {
    // 🔥 FIX 2a: Check if lastNonNullForegroundTime is valid (not 0)
    // If it's 0, this is a bug—don't kill session on invalid timer
    if (lastNonNullForegroundTime == 0L) {
        Log.w(TAG, "⚠️ lastNonNullForegroundTime is 0 (uninitialized) - cannot trust null duration")
        return
    }

    val nullDuration = now - lastNonNullForegroundTime

    // 🔥 FIX 2b: Only end session if null PERSISTS longer than grace window
    // Short null periods during scrolling MUST be ignored
    if (nullDuration > NULL_GRACE_MS) {
        Log.w(TAG, "⚠️ Foreground unknown for ${nullDuration}ms (exceeds grace window) — ending session")
        endCurrentSession(...)
    }
}
```

**Why it works:** Validates timer before using it. Only ends session on **confirmed** prolonged unknown foreground, not on 0-initialization bugs.

---

## FIX 3: Ignore Own App (Notification Taps) ⭐ PREVENTS FALSE SWITCHES

**File:** `TrackingForegroundService.kt` → `checkForegroundApp()` (lines 189-195)

**Problem:**
- Notification taps cause own app to briefly appear in foreground
- Treated as app switch, ending session incorrectly

**Solution:**
```kotlin
if (foregroundApp != null) {
    // 🔥 FIX 3: Do NOT treat own app (notification tap) as a real app switch
    // Ignore our own package—it's just notification UI, not user's actual foreground app
    if (foregroundApp == applicationContext.packageName) {
        Log.v(TAG, "⏭️  Ignoring own app in foreground (notification UI)")
        return
    }
    
    lastNonNullForegroundApp = foregroundApp
    lastNonNullForegroundTime = now
    // ... rest of logic
}
```

**Why it works:** Prevents notification taps from being misidentified as app switches.

---

## FIX 4: Attention Accumulation During Grace Window ⭐ ENSURES NON-ZERO DURATION

**File:** `TrackingForegroundService.kt` → `checkForegroundApp()` (lines 232-247)

**Problem:**
- Attention time only accumulated when `foregroundApp == currentSessionPackage`
- If UsageStats returned null (within grace window), attention stayed 0
- Session ended with 0 duration immediately

**Solution:**
```kotlin
if (nullDuration <= NULL_GRACE_MS) {
    // 🔥 FIX 4: Continue accumulating attention time even during null foreground
    // We're within the grace window, so user is likely still in the app
    // (scroll events were proof; UsageStats just needs to catch up)
    if (isScreenOn && lastScrollTimestamp > 0) {
        val idleTime = now - lastScrollTimestamp
        if (idleTime <= 15_000) {
            attentionTime += POLLING_INTERVAL_MS
            Log.v(TAG, "📊 Attention accumulated during null foreground: ${attentionTime}ms (null grace: ${nullDuration}ms/${NULL_GRACE_MS}ms)")
        }
    }
}
```

**Why it works:** Scroll events are proof of presence. During the grace window, we continue accumulating time as if the app is foreground, ensuring non-zero duration.

---

## Expected Post-Fix Behavior

### ✅ Sessions survive multiple scrolls
- Bootstrap from scroll: session starts
- If UsageStats goes null for <3 seconds: session continues, attention accumulates
- If UsageStats recovers: app switch detection resumes normally

### ✅ attentionTime accumulates to non-zero
- Every second while scrolling (with <15s idle): `attentionTime += 1000ms`
- Even if UsageStats temporarily null, grace window keeps accumulation running
- Result: Multi-scroll sessions have `attentionTime > 0`

### ✅ Logs show WHY sessions end
Examples:
```
⚠️ [BOOTSTRAP] No active session — starting from scroll: com.instagram.android
⚠️ Foreground timer initialized from scroll: lastNonNullForegroundTime=1702662123456
📊 Attention accumulated during null foreground: 2000ms (null grace: 512ms/3000ms)
✅ SESSION_ENDED: com.instagram.android (DISTRACTED) Duration: 5s (...details...)
```

vs. (for real app switches):
```
✅ SESSION_ENDED: com.instagram.android Duration: 15s (...details...)
Reason: App switched from com.instagram.android to com.spotify.music
```

---

## Build Status
✅ **BUILD SUCCESSFUL in 22s**  
✅ **Installed on 1 device**

No compilation errors. All fixes in place.

---

## Testing Checklist

- [ ] Open Instagram and scroll for 5 minutes continuously
- [ ] Check logs for `[BOOTSTRAP]` message on first scroll
- [ ] Verify `attentionTime` increases beyond 0ms in logs
- [ ] Verify session NOT ending with "Foreground unknown for xxxxxx ms"
- [ ] Confirm session ends naturally (app switch or screen off)
- [ ] Check database: session has `durationMillis > 0`
- [ ] Verify classification is correct (DISTRACTED or NEUTRAL)
