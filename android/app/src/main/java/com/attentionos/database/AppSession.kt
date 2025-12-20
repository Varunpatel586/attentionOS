package com.attentionos.database

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room entity representing an aggregated app usage session.
 * Stores ONLY aggregated session data, not raw events, for privacy compliance.
 */
@Entity(tableName = "app_sessions")
data class AppSession(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    /**
     * Package name of the app (e.g., "com.instagram.android")
     */
    val appPackageName: String,

    /**
     * User-friendly app label (e.g., "Instagram")
     */
    val appLabel: String,

    /**
     * Session start timestamp in milliseconds (System.currentTimeMillis())
     */
    val startTime: Long,

    /**
     * Session end timestamp in milliseconds
     */
    val endTime: Long,

    /**
     * Total session duration in milliseconds (endTime - startTime)
     */
    val durationMillis: Long,

    /**
     * Number of scroll events detected during this session
     * Counted from AccessibilityService TYPE_VIEW_SCROLLED events
     */
    val scrollCount: Int,

    /**
     * Classification result: "DISTRACTED" or "NEUTRAL"
     * Determined by SessionClassifier based on app, duration, and scroll count
     */
    val classification: String
)
