package com.attentionos.service

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.attentionos.R
import com.attentionos.accessibility.ScrollDetectionAccessibilityService
import com.attentionos.database.AppDatabase
import com.attentionos.database.AppSession
import com.attentionos.repository.SessionRepository
import com.attentionos.tracking.SessionClassifier
import com.attentionos.tracking.UsageStatsHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Foreground service that orchestrates distracted scrolling tracking.
 *
 * Responsibilities:
 * - Poll UsageStatsHelper every 1 second for foreground app detection
 * - Receive scroll events from ScrollDetectionAccessibilityService
 * - Maintain current session state in memory
 * - Detect app switches and end/start sessions
 * - Classify completed sessions using SessionClassifier
 * - Save sessions to database via SessionRepository
 * - Display persistent notification
 */
class TrackingForegroundService : Service() {

    private lateinit var usageStatsHelper: UsageStatsHelper
    private lateinit var sessionRepository: SessionRepository
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val handler = Handler(Looper.getMainLooper())
    private var pollingRunnable: Runnable? = null

    // Current session state (in-memory)
    private var currentSessionPackage: String? = null
    private var currentSessionStartTime: Long = 0
    private var scrollCount: Int = 0
    private var lastDetectionTimestamp: Long = 0L // For cooldown mechanism
    private var isScreenOn: Boolean = true // Track screen state

    // Confirmed attention state (gated by real user interaction)
    private var attentionConfirmed: Boolean = false
    private var firstInteractionTimestamp: Long =
            0L // Timestamp of first interaction (when attention was confirmed)
    private var lastInteractionTimestamp: Long = 0L // Timestamp of most recent interaction

    // BEHAVIORAL FIX: Foreground stability tracking (prevents session fragmentation)
    // Apps may briefly report different foreground (notifications, system UI) - wait for
    // confirmation
    private var suspectedForegroundApp: String? = null // App that might be foreground
    private var foregroundSuspectStartTime: Long = 0L // When suspect was first detected
    private val FOREGROUND_GRACE_WINDOW_MS = 3000L // 3 seconds to confirm app switch

    // BEHAVIORAL FIX: Interaction decay tracking (prevents infinite attention)
    // Attention should pause when user stops interacting (phone sitting idle, passive watching
    // ended)
    // private val INTERACTION_TIMEOUT_MS = 15_000L         // 15 seconds of inactivity pauses
    // attention
    private var lastActivityTimestamp: Long = 0L // Last scroll OR touch time

    // BEHAVIORAL FIX: Detection state (separate from alert cooldown)
    // Once a session is detected as DISTRACTED, it stays DISTRACTED until session ends
    // This ensures one browsing period = one DISTRACTED session (not multiple NEUTRAL fragments)
    private var sessionDetectedAsDistracted: Boolean = false // Once true, stays true for session
    private var passiveVideoMode: Boolean = false // For apps with passive watching
    private var lastAlertTimestamp: Long = 0L // For Toast cooldown only (not detection)

    // Foreground fallback (CRITICAL for OEMs that return null)
    private var lastKnownForegroundApp: String? = null
    private var lastForegroundTimestamp: Long = 0L

    // Broadcast receiver for accessibility events
    private val accessibilityEventReceiver =
            object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    if (intent == null) return

                    val packageName =
                            intent.getStringExtra(
                                    ScrollDetectionAccessibilityService.EXTRA_PACKAGE_NAME
                            )
                                    ?: return
                    val timestamp =
                            intent.getLongExtra(
                                    ScrollDetectionAccessibilityService.EXTRA_TIMESTAMP,
                                    System.currentTimeMillis()
                            )

                    when (intent.action) {
                        ScrollDetectionAccessibilityService.ACTION_SCROLL_EVENT -> {
                            handleScrollEvent(packageName, timestamp)
                        }
                        ScrollDetectionAccessibilityService.ACTION_INTERACTION_START -> {
                            handleInteractionStart(packageName, timestamp)
                        }
                        ScrollDetectionAccessibilityService.ACTION_INTERACTION_END -> {
                            handleInteractionEnd(packageName, timestamp)
                        }
                    }
                }
            }

    // Broadcast receiver for screen state changes
    private val screenStateReceiver =
            object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    when (intent?.action) {
                        Intent.ACTION_SCREEN_OFF -> {
                            isScreenOn = false
                            Log.d(TAG, "Screen turned OFF - ending session")
                            endCurrentSession(reason = "Screen turned off")
                        }
                        Intent.ACTION_SCREEN_ON -> {
                            isScreenOn = true
                            Log.d(TAG, "Screen turned ON")
                        }
                    }
                }
            }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "TrackingForegroundService created")

        // Initialize helpers
        usageStatsHelper = UsageStatsHelper(this)
        val database = AppDatabase.getInstance(this)
        sessionRepository = SessionRepository.getInstance(database)

        // Register broadcast receiver for accessibility events
        val filter =
                IntentFilter().apply {
                    addAction(ScrollDetectionAccessibilityService.ACTION_SCROLL_EVENT)
                    addAction(ScrollDetectionAccessibilityService.ACTION_INTERACTION_START)
                    addAction(ScrollDetectionAccessibilityService.ACTION_INTERACTION_END)
                }
        LocalBroadcastManager.getInstance(this).registerReceiver(accessibilityEventReceiver, filter)

        // Register broadcast receiver for screen state changes
        val screenFilter =
                IntentFilter().apply {
                    addAction(Intent.ACTION_SCREEN_OFF)
                    addAction(Intent.ACTION_SCREEN_ON)
                }
        registerReceiver(screenStateReceiver, screenFilter)

        // Create notification channel (required for Android 8.0+)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "TrackingForegroundService started")
        isServiceRunning = true

        // Start foreground service with notification
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)

        // Start polling for foreground app
        startPolling()

        return START_STICKY // Restart service if killed by system
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null // This is not a bound service
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "TrackingForegroundService destroyed")
        isServiceRunning = false

        // Stop polling
        stopPolling()

        // End current session if exists
        endCurrentSession(reason = "Service destroyed")

        // Unregister receivers
        LocalBroadcastManager.getInstance(this).unregisterReceiver(accessibilityEventReceiver)
        unregisterReceiver(screenStateReceiver)
    }

    /** Start polling for foreground app every 1 second. */
    private fun startPolling() {
        pollingRunnable =
                object : Runnable {
                    override fun run() {
                        if (attentionConfirmed && currentSessionPackage != null) {
                            Log.v(
                                    TAG,
                                    "🔒 Attention active — freezing foreground to $currentSessionPackage"
                            )
                            // 🔧 DO NOT STOP POLLING
                            handler.postDelayed(this, POLLING_INTERVAL_MS)
                            return
                        }

                        checkForegroundApp()
                        handler.postDelayed(this, POLLING_INTERVAL_MS)
                    }
                }
        handler.post(pollingRunnable!!)
    }

    /** Stop polling. */
    private fun stopPolling() {
        pollingRunnable?.let { handler.removeCallbacks(it) }
        pollingRunnable = null
    }

    /**
     * Check the current foreground app and handle app switches. BEHAVIORAL FIX: Implements 3-second
     * grace window before confirming app switches. This prevents session fragmentation from
     * transient UI events (notifications, system dialogs).
     */
    private fun checkForegroundApp() {
        val detectedApp = usageStatsHelper.getCurrentForegroundApp()
        val now = System.currentTimeMillis()

        val foregroundApp =
                if (detectedApp != null) {
                    lastKnownForegroundApp = detectedApp
                    lastForegroundTimestamp = now
                    detectedApp
                } else {
                    // 🔴 IMPORTANT: tolerate nulls up to 5 seconds
                    if (now - lastForegroundTimestamp <= 5_000L) {
                        Log.v(TAG, "⚠️ Foreground null — using cached app $lastKnownForegroundApp")
                        lastKnownForegroundApp
                    } else {
                        if (attentionConfirmed && currentSessionPackage != null) {
                            // 🔥 CORE FIX: trust active interaction over UsageStats
                            Log.v(
                                    TAG,
                                    "⚠️ Foreground unknown, but attention active — continuing session for $currentSessionPackage"
                            )
                            currentSessionPackage
                        } else {
                            if (attentionConfirmed && currentSessionPackage != null) {
                                Log.v(
                                        TAG,
                                        "👆 Interaction active — trusting session app $currentSessionPackage"
                                )
                                return
                            }

                            Log.v(TAG, "⚠️ Foreground unknown for too long — skipping check")
                            return
                        }
                    }
                }

        if (foregroundApp == "com.android.launcher3") {
            Log.v(TAG, "Ignoring launcher foreground")
            return
        }

        if (foregroundApp != currentSessionPackage) {
            // BEHAVIORAL FIX: Don't end session immediately
            // Check if this is a new suspect or existing suspect confirmation

            if (foregroundApp == suspectedForegroundApp) {
                // Same suspect - check if grace period expired
                val suspectDuration = System.currentTimeMillis() - foregroundSuspectStartTime

                if (suspectDuration >= FOREGROUND_GRACE_WINDOW_MS) {
                    // Confirmed app switch - grace period passed
                    Log.i(TAG, "✅ App switch confirmed after ${suspectDuration}ms grace period")
                    endCurrentSession(
                            reason = "App switch confirmed: $currentSessionPackage → $foregroundApp"
                    )

                    // Clear suspect tracking
                    suspectedForegroundApp = null
                    foregroundSuspectStartTime = 0L

                    // Only start new session if it's a distraction app
                    if (foregroundApp != null && SessionClassifier.isDistractionApp(foregroundApp)
                    ) {
                        startNewSession(foregroundApp)
                    }
                } else {
                    // Still within grace period - keep waiting
                    Log.v(
                            TAG,
                            "⏳ Grace window active: ${suspectDuration}ms / ${FOREGROUND_GRACE_WINDOW_MS}ms for $foregroundApp"
                    )
                }
            } else {
                // New suspect detected - start grace window
                suspectedForegroundApp = foregroundApp
                foregroundSuspectStartTime = System.currentTimeMillis()
                Log.d(
                        TAG,
                        "🔍 Suspected foreground change to $foregroundApp - starting ${FOREGROUND_GRACE_WINDOW_MS}ms grace window"
                )
            }
        } else {
            // Foreground matches current session - cancel any pending suspect
            if (suspectedForegroundApp != null) {
                Log.d(TAG, "↩️ Transient foreground loss — ignoring (keeping current session)")
                suspectedForegroundApp = null
                foregroundSuspectStartTime = 0L
            }

            // Same distraction app still in foreground with screen ON
            if (foregroundApp != null &&
                            SessionClassifier.isDistractionApp(foregroundApp) &&
                            isScreenOn
            ) {
                // Only check for detection if attention is confirmed (user has interacted)
                if (attentionConfirmed) {
                    checkForDetection()
                }
            }
        }
    }

    /**
     * Start a new session for the given app. Session object starts on foreground, but attention
     * remains inactive until interaction.
     */
    private fun startNewSession(packageName: String) {
        currentSessionPackage = packageName
        currentSessionStartTime = System.currentTimeMillis()
        scrollCount = 0
        attentionConfirmed = false
        firstInteractionTimestamp = 0L
        lastInteractionTimestamp = 0L
        passiveVideoMode = false

        Log.i(TAG, "📱 FOREGROUND_DETECTED: $packageName at ${currentSessionStartTime}")
        Log.i(TAG, "⏸️  ATTENTION_NOT_CONFIRMED: Waiting for user interaction (touch/scroll)...")
    }

    /**
     * End the current session, classify it, and save to database. Only saves sessions with
     * confirmed attention and minimum duration.
     */
    private fun endCurrentSession(reason: String = "Unknown") {
        val packageName = currentSessionPackage ?: return

        val endTime = System.currentTimeMillis()
        // Calculate attention time based on confirmed interaction
        // This represents time the user's attention was captured by the distraction app
        val attentionTime = calculateAttentionTime()

        // Only save sessions with confirmed attention and minimum duration (3 seconds)
        // This removes accidental opens, unlock artifacts, and background foreground noise
        if (!attentionConfirmed) {
            val foregroundTime = endTime - currentSessionStartTime
            Log.i(TAG, "❌ ATTENTION_IGNORED: $packageName - NO user interaction detected")
            Log.i(TAG, "   Foreground time: ${foregroundTime}ms (ignored - no touch/scroll)")
            Log.i(TAG, "   Session discard reason: $reason")
            resetSessionState()
            return
        }

        if (attentionTime < 3000L) {
            Log.i(TAG, "❌ SESSION_DISCARDED: $packageName - attention too brief")
            Log.i(TAG, "   Attention time: ${attentionTime}ms < 3000ms (minimum threshold)")
            Log.i(TAG, "   Session discard reason: $reason")
            resetSessionState()
            return
        }

        // Classify the session
        // BEHAVIORAL FIX: Use detection state - if session was marked DISTRACTED, stay DISTRACTED
        // This ensures one browsing period = one DISTRACTED session (not multiple NEUTRAL
        // fragments)
        val classification =
                if (sessionDetectedAsDistracted) {
                    Log.i(TAG, "Using detection state: session was marked DISTRACTED during use")
                    "DISTRACTED"
                } else {
                    SessionClassifier.classifySession(
                            appPackageName = packageName,
                            attentionTime = attentionTime,
                            scrollCount = scrollCount
                    )
                }

        // Create session object
        val session =
                AppSession(
                        appPackageName = packageName,
                        appLabel = usageStatsHelper.getAppLabel(packageName),
                        startTime = currentSessionStartTime,
                        endTime = endTime,
                        durationMillis = attentionTime, // Total engagement time
                        scrollCount = scrollCount,
                        classification = classification
                )

        // Log session end with detailed metrics
        val foregroundTime = endTime - currentSessionStartTime
        Log.i(TAG, "✅ SESSION_SAVED: $packageName ($classification)")
        Log.i(TAG, "   Attention time: ${attentionTime}ms (confirmed interaction)")
        Log.i(TAG, "   Foreground time: ${foregroundTime}ms (includes pre-interaction)")
        Log.i(TAG, "   Scroll count: $scrollCount")
        Log.i(TAG, "   End reason: $reason")

        // Save to database (async)
        serviceScope.launch(Dispatchers.IO) {
            try {
                sessionRepository.insertSession(session)
                Log.i(TAG, "✅ SESSION_SAVED: $packageName, ${attentionTime}ms, $classification")
            } catch (e: Exception) {
                Log.e(TAG, "Error saving session", e)
            }
        }

        resetSessionState()
    }

    /**
     * Reset session state variables. BEHAVIORAL FIX: Includes new state variables for decay and
     * detection.
     */
    private fun resetSessionState() {
        currentSessionPackage = null
        currentSessionStartTime = 0
        scrollCount = 0
        attentionConfirmed = false
        firstInteractionTimestamp = 0L
        lastInteractionTimestamp = 0L
        lastActivityTimestamp = 0L // BEHAVIORAL FIX: Reset for interaction decay
        sessionDetectedAsDistracted = false // BEHAVIORAL FIX: Reset detection state
        passiveVideoMode = false
        // Note: Don't reset foreground suspect tracking (suspectedForegroundApp,
        // foregroundSuspectStartTime)
        // as it spans sessions to maintain grace window across session boundaries
    }

    /**
     * Handle interaction start event from AccessibilityService. This confirms that user attention
     * is engaged.
     */
    private fun handleInteractionStart(packageName: String, timestamp: Long) {
        if (packageName == currentSessionPackage) {
            if (!attentionConfirmed) {
                val foregroundDuration = timestamp - currentSessionStartTime
                attentionConfirmed = true
                firstInteractionTimestamp = timestamp
                lastInteractionTimestamp = timestamp
                lastActivityTimestamp = timestamp // BEHAVIORAL FIX: Track for interaction decay
                Log.i(TAG, "✅ ATTENTION_CONFIRMED: $packageName - first touch interaction")
                Log.i(
                        TAG,
                        "   Foreground duration before interaction: ${foregroundDuration}ms (not counted)"
                )
                Log.i(TAG, "   Attention timer starts NOW at timestamp: $timestamp")
            } else {
                // Update last interaction timestamp for tracking most recent interaction
                lastInteractionTimestamp = timestamp
                lastActivityTimestamp = timestamp // BEHAVIORAL FIX: Track for interaction decay
                Log.d(TAG, "Touch interaction continued in $packageName")
            }

            // Check for detection after interaction starts
            checkForDetection()
        }
    }

    /**
     * Handle interaction end event from AccessibilityService. Note: We don't reset
     * attentionConfirmed here - attention continues until session ends.
     */
    private fun handleInteractionEnd(packageName: String, timestamp: Long) {
        if (packageName == currentSessionPackage) {
            // Interaction ended, but attention may continue (e.g., watching a reel)
            // We keep lastInteractionTimestamp as the last known interaction point
            Log.d(TAG, "Interaction ended in $packageName at $timestamp (attention continues)")
        }
    }

    /**
     * Handle scroll event from AccessibilityService. Scrolls are events, not durations. Scrolls
     * also confirm attention if not already confirmed.
     */
    private fun handleScrollEvent(packageName: String, timestamp: Long) {

        // 🔥 HARD BIND: first real interaction defines the session app
        if (currentSessionPackage == null) {
            currentSessionPackage = packageName
            currentSessionStartTime = timestamp
            Log.i(TAG, "🔒 SESSION_BOUND_BY_SCROLL: $packageName")
        }

        // 🔥 If session exists but app mismatches, trust interaction
        if (packageName != currentSessionPackage) {
            Log.w(TAG, "⚠️ Scroll from $packageName overrides foreground $currentSessionPackage")
            currentSessionPackage = packageName
        }

        scrollCount++

        lastKnownForegroundApp = packageName
        lastForegroundTimestamp = timestamp

        // Confirm attention
        if (!attentionConfirmed) {
            attentionConfirmed = true
            firstInteractionTimestamp = timestamp
            lastInteractionTimestamp = timestamp
            lastActivityTimestamp = timestamp

            Log.i(TAG, "✅ ATTENTION_CONFIRMED_BY_SCROLL: $packageName")
            Log.i(TAG, "   Attention timer started at $timestamp")
        } else {
            lastInteractionTimestamp = timestamp
            lastActivityTimestamp = timestamp
        }

        // Run detection
        checkForDetection()

        val attentionTime = calculateAttentionTime()
        Log.d(TAG, "📊 $packageName - Scroll #$scrollCount | Attention: ${attentionTime}ms")
    }

    private fun getInteractionTimeout(packageName: String?): Long {
        return when (packageName) {
            "com.instagram.android",
            "com.zhiliaoapp.musically",
            "com.google.android.youtube",
            "com.snapchat.android" -> 45_000L // passive video watching
            else -> 15_000L // normal apps
        }
    }

    /**
     * Calculate attention time based on confirmed interaction. BEHAVIORAL FIX: Implements
     * interaction decay - attention pauses after 15s of inactivity. This prevents infinite
     * attention when user stops watching or phone sits idle.
     *
     * Attention time is gated by real user interaction and pauses during inactivity periods.
     */
    private fun calculateAttentionTime(): Long {
        if (!attentionConfirmed || firstInteractionTimestamp == 0L || !isScreenOn) {
            return 0L
        }

        val now = System.currentTimeMillis()

        // For short-form video apps: trust time after first interaction
        if (SessionClassifier.isShortFormVideoApp(currentSessionPackage)) {
            return maxOf(0L, now - firstInteractionTimestamp)
        }

        // For normal apps, keep conservative behavior
        val timeSinceLastActivity = now - lastActivityTimestamp
        if (timeSinceLastActivity > 15_000L) {
            return maxOf(0L, lastActivityTimestamp - firstInteractionTimestamp)
        }

        return maxOf(0L, now - firstInteractionTimestamp)
    }

    /**
     * Check if current metrics satisfy any detection rule. BEHAVIORAL FIX: Separates detection
     * state from alert cooldown. Once a session is detected as DISTRACTED, it stays DISTRACTED
     * until session ends. This ensures one browsing period = one DISTRACTED session (not multiple
     * NEUTRAL fragments).
     */
    private fun checkForDetection() {
        val packageName = currentSessionPackage ?: return

        // Only check detection if attention is confirmed
        // This prevents false positives from foreground-only time
        if (!attentionConfirmed) {
            Log.v(TAG, "⏸️  Detection check skipped: $packageName - no interaction yet")
            return // No attention confirmed yet, skip detection
        }

        val attentionTime = calculateAttentionTime()
        // Enable passive video mode: user scrolled once and is now watching
        if (!passiveVideoMode && scrollCount <= 1 && attentionTime >= 10_000L) {
            passiveVideoMode = true
            Log.i(TAG, "🎥 PASSIVE_VIDEO_MODE_ENABLED for $packageName")
        }

        // BEHAVIORAL FIX: Once detected as DISTRACTED, session stays DISTRACTED
        // This ensures session continuity even with repeated checks
        if (!sessionDetectedAsDistracted) {
            // Not yet detected - check detection rules
            val isDistracted =
                    SessionClassifier.checkDetectionRules(
                            appPackageName = packageName,
                            attentionTime = attentionTime,
                            scrollCount = scrollCount
                    )

            if (isDistracted) {
                // Mark session as permanently DISTRACTED
                sessionDetectedAsDistracted = true

                Log.i(TAG, "🚨 SESSION_MARKED_DISTRACTED: $packageName")
                Log.i(TAG, "   Attention time: ${attentionTime}ms")
                Log.i(TAG, "   Scroll count: $scrollCount")
                Log.i(TAG, "   ✅ Session will remain DISTRACTED until it ends")

                // Show first alert immediately
                showDistractionAlert(packageName, attentionTime)
            }
        } else {
            // Already detected as DISTRACTED - only show periodic alerts if cooldown expired
            val now = System.currentTimeMillis()
            val timeSinceLastAlert = now - lastAlertTimestamp

            if (timeSinceLastAlert >= DETECTION_COOLDOWN_MS) {
                showDistractionAlert(packageName, attentionTime)
            } else {
                Log.v(
                        TAG,
                        "🔕 Alert suppressed: cooldown active (${timeSinceLastAlert}ms / ${DETECTION_COOLDOWN_MS}ms)"
                )
            }
        }
    }

    /**
     * Show distraction alert to user (Toast notification). BEHAVIORAL FIX: Separated from detection
     * logic - this only shows UI, doesn't affect state.
     */
    private fun showDistractionAlert(packageName: String, attentionTime: Long) {
        val appLabel = usageStatsHelper.getAppLabel(packageName)
        val totalTime = attentionTime / 1000 // Convert to seconds

        lastAlertTimestamp = System.currentTimeMillis()

        Log.i(TAG, "🔔 SHOWING_ALERT: $packageName (${totalTime}s, $scrollCount scrolls)")

        Handler(Looper.getMainLooper()).post {
            Toast.makeText(
                            this,
                            "⚠️ Distracted on $appLabel (${totalTime}s, $scrollCount scrolls)",
                            Toast.LENGTH_LONG
                    )
                    .show()
        }
    }

    /** Create notification channel for Android 8.0+. */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel =
                    NotificationChannel(
                                    CHANNEL_ID,
                                    "Tracking Service",
                                    NotificationManager.IMPORTANCE_LOW
                            )
                            .apply {
                                description = "AttentionOS is tracking your app usage"
                                setShowBadge(false)
                            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    /** Create the persistent notification for the foreground service. */
    private fun createNotification(): Notification {
        // Intent to open the app when notification is tapped
        val pendingIntent =
                PendingIntent.getActivity(
                        this,
                        0,
                        packageManager.getLaunchIntentForPackage(packageName),
                        PendingIntent.FLAG_IMMUTABLE
                )

        return NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("AttentionOS Tracking Active")
                .setContentText("Monitoring app usage for distracted scrolling")
                .setSmallIcon(R.mipmap.ic_launcher) // Use app icon
                .setContentIntent(pendingIntent)
                .setOngoing(true) // Cannot be dismissed by user
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build()
    }

    companion object {
        private const val TAG = "TrackingService"
        private const val CHANNEL_ID = "tracking_service_channel"
        private const val NOTIFICATION_ID = 1001
        private const val POLLING_INTERVAL_MS = 1000L // 1 second
        private const val DETECTION_COOLDOWN_MS = 60_000L // 60 seconds between detections

        @Volatile private var isServiceRunning = false

        /** Check if the tracking service is currently running. */
        fun isRunning(): Boolean {
            return isServiceRunning
        }

        /** Start the tracking service. */
        fun start(context: Context) {
            val intent = Intent(context, TrackingForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /** Stop the tracking service. */
        fun stop(context: Context) {
            val intent = Intent(context, TrackingForegroundService::class.java)
            context.stopService(intent)
        }
    }
}
