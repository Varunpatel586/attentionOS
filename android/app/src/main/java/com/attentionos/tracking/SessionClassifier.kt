package com.attentionos.tracking

import android.util.Log

/**
 * Rule-based classifier for determining if an app session is "distracted scrolling".
 * Uses configurable thresholds to classify sessions based on:
 * - App package name (must be in distraction apps list)
 * - Session duration (must exceed minimum threshold)
 * - Scroll count (must exceed minimum threshold)
 * - Interaction pattern (continuous vs. sporadic)
 */
object SessionClassifier {

    private const val TAG = "SessionClassifier"

    /**
     * List of app package names considered "distraction apps".
     * These are apps where continuous scrolling indicates distracted behavior.
     * 
     * For MVP, this is hardcoded. In future versions, this could be user-configurable.
     */
    private val DISTRACTION_APPS = setOf(
        "com.instagram.android",           // Instagram
        "com.google.android.youtube",      // YouTube
        "com.facebook.katana",             // Facebook
        "com.snapchat.android",            // Snapchat
        "com.zhiliaoapp.musically",        // TikTok/musically
        "com.twitter.android",             // Twitter/X
        "com.reddit.frontpage"             // Reddit
    )

    /**
     * Default detection threshold for distraction apps.
     * 20 seconds matches real passive consumption patterns (watching 1-2 reels).
     */
    private const val DEFAULT_THRESHOLD_MS = 10_000L //10s

    /**
     * Minimum number of scroll events for active scrolling detection.
     * Lowered to 5 because reel-watching involves less frequent swiping.
     */
    private const val MIN_SCROLL_COUNT = 5

    /**
     * Minimum scroll count for hybrid behavior detection.
     * Just 3 scrolls over 20s indicates engagement.
     */
    private const val HYBRID_MIN_SCROLL_COUNT = 3

    /**
     * App-specific thresholds tuned for real usage patterns.
     * Short-form content (reels/shorts): 20s (time to watch 1-2 reels)
     * YouTube: 30s (longer videos, but still quick to detect)
     */
    private val APP_THRESHOLDS = mapOf(
        "com.instagram.android" to 10_000L,        // Instagram: 10s (1-2 reels)
        "com.zhiliaoapp.musically" to 20_000L,     // TikTok: 20s (1-2 shorts)
        "com.snapchat.android" to 20_000L,         // Snapchat: 20s
        "com.twitter.android" to 10_000L,          // Twitter: 50s
        "com.reddit.frontpage" to 15_000L,         // Reddit: 50s
        "com.facebook.katana" to 20_000L,          // Facebook: 20s
        "com.google.android.youtube" to 8_000L    // YouTube: 8s (longer content)
    )

    /**
     * Check if current session metrics satisfy any detection rule.
     * Returns true if ANY rule matches (real-time detection).
     * 
     * @param appPackageName Package name of the app
     * @param scrollTime Active scroll time in milliseconds
     * @param attentionTime Foreground time with screen ON in milliseconds
     * @param scrollCount Number of scroll events detected
     * @return true if any detection rule is satisfied
     */
    fun checkDetectionRules(
        appPackageName: String,
        scrollTime: Long,
        attentionTime: Long,
        scrollCount: Int
    ): Boolean {
        
        // Must be a distraction app
        if (!isDistractionApp(appPackageName)) {
            return false
        }
        
        val threshold = APP_THRESHOLDS[appPackageName] ?: DEFAULT_THRESHOLD_MS
        
        // Rule 1: Active Scrolling
        if (scrollTime >= threshold && scrollCount >= MIN_SCROLL_COUNT) {
            Log.i(TAG, "🚨 DETECTION RULE 1 (Active Scrolling): scrollTime=$scrollTime >= $threshold AND scrollCount=$scrollCount >= $MIN_SCROLL_COUNT")
            return true
        }
        
        // Rule 2: Passive Consumption (reels/shorts)
        if (attentionTime >= threshold && scrollCount < MIN_SCROLL_COUNT) {
            Log.i(TAG, "🚨 DETECTION RULE 2 (Passive Consumption): attentionTime=$attentionTime >= $threshold AND scrollCount=$scrollCount < $MIN_SCROLL_COUNT")
            return true
        }
        
        // Rule 3: Hybrid Behavior (scroll + watch)
        if ((scrollTime + attentionTime) >= threshold && scrollCount >= HYBRID_MIN_SCROLL_COUNT) {
            Log.i(TAG, "🚨 DETECTION RULE 3 (Hybrid): (scrollTime + attentionTime)=${scrollTime + attentionTime} >= $threshold AND scrollCount=$scrollCount >= $HYBRID_MIN_SCROLL_COUNT")
            return true
        }
        
        Log.v(TAG, "No detection rules met: scrollTime=$scrollTime, attentionTime=$attentionTime, scrollCount=$scrollCount, threshold=$threshold")
        return false
    }

    /**
     * Classify a session as DISTRACTED or NEUTRAL (for database storage).
     * 
     * @param appPackageName Package name of the app
     * @param scrollTime Active scroll time in milliseconds
     * @param attentionTime Foreground time with screen ON in milliseconds
     * @param scrollCount Number of scroll events detected
     * @return "DISTRACTED" if the session meets any criteria, "NEUTRAL" otherwise
     */
    fun classifySession(
        appPackageName: String,
        scrollTime: Long,
        attentionTime: Long,
        scrollCount: Int
    ): String {
        
        if (!isDistractionApp(appPackageName)) {
            Log.d(TAG, "Not a distraction app: $appPackageName")
            return "NEUTRAL"
        }
        
        val threshold = APP_THRESHOLDS[appPackageName] ?: DEFAULT_THRESHOLD_MS
        
        // Check all rules
        val rule1 = scrollTime >= threshold && scrollCount >= MIN_SCROLL_COUNT
        val rule2 = attentionTime >= threshold && scrollCount < MIN_SCROLL_COUNT
        val rule3 = (scrollTime + attentionTime) >= threshold && scrollCount >= HYBRID_MIN_SCROLL_COUNT
        
        if (rule1 || rule2 || rule3) {
            val ruleMatched = when {
                rule1 -> "Active Scrolling (scrollTime >= threshold)"
                rule2 -> "Passive Consumption (attentionTime >= threshold)"
                rule3 -> "Hybrid Behavior (combined >= threshold)"
                else -> "Unknown"
            }
            Log.i(TAG, "✅ SESSION_CLASSIFIED: DISTRACTED")
            Log.i(TAG, "   App: $appPackageName | Rule: $ruleMatched")
            Log.i(TAG, "   scrollTime: ${scrollTime}ms | attentionTime: ${attentionTime}ms | scrollCount: $scrollCount")
            Log.i(TAG, "   threshold: ${threshold}ms")
            return "DISTRACTED"
        }
        
        Log.d(TAG, "SESSION_CLASSIFIED: NEUTRAL - $appPackageName (ST:${scrollTime}ms AT:${attentionTime}ms SC:$scrollCount, threshold:${threshold}ms)")
        return "NEUTRAL"
    }

    /**
     * Check if a package name is in the distraction apps list.
     * Useful for filtering which apps to track.
     */
    fun isDistractionApp(packageName: String): Boolean {
        return DISTRACTION_APPS.contains(packageName)
    }

    /**
     * Get the list of distraction apps (for UI display or configuration).
     */
    fun getDistractionApps(): Set<String> {
        return DISTRACTION_APPS.toSet()
    }
}
