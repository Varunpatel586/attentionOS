package com.attentionos.bridge

import android.os.Build
import android.util.Log
import com.attentionos.database.AppDatabase
import com.attentionos.repository.SessionRepository
import com.attentionos.service.TrackingForegroundService
import com.attentionos.utils.PermissionHelper
import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * React Native Native Module for AttentionOS.
 * Exposes tracking functionality to JavaScript/TypeScript.
 * 
 * All database operations are executed on background threads and results
 * are returned via promises.
 */
class AttentionOSModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var sessionRepository: SessionRepository

    init {
        // Initialize repository
        val database = AppDatabase.getInstance(reactContext)
        sessionRepository = SessionRepository.getInstance(database)
    }

    override fun getName(): String {
        return "AttentionOSModule"
    }

    /**
     * Start the tracking service.
     * Checks for required permissions (Accessibility and Usage Stats) before starting.
     * If permissions are missing, shows an appropriate dialog to the user.
     */
    @ReactMethod
    fun startTracking() {
        Log.i(TAG, "startTracking called from React Native")
        reactApplicationContext.currentActivity?.let { activity ->
            // Check if required permissions are granted
            val hasAccessibility = PermissionHelper.hasAccessibilityPermission(
                activity,
                "com.attentionos.accessibility.ScrollDetectionAccessibilityService"
            )
            val hasUsageStats = PermissionHelper.hasUsageStatsPermission(activity)

            when {
                !hasAccessibility && !hasUsageStats -> {
                    // Both permissions missing
                    Log.w(TAG, "Both Accessibility and Usage Stats permissions missing")
                    PermissionHelper.showBothPermissionsDialog(activity)
                }
                !hasAccessibility -> {
                    // Only accessibility permission missing
                    Log.w(TAG, "Accessibility permission missing")
                    PermissionHelper.showAccessibilityPermissionDialog(activity)
                }
                !hasUsageStats -> {
                    // Only usage stats permission missing
                    Log.w(TAG, "Usage Stats permission missing")
                    PermissionHelper.showUsageStatsPermissionDialog(activity)
                }
                else -> {
                    // All permissions granted - start tracking
                    Log.i(TAG, "All permissions granted - starting tracking service")
                    TrackingForegroundService.start(activity)
                }
            }
        } ?: run {
            Log.e(TAG, "Cannot start tracking: no current activity")
        }
    }

    /**
     * Stop the tracking service.
     */
    @ReactMethod
    fun stopTracking() {
        Log.i(TAG, "stopTracking called from React Native")
        reactApplicationContext.currentActivity?.let { activity ->
            TrackingForegroundService.stop(activity)
        } ?: run {
            Log.e(TAG, "Cannot stop tracking: no current activity")
        }
    }

    /**
     * Get total distracted scrolling time for today.
     * @param promise Resolves with total milliseconds (Long)
     */
    @ReactMethod
    fun getTodayDistractedTime(promise: Promise) {
        Log.d(TAG, "getTodayDistractedTime called")
        
        moduleScope.launch {
            try {
                val totalMillis = withContext(Dispatchers.IO) {
                    sessionRepository.getTodayDistractedTime()
                }
                promise.resolve(totalMillis.toDouble()) // JavaScript doesn't have Long, use Double
            } catch (e: Exception) {
                Log.e(TAG, "Error getting today's distracted time", e)
                promise.reject("ERROR", "Failed to get today's distracted time: ${e.message}")
            }
        }
    }

    /**
     * Get total distracted scrolling time for this week.
     * @param promise Resolves with total milliseconds (Long)
     */
    @ReactMethod
    fun getWeeklyDistractedTime(promise: Promise) {
        Log.d(TAG, "getWeeklyDistractedTime called")
        
        moduleScope.launch {
            try {
                val totalMillis = withContext(Dispatchers.IO) {
                    sessionRepository.getWeeklyDistractedTime()
                }
                promise.resolve(totalMillis.toDouble())
            } catch (e: Exception) {
                Log.e(TAG, "Error getting weekly distracted time", e)
                promise.reject("ERROR", "Failed to get weekly distracted time: ${e.message}")
            }
        }
    }

    /**
     * Check all required permissions.
     * @param promise Resolves with a map of permission statuses
     */
    @ReactMethod
    fun checkPermissions(promise: Promise) {
        Log.d(TAG, "checkPermissions called")
        
        try {
            val context = reactApplicationContext
            val permissions = Arguments.createMap().apply {
                putBoolean("usageStats", PermissionHelper.hasUsageStatsPermission(context))
                putBoolean("accessibility", PermissionHelper.hasAccessibilityPermission(
                    context,
                    "com.attentionos.accessibility.ScrollDetectionAccessibilityService"
                ))
                putBoolean("notifications", PermissionHelper.hasNotificationPermission(context))
            }
            promise.resolve(permissions)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking permissions", e)
            promise.reject("ERROR", "Failed to check permissions: ${e.message}")
        }
    }

    /**
     * Request Usage Stats permission by opening settings.
     */
    @ReactMethod
    fun requestUsageStatsPermission() {
        Log.i(TAG, "requestUsageStatsPermission called")
        try {
            PermissionHelper.openUsageStatsSettings(reactApplicationContext)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening usage stats settings", e)
        }
    }

    /**
     * Request Accessibility permission by opening settings.
     */
    @ReactMethod
    fun requestAccessibilityPermission() {
        Log.i(TAG, "requestAccessibilityPermission called")
        try {
            PermissionHelper.openAccessibilitySettings(reactApplicationContext)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening accessibility settings", e)
        }
    }

    /**
     * Request notification permission (Android 13+).
     * For older versions, this is a no-op.
     */
    @ReactMethod
    fun requestNotificationPermission() {
        Log.i(TAG, "requestNotificationPermission called")
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactApplicationContext.currentActivity?.let { activity ->
                activity.requestPermissions(
                    arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                    NOTIFICATION_PERMISSION_REQUEST_CODE
                )
            }
        } else {
            Log.d(TAG, "Notification permission not required on this Android version")
        }
    }

    /**
     * Check if the tracking service is currently running.
     * @param promise Resolves with true if service is running, false otherwise
     */
    @ReactMethod
    fun isTrackingRunning(promise: Promise) {
        Log.d(TAG, "isTrackingRunning called")
        try {
            val isRunning = TrackingForegroundService.isRunning()
            promise.resolve(isRunning)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking service status", e)
            promise.reject("ERROR", "Failed to check service status: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "AttentionOSModule"
        private const val NOTIFICATION_PERMISSION_REQUEST_CODE = 1001
    }
}
