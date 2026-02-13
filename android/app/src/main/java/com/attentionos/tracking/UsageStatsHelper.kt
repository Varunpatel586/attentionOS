package com.attentionos.tracking

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log

/**
 * Helper class for detecting the current foreground app using UsageStatsManager.
 * This is the official Android API for app usage tracking (requires PACKAGE_USAGE_STATS permission).
 */
class UsageStatsHelper(private val context: Context) {

    private val usageStatsManager: UsageStatsManager? =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager

    private val packageManager: PackageManager = context.packageManager

    /**
     * Get the package name of the current foreground app.
     * Uses UsageStatsManager to query recent app usage events.
     * 
     * @return Package name of the foreground app, or null if unable to determine
     */
    fun getCurrentForegroundApp(): String? {
        if (usageStatsManager == null) {
            Log.e(TAG, "UsageStatsManager not available")
            return null
        }

        val currentTime = System.currentTimeMillis()
        // Query events from the past 2 seconds to get the most recent app
        val startTime = currentTime - 2000

        try {
            val usageEvents = usageStatsManager.queryEvents(startTime, currentTime)
            var lastEvent: UsageEvents.Event? = null
            var lastEventTime = 0L

            // Iterate through all events and find the most recent MOVE_TO_FOREGROUND event
            val event = UsageEvents.Event()
            var lastPackageName: String? = null
            
            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                
                // We're interested in MOVE_TO_FOREGROUND events
                if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                    event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    
                    if (event.timeStamp > lastEventTime) {
                        lastEventTime = event.timeStamp
                        lastPackageName = event.packageName
                    }
                }
            }

            // Return the package name of the most recent foreground app
            return lastPackageName?.also {
                Log.d(TAG, "Current foreground app: $it")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error querying usage stats", e)
            return null
        }
    }

    /**
     * Get the user-friendly app label for a package name.
     * @param packageName The package name to look up
     * @return App label, or the package name if label cannot be retrieved
     */
    fun getAppLabel(packageName: String): String {
        return try {
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            Log.w(TAG, "App label not found for $packageName")
            packageName // Fallback to package name
        }
    }

    companion object {
        private const val TAG = "UsageStatsHelper"
    }
}
