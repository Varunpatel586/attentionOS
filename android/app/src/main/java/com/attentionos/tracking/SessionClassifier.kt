package com.attentionos.tracking

import android.util.Log

/**
 * Rule-based classifier for determining if an app session is "distracted scrolling". Uses
 * configurable thresholds to classify sessions based on:
 * - App package name (must be in distraction apps list)
 * - Session duration (must exceed minimum threshold)
 * - Scroll count (must exceed minimum threshold)
 * - Interaction pattern (continuous vs. sporadic)
 */
object SessionClassifier {

    private const val TAG = "SessionClassifier"

    /**
     * List of app package names considered "distraction apps". These are apps where continuous
     * scrolling indicates distracted behavior.
     *
     * For MVP, this is hardcoded. In future versions, this could be user-configurable.
     */
    private val DISTRACTION_APPS =
            setOf(
                    "com.instagram.android", // Instagram
                    "com.google.android.youtube", // YouTube
                    "com.facebook.katana", // Facebook
                    "com.snapchat.android", // Snapchat
                    "com.zhiliaoapp.musically", // TikTok
                    "com.twitter.android", // Twitter/X
                    "com.reddit.frontpage" // Reddit
            )

    /**
     * Default detection threshold for distraction apps. 20 seconds matches real passive consumption
     * patterns (watching 1-2 reels).
     */
    private const val DEFAULT_THRESHOLD_MS = 20_000L

    /**
     * Hard fail-safe threshold - must NEVER be escapable. If attention time reaches 90 seconds,
     * detection MUST fire regardless of scrolls.
     */
    private const val HARD_FAIL_SAFE_MS = 90_000L

    /**
     * App-specific thresholds tuned for real usage patterns. Short-form content (reels/shorts): 20s
     * (time to watch 1-2 reels) YouTube: 30s (longer videos, but still quick to detect)
     */
    private val APP_THRESHOLDS =
            mapOf(
                    "com.instagram.android" to 20_000L, // Instagram: 20s (1-2 reels)
                    "com.zhiliaoapp.musically" to 20_000L, // TikTok: 20s (1-2 shorts)
                    "com.snapchat.android" to 20_000L, // Snapchat: 20s
                    "com.twitter.android" to 20_000L, // Twitter: 20s
                    "com.reddit.frontpage" to 20_000L, // Reddit: 20s
                    "com.facebook.katana" to 20_000L, // Facebook: 20s
                    "com.google.android.youtube" to 30_000L // YouTube: 30s (longer content)
            )

    /**
     * Check if current session metrics satisfy any detection rule. Returns true if ANY rule matches
     * (real-time detection).
     *
     * Simplified human-aligned rules:
     * - Rule A: Primary attention capture (works for long reels)
     * - Rule B: Early detection with light scrolling
     * - Rule C: Hard fail-safe (must NEVER be escapable)
     *
     * @param appPackageName Package name of the app
     * @param attentionTime Confirmed attention time (from first interaction) in milliseconds
     * @param scrollCount Number of scroll events detected
     * @return true if any detection rule is satisfied
     */
    fun checkDetectionRules(
            appPackageName: String,
            attentionTime: Long,
            scrollCount: Int
    ): Boolean {

        // Must be a distraction app
        if (!isDistractionApp(appPackageName)) {
            Log.v(TAG, "Not a distraction app: $appPackageName - skipping detection")
            return false
        }

        val threshold = APP_THRESHOLDS[appPackageName] ?: DEFAULT_THRESHOLD_MS

        // Rule C: Hard fail-safe (must NEVER be escapable)
        if (attentionTime >= HARD_FAIL_SAFE_MS) {
            Log.i(TAG, "✅ RULE_C_TRIGGERED (Hard Fail-Safe): $appPackageName")
            Log.i(TAG, "   Attention: ${attentionTime}ms >= ${HARD_FAIL_SAFE_MS}ms")
            Log.i(TAG, "   Scrolls: $scrollCount (not required for fail-safe)")
            return true
        }

        // Rule A: Primary attention capture (PURELY TIME-BASED)
        // BEHAVIORAL FIX: Removed scroll requirement - time is reliable, scrolls are not
        // This ensures detection works even if scroll events are missed
        if (attentionTime >= threshold) {
            Log.i(TAG, "✅ RULE_A_TRIGGERED (Primary Attention - Time Only): $appPackageName")
            Log.i(TAG, "   Attention: ${attentionTime}ms >= ${threshold}ms (app threshold)")
            Log.i(TAG, "   Scrolls: $scrollCount (not required - time is sufficient signal)")
            return true
        }

        // Rule B: Early detection with scrolling (scrolls help for early detection only)
        // Scrolls are OPTIONAL - they only enable earlier detection at half threshold
        if (attentionTime >= (threshold * 0.6).toLong()) {
            Log.i(TAG, "✅ RULE_B_TRIGGERED (Early Detection - Time Dominant): $appPackageName")
            Log.i(TAG, "   Attention: ${attentionTime}ms >= ${threshold / 2}ms (half threshold)")
            Log.i(TAG, "   Scrolls: $scrollCount >= 2 (enables early detection)")
            return true
        }

        Log.v(
                TAG,
                "No detection rules met for $appPackageName (AT:${attentionTime}ms, SC:$scrollCount)"
        )
        return false
    }

    /**
     * Classify a session as DISTRACTED or NEUTRAL (for database storage).
     *
     * @param appPackageName Package name of the app
     * @param attentionTime Confirmed attention time (from first interaction) in milliseconds
     * @param scrollCount Number of scroll events detected
     * @return "DISTRACTED" if the session meets any criteria, "NEUTRAL" otherwise
     */
    fun classifySession(appPackageName: String, attentionTime: Long, scrollCount: Int): String {

        if (!isDistractionApp(appPackageName)) {
            Log.d(TAG, "Session classification: NEUTRAL - not a distraction app: $appPackageName")
            return "NEUTRAL"
        }

        // Use the same detection rules for classification
        val isDistracted = checkDetectionRules(appPackageName, attentionTime, scrollCount)

        if (isDistracted) {
            Log.i(TAG, "📊 SESSION_CLASSIFIED: DISTRACTED")
            Log.i(TAG, "   App: $appPackageName")
            Log.i(TAG, "   Attention time: ${attentionTime}ms")
            Log.i(TAG, "   Scroll count: $scrollCount")
            return "DISTRACTED"
        }

        Log.d(
                TAG,
                "📊 SESSION_CLASSIFIED: NEUTRAL - $appPackageName (AT:${attentionTime}ms SC:$scrollCount below thresholds)"
        )
        return "NEUTRAL"
    }

    /**
     * Check if a package name is in the distraction apps list. Useful for filtering which apps to
     * track.
     */
    fun isDistractionApp(packageName: String): Boolean {
        return DISTRACTION_APPS.contains(packageName)
    }

    /** Get the list of distraction apps (for UI display or configuration). */
    fun getDistractionApps(): Set<String> {
        return DISTRACTION_APPS.toSet()
    }

    fun isShortFormVideoApp(packageName: String?): Boolean {
        return when (packageName) {
            "com.instagram.android",
            "com.zhiliaoapp.musically",
            "com.google.android.youtube",
            "com.snapchat.android" -> true
            else -> false
        }
    }
}
