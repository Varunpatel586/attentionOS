package com.attentionos.utils

import android.app.AlertDialog
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import androidx.core.content.ContextCompat

/**
 * Utility class for checking and requesting permissions required by AttentionOS.
 * Handles both standard and special permissions (Usage Stats, Accessibility).
 */
object PermissionHelper {

    /**
     * Check if the app has Usage Stats permission (PACKAGE_USAGE_STATS).
     * This is a special permission that requires user to grant it in Settings.
     */
    fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    /**
     * Check if the Accessibility Service is enabled for this app.
     * @param serviceClassName Fully qualified class name of the accessibility service
     */
    fun hasAccessibilityPermission(context: Context, serviceClassName: String): Boolean {
        val expectedComponentName = "${context.packageName}/$serviceClassName"
        val enabledServicesSetting = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        )
        
        if (enabledServicesSetting.isNullOrEmpty()) {
            return false
        }

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServicesSetting)

        while (colonSplitter.hasNext()) {
            val componentName = colonSplitter.next()
            if (componentName.equals(expectedComponentName, ignoreCase = true)) {
                return true
            }
        }
        return false
    }

    /**
     * Open the Usage Stats settings page where user can grant permission.
     */
    fun openUsageStatsSettings(context: Context) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        context.startActivity(intent)
    }

    /**
     * Open the Accessibility settings page where user can enable the service.
     */
    fun openAccessibilitySettings(context: Context) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        context.startActivity(intent)
    }

    /**
     * Check if the app has notification permission (Android 13+).
     * For older versions, this always returns true.
     */
    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.POST_NOTIFICATIONS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        } else {
            true // Not required on older versions
        }
    }

    /**
     * Show a dialog to request Usage Stats permission.
     */
    fun requestUsageStatsPermissionDialog(context: Context) {
        AlertDialog.Builder(context)
            .setTitle("Usage Stats Permission Required")
            .setMessage("AttentionOS needs access to your app usage data to track distracted scrolling.\n\nYou'll be taken to Settings to enable this permission.")
            .setPositiveButton("Open Settings") { _, _ ->
                openUsageStatsSettings(context)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    /**
     * Show a dialog to request Accessibility permission.
     */
    fun requestAccessibilityPermissionDialog(context: Context) {
        AlertDialog.Builder(context)
            .setTitle("Accessibility Permission Required")
            .setMessage("AttentionOS needs Accessibility permission to detect scroll events.\n\nYou'll be taken to Settings to enable this permission.")
            .setPositiveButton("Open Settings") { _, _ ->
                openAccessibilitySettings(context)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    /**
     * Show a dialog requesting all missing permissions.
     * Returns true if any permission was missing and dialog was shown.
     */
    fun requestAllMissingPermissionsDialog(context: Context): Boolean {
        // Validate context
        if (context == null) {
            Log.w("PermissionHelper", "Cannot show dialog: context is null")
            return false
        }
        
        val missingPermissions = mutableListOf<Pair<String, () -> Unit>>()
        
        if (!hasUsageStatsPermission(context)) {
            missingPermissions.add("Usage Stats" to { openUsageStatsSettings(context) })
        }
        if (!hasAccessibilityPermission(context, "com.attentionos.accessibility.ScrollDetectionAccessibilityService")) {
            missingPermissions.add("Accessibility" to { openAccessibilitySettings(context) })
        }
        if (!hasNotificationPermission(context)) {
            missingPermissions.add("Notifications" to { openNotificationSettings(context) })
        }

        if (missingPermissions.isEmpty()) {
            return false // All permissions granted
        }

        val permissionNames = missingPermissions.map { it.first }
        val message = buildString {
            appendLine("AttentionOS needs the following permissions to work properly:\n")
            permissionNames.forEach { perm ->
                appendLine("• $perm")
            }
            appendLine("\nYou'll be taken to Settings to enable these permissions.")
        }

        try {
            AlertDialog.Builder(context)
                .setTitle("Permissions Required")
                .setMessage(message)
                .setPositiveButton("Go to Settings") { _, _ ->
                    // Open first missing permission's settings
                    if (missingPermissions.isNotEmpty()) {
                        missingPermissions[0].second.invoke()
                    }
                }
                .setNegativeButton("Cancel", null)
                .show()
        } catch (e: Exception) {
            Log.e("PermissionHelper", "Error showing permission dialog", e)
            return false
        }

        return true // Dialog was shown
    }

    /**
     * Open the notification settings page.
     */
    fun openNotificationSettings(context: Context) {
        val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        }
        context.startActivity(intent)
    }
}
