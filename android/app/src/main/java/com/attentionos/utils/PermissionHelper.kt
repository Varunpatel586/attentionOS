package com.attentionos.utils

import android.app.AlertDialog
import android.app.AppOpsManager
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import androidx.core.content.ContextCompat

/**
 * Utility class for checking and requesting permissions required by AttentionOS.
 * Handles both standard and special permissions (Usage Stats, Accessibility).
 * Shows native dialogs to request permissions from the user.
 */
object PermissionHelper {

    private fun runOnUiThread(activity: Activity, block: () -> Unit) {
        if (activity.isFinishing) return
        activity.runOnUiThread {
            if (activity.isFinishing) return@runOnUiThread
            block()
        }
    }

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
     * Show a dialog requesting Accessibility permission.
     * The dialog allows the user to directly open accessibility settings.
     */
    fun showAccessibilityPermissionDialog(activity: Activity) {
        runOnUiThread(activity) {
            AlertDialog.Builder(activity)
                .setTitle("Enable Tracking")
                .setMessage(
                    "AttentionOS needs Accessibility Service permission to detect scrolling behavior in apps like Instagram and YouTube.\n\n" +
                    "We do NOT read your messages, posts, or any personal content. We ONLY detect scroll events.\n\n" +
                    "Please enable 'AttentionOS' in Accessibility Settings to continue."
                )
                .setPositiveButton("Open Settings") { _, _ ->
                    openAccessibilitySettings(activity)
                }
                .setNegativeButton("Cancel") { dialog, _ ->
                    dialog.dismiss()
                }
                .setIcon(android.R.drawable.ic_dialog_info)
                .show()
        }
    }

    /**
     * Show a dialog requesting Usage Stats permission.
     * The dialog allows the user to directly open usage stats settings.
     */
    fun showUsageStatsPermissionDialog(activity: Activity) {
        runOnUiThread(activity) {
            AlertDialog.Builder(activity)
                .setTitle("Enable Usage Stats Access")
                .setMessage(
                    "AttentionOS needs access to usage stats to detect which app is currently open. " +
                    "This is required for tracking distracted scrolling.\n\n" +
                    "Please grant 'AttentionOS' permission to access usage stats."
                )
                .setPositiveButton("Open Settings") { _, _ ->
                    openUsageStatsSettings(activity)
                }
                .setNegativeButton("Cancel") { dialog, _ ->
                    dialog.dismiss()
                }
                .setIcon(android.R.drawable.ic_dialog_info)
                .show()
        }
    }

    /**
     * Show a dialog requesting both Usage Stats and Accessibility permissions.
     * The dialog allows the user to choose which permission to grant first.
     */
    fun showBothPermissionsDialog(activity: Activity) {
        runOnUiThread(activity) {
            AlertDialog.Builder(activity)
                .setTitle("Permissions Required")
                .setMessage(
                    "AttentionOS requires two permissions to track distracted scrolling:\n\n" +
                    "1. Accessibility Service - to detect scrolling behavior\n" +
                    "2. Usage Stats - to identify which app is open\n\n" +
                    "Which would you like to enable first?"
                )
                .setPositiveButton("Accessibility") { _, _ ->
                    openAccessibilitySettings(activity)
                }
                .setNeutralButton("Usage Stats") { _, _ ->
                    openUsageStatsSettings(activity)
                }
                .setNegativeButton("Cancel") { dialog, _ ->
                    dialog.dismiss()
                }
                .setIcon(android.R.drawable.ic_dialog_info)
                .show()
        }
    }
}
