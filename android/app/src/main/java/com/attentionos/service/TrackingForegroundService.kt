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
import com.attentionos.overlay.FloatingTimerOverlay
import com.attentionos.overlay.OverlayPermissionHelper
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
 * - Manage floating timer overlay for distraction apps
 */
class TrackingForegroundService : Service() {

    private lateinit var usageStatsHelper: UsageStatsHelper
    private lateinit var sessionRepository: SessionRepository
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    
    private val handler = Handler(Looper.getMainLooper())
    private var pollingRunnable: Runnable? = null

    // Floating overlay
    private val floatingOverlay = FloatingTimerOverlay.getInstance()
    private var overlayShownTime: Long = 0L
    private var overlayTimerRunnable: Runnable? = null

    // Current session state (in-memory)
    private var currentSessionPackage: String? = null
    private var currentSessionStartTime: Long = 0
    private var scrollCount: Int = 0
    private var scrollTime: Long = 0L  // Time between consecutive scroll events
    private var attentionTime: Long = 0L  // Total foreground time with screen ON
    private var lastScrollTimestamp: Long = 0
    private var lastDetectionTimestamp: Long = 0L  // For cooldown mechanism
    private var isScreenOn: Boolean = true  // Track screen state

    // Broadcast receiver for accessibility events
    private val accessibilityEventReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent == null) return
            
            val packageName = intent.getStringExtra(ScrollDetectionAccessibilityService.EXTRA_PACKAGE_NAME) ?: return
            val timestamp = intent.getLongExtra(ScrollDetectionAccessibilityService.EXTRA_TIMESTAMP, System.currentTimeMillis())

            when (intent.action) {
                ScrollDetectionAccessibilityService.ACTION_SCROLL_EVENT -> {
                    handleScrollEvent(packageName, timestamp)
                }
                // Interaction events no longer used - attention time tracked via polling
            }
        }
    }

    // Broadcast receiver for screen state changes
    private val screenStateReceiver = object : BroadcastReceiver() {
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
        serviceInstance = this

        // Initialize helpers
        usageStatsHelper = UsageStatsHelper(this)
        val database = AppDatabase.getInstance(this)
        sessionRepository = SessionRepository.getInstance(database)

        // Register broadcast receiver for accessibility events
        val filter = IntentFilter().apply {
            addAction(ScrollDetectionAccessibilityService.ACTION_SCROLL_EVENT)
            addAction(ScrollDetectionAccessibilityService.ACTION_INTERACTION_START)
            addAction(ScrollDetectionAccessibilityService.ACTION_INTERACTION_END)
        }
        LocalBroadcastManager.getInstance(this).registerReceiver(accessibilityEventReceiver, filter)

        // Register broadcast receiver for screen state changes
        val screenFilter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_SCREEN_ON)
        }
        registerReceiver(screenStateReceiver, screenFilter)

        // Create notification channel (required for Android 8.0+)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "TrackingForegroundService started")

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
        serviceInstance = null

        // Stop polling
        stopPolling()

        // End current session if exists
        endCurrentSession(reason = "Service destroyed")

        // Unregister receivers
        LocalBroadcastManager.getInstance(this).unregisterReceiver(accessibilityEventReceiver)
        unregisterReceiver(screenStateReceiver)

        // Remove overlay
        hideOverlay()
    }

    /**
     * Start polling for foreground app every 1 second.
     */
    private fun startPolling() {
        pollingRunnable = object : Runnable {
            override fun run() {
                checkForegroundApp()
                handler.postDelayed(this, POLLING_INTERVAL_MS)
            }
        }
        handler.post(pollingRunnable!!)
    }

    /**
     * Stop polling.
     */
    private fun stopPolling() {
        pollingRunnable?.let { handler.removeCallbacks(it) }
        pollingRunnable = null
    }

    /**
     * Check the current foreground app and handle app switches.
     * Also accumulates attention time for distraction apps.
     */
    // Session continuity constants
    private val IDLE_END_THRESHOLD = 5 * 60 * 1000L // 5 minutes - sessions end ONLY after this much inactivity
    private val ATTENTION_ACCUMULATION_IDLE_LIMIT = 5 * 60 * 1000L // Continue accumulating attention for 5 minutes without scrolls

    private fun checkForegroundApp() {
        val now = System.currentTimeMillis()
        val foregroundApp = usageStatsHelper.getCurrentForegroundApp()

        // START SESSION IF USER OPENS A DISTRACTION APP
        if (currentSessionPackage == null && foregroundApp != null) {
            if (SessionClassifier.isDistractionApp(foregroundApp)) {

                Log.i(TAG, "📱 SESSION START (foreground detection): $foregroundApp")

                startNewSession(foregroundApp)
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // CASE 1: UsageStats returned a real app
        // ═══════════════════════════════════════════════════════════════
        if (foregroundApp != null) {
            // Ignore our own package—it's just notification UI, not user's actual foreground app
            if (foregroundApp == applicationContext.packageName) {
                Log.v(TAG, "⏭️  Ignoring own app in foreground (notification UI)")
                return
            }

            // REAL app switch (different non-null app)
            if (currentSessionPackage != null && foregroundApp != currentSessionPackage) {
                Log.i(TAG, "🔄 Real app switch detected: $currentSessionPackage → $foregroundApp")
                endCurrentSession(
                    reason = "User switched to different app: $foregroundApp"
                )

                if (SessionClassifier.isDistractionApp(foregroundApp)) {
                    startNewSession(foregroundApp)
                }
                return
            }

            // Same app still foreground → accumulate attention time
            if (foregroundApp == currentSessionPackage && isScreenOn) {
                val idleTime = if (lastScrollTimestamp > 0) now - lastScrollTimestamp else 0L

                // ✅ CRITICAL FIX: Continue accumulating attention for up to 5 minutes without scrolls
                // This supports watching long reels/videos without interaction
                if (idleTime <= ATTENTION_ACCUMULATION_IDLE_LIMIT) {
                    attentionTime += POLLING_INTERVAL_MS
                    Log.v(TAG, "📊 Attention accumulated: ${attentionTime}ms (idle: ${idleTime}ms / ${ATTENTION_ACCUMULATION_IDLE_LIMIT}ms)")
                } else {
                    Log.v(TAG, "⏸️ Idle time exceeded accumulation limit (${idleTime}ms > ${ATTENTION_ACCUMULATION_IDLE_LIMIT}ms) - checking for session end")
                    
                    // End session only if idle threshold exceeded
                    if (idleTime >= IDLE_END_THRESHOLD) {
                        Log.i(TAG, "⏱️ Session ending due to ${idleTime}ms of inactivity (threshold: ${IDLE_END_THRESHOLD}ms)")
                        endCurrentSession(
                            reason = "User idle for ${idleTime / 1000}s (threshold: ${IDLE_END_THRESHOLD / 1000}s)"
                        )
                        return
                    }
                }
            }

            checkForDetection()
            return
        }

        // ═══════════════════════════════════════════════════════════════
        // CASE 2: foregroundApp == null
        // ✅ CRITICAL FIX: NULL must NEVER end a session by itself
        // Treat null as "unknown", not "app left"
        // ═══════════════════════════════════════════════════════════════
        if (currentSessionPackage != null) {
            val idleTime = if (lastScrollTimestamp > 0) now - lastScrollTimestamp else 0L
            
            Log.v(TAG, "⚠️ Foreground app is null (UsageStats unknown) - session continues (idle: ${idleTime}ms)")
            
            // Continue accumulating attention time even when foregroundApp is null
            // as long as we're within idle limits and screen is on
            if (isScreenOn && idleTime <= ATTENTION_ACCUMULATION_IDLE_LIMIT) {
                attentionTime += POLLING_INTERVAL_MS
                Log.v(TAG, "📊 Attention accumulated during null foreground: ${attentionTime}ms (idle: ${idleTime}ms)")
            }
            
            // Only end session if user has been idle for 5+ minutes
            if (idleTime >= IDLE_END_THRESHOLD) {
                Log.i(TAG, "⏱️ Session ending due to ${idleTime}ms of inactivity during null foreground (threshold: ${IDLE_END_THRESHOLD}ms)")
                endCurrentSession(
                    reason = "User idle for ${idleTime / 1000}s with unknown foreground app"
                )
            } else {
                Log.v(TAG, "✅ Session continues despite null foreground (idle: ${idleTime}ms < threshold: ${IDLE_END_THRESHOLD}ms)")
            }
        }
    }
    /**
     * Start a new session for the given app.
     */
 private fun startNewSession(packageName: String) {
    currentSessionPackage = packageName
    currentSessionStartTime = System.currentTimeMillis()
    scrollCount = 0
    scrollTime = 0L
    attentionTime = 0L
    lastScrollTimestamp = 0L

    Log.i(TAG, "========================================")
    Log.i(TAG, "📱 SESSION_STARTED: $packageName")
    Log.i(TAG, "   startTime: ${currentSessionStartTime}ms")
    Log.i(TAG, "   scrollCount: 0, scrollTime: 0ms, attentionTime: 0ms")
    Log.i(TAG, "========================================")
    
    // Reset overlay state for new session
    overlayShownTime = 0L
}


    /**
     * End the current session, classify it, and save to database.
     */
    private fun endCurrentSession(reason: String = "Unknown") {
        val packageName = currentSessionPackage ?: return
        
        val endTime = System.currentTimeMillis()
        val totalTime = scrollTime + attentionTime
        val durationSeconds = totalTime / 1000

        // Only save sessions longer than 1 second
        if (totalTime < 1000) {
            Log.w(TAG, "⚠️ SESSION_DISCARDED: $packageName | Duration: ${durationSeconds}s (too short) | Reason: $reason")
            Log.w(TAG, "   scrollTime: ${scrollTime}ms, attentionTime: ${attentionTime}ms, scrolls: $scrollCount")
            resetSessionState()
            return
        }

        // Classify the session
        val classification = SessionClassifier.classifySession(
            packageName,
            scrollTime,
            attentionTime,
            scrollCount
        )

        // Create session object
        val session = AppSession(
            appPackageName = packageName,
            appLabel = usageStatsHelper.getAppLabel(packageName),
            startTime = currentSessionStartTime,
            endTime = endTime,
            durationMillis = totalTime,  // Total engagement time (must be non-zero)
            scrollCount = scrollCount,
            classification = classification
        )

        // Log session end with detailed info
        Log.i(TAG, "========================================")
        Log.i(TAG, "✅ SESSION_ENDED: $packageName ($classification)")
        Log.i(TAG, "   Duration: ${durationSeconds}s (${totalTime}ms)")
        Log.i(TAG, "   scrollTime: ${scrollTime}ms | attentionTime: ${attentionTime}ms | scrollCount: $scrollCount")
        Log.i(TAG, "   Reason: $reason")
        Log.i(TAG, "========================================")

        // Save to database (async)
        serviceScope.launch(Dispatchers.IO) {
            try {
                sessionRepository.insertSession(session)
                Log.i(TAG, "💾 Session saved to database: $packageName, ${durationSeconds}s, $classification")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Error saving session: $packageName", e)
            }
        }

        resetSessionState()
        
        // Hide overlay when session ends
        hideOverlay()
    }

    /**
     * Reset session state variables.
     */
    private fun resetSessionState() {
        currentSessionPackage = null
        currentSessionStartTime = 0
        scrollCount = 0
        scrollTime = 0L
        attentionTime = 0L
        lastScrollTimestamp = 0
        overlayShownTime = 0L
    }

    /**
     * Handle scroll event from AccessibilityService.
     * Accumulates scroll time using delta between consecutive scroll events.
     */
    private fun handleScrollEvent(packageName: String, timestamp: Long) {

        // Bootstrap session from scroll if not already started
        // Scroll events often arrive before UsageStats stabilizes
        if (currentSessionPackage == null) {
            if (SessionClassifier.isDistractionApp(packageName)) {
                Log.i(TAG, "🎬 [SESSION START] Bootstrapping from scroll event: $packageName")
                startNewSession(packageName)
            } else {
                Log.v(TAG, "⏭️  Scroll ignored: $packageName is not a distraction app")
                return
            }
        }

    // Ignore scrolls from non-session apps (only possible if session switched)
    if (packageName != currentSessionPackage) {
        Log.w(TAG, "⚠️ Scroll ignored (app mismatch): scroll=$packageName, session=$currentSessionPackage")
        return
    }

        scrollCount++

        // Accumulate scroll time using deltas between consecutive scrolls
        if (lastScrollTimestamp > 0) {
            val delta = timestamp - lastScrollTimestamp
            scrollTime += delta
            Log.v(TAG, "⏱️  Scroll delta: ${delta}ms (total scrollTime=${scrollTime}ms)")
        } else {
            Log.i(TAG, "⏱️  First scroll detected (timestamp=${timestamp}ms)")
        }
        lastScrollTimestamp = timestamp

        // Trigger detection check after scroll
        checkForDetection()

        // Log comprehensive session state after each scroll
        Log.d(
            TAG,
            "📊 [SCROLL] $packageName | #$scrollCount | scrollTime=${scrollTime}ms | attentionTime=${attentionTime}ms | total=${scrollTime + attentionTime}ms"
        )
    }

    /**
     * Check if current metrics satisfy any detection rule.
     * Implements cooldown to prevent rapid re-detection.
     */
    private fun checkForDetection() {
        val packageName = currentSessionPackage ?: return
        
        // Check cooldown
        val now = System.currentTimeMillis()
        val timeSinceLastDetection = now - lastDetectionTimestamp
        if (lastDetectionTimestamp > 0 && timeSinceLastDetection < DETECTION_COOLDOWN_MS) {
            return  // Still in cooldown
        }
        
        // Check if any detection rule is satisfied
        val isDistracted = SessionClassifier.checkDetectionRules(
            packageName,
            scrollTime,
            attentionTime,
            scrollCount
        )
        
        if (isDistracted) {
            lastDetectionTimestamp = now
            
            val appLabel = usageStatsHelper.getAppLabel(packageName)
            val totalTime = (scrollTime + attentionTime) / 1000 // Convert to seconds
            
            Log.i(TAG, "🚨 DISTRACTED DETECTION:  $packageName - scrollTime:${scrollTime}ms, attentionTime:${attentionTime}ms, scrolls:$scrollCount")
            
            // Show Toast notification to user
            Handler(Looper.getMainLooper()).post {
                Toast.makeText(
                    this,
                    "⚠️ Distracted on $appLabel (${totalTime}s, $scrollCount scrolls)",
                    Toast.LENGTH_LONG
                ).show()
            }
            
            // DO NOT reset counters - session continues
            
            // Check if we should show overlay (after 20 seconds of engagement)
            checkAndShowOverlay()
        }
    }

    /**
     * Check if overlay should be shown based on session metrics
     */
    private fun checkAndShowOverlay() {
        val packageName = currentSessionPackage ?: return
        val totalTime = scrollTime + attentionTime
        
        // Only show overlay for distraction apps
        if (!SessionClassifier.isDistractionApp(packageName)) {
            return
        }
        
        // Show overlay after 20 seconds of engagement and only if not already shown
        if (totalTime >= 20_000L && overlayShownTime == 0L) {
            if (OverlayPermissionHelper.hasPermission(this)) {
                try {
                    floatingOverlay.showOverlay(this)
                    overlayShownTime = System.currentTimeMillis()
                    startOverlayTimer()
                    Log.i(TAG, "🫧 Floating overlay shown for $packageName")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Failed to show floating overlay", e)
                }
            } else {
                Log.w(TAG, "⚠️ Overlay permission not granted - cannot show floating timer")
            }
        }
    }

    /**
     * Start updating the overlay timer every second
     */
    private fun startOverlayTimer() {
        stopOverlayTimer()
        
        overlayTimerRunnable = object : Runnable {
            override fun run() {
                if (overlayShownTime > 0 && currentSessionPackage != null) {
                    val elapsedSeconds = (System.currentTimeMillis() - overlayShownTime) / 1000
                    floatingOverlay.updateTimer(elapsedSeconds)
                    handler.postDelayed(this, 1000)
                }
            }
        }
        handler.post(overlayTimerRunnable!!)
    }

    /**
     * Stop the overlay timer
     */
    private fun stopOverlayTimer() {
        overlayTimerRunnable?.let { handler.removeCallbacks(it) }
        overlayTimerRunnable = null
    }

    /**
     * Hide the floating overlay
     */
    private fun hideOverlay() {
        if (floatingOverlay.isOverlayVisible()) {
            floatingOverlay.removeOverlay()
            stopOverlayTimer()
            overlayShownTime = 0L
            Log.i(TAG, "🫧 Floating overlay hidden")
        }
    }



    /**
     * Create notification channel for Android 8.0+.
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Tracking Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "AttentionOS is tracking your app usage"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Create the persistent notification for the foreground service.
     */
    private fun createNotification(): Notification {
        // Intent to open the app when notification is tapped
        val pendingIntent = PendingIntent.getActivity(
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
        private var serviceInstance: TrackingForegroundService? = null

        /**
         * Start the tracking service.
         */
        fun start(context: Context) {
            val intent = Intent(context, TrackingForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Stop the tracking service.
         */
        fun stop(context: Context) {
            val intent = Intent(context, TrackingForegroundService::class.java)
            context.stopService(intent)
        }

        /**
         * Check if the tracking service is currently running.
         */
        fun isRunning(): Boolean {
            return serviceInstance != null
        }
    }
}
