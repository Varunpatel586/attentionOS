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

        val endTime = System.currentTimeMillis()
        val startTime = endTime - 15000

        try {

            // ---------- METHOD 1: UsageEvents ----------
            val events = usageStatsManager.queryEvents(startTime, endTime)
            val event = UsageEvents.Event()

            var lastPackage: String? = null
            var lastTime = 0L

            while (events.hasNextEvent()) {
                events.getNextEvent(event)

                if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                    event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
                ) {
                    if (event.timeStamp > lastTime) {
                        lastTime = event.timeStamp
                        lastPackage = event.packageName
                    }
                }
            }

            if (lastPackage != null) {
                Log.d(TAG, "📱 Foreground detected (events): $lastPackage")
                return lastPackage
            }


            // ---------- METHOD 2: UsageStats fallback ----------
            val stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            )

            if (!stats.isNullOrEmpty()) {

                var recentApp: String? = null
                var recentTime = 0L

                for (usage in stats) {
                    if (usage.lastTimeUsed > recentTime) {
                        recentTime = usage.lastTimeUsed
                        recentApp = usage.packageName
                    }
                }

                if (recentApp != null) {
                    Log.d(TAG, "📱 Foreground detected (usage stats): $recentApp")
                    return recentApp
                }
            }


            // ---------- METHOD 3: ActivityManager fallback ----------
            val activityManager =
                context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager

            val processes = activityManager.runningAppProcesses

            if (!processes.isNullOrEmpty()) {

                for (process in processes) {

                    if (process.importance ==
                        android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                    ) {

                        val pkg = process.pkgList?.firstOrNull()

                        if (pkg != null) {
                            Log.d(TAG, "📱 Foreground detected (ActivityManager): $pkg")
                            return pkg
                        }
                    }
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Foreground detection failed", e)
        }

        return null
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
