package com.attentionos.overlay

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log

/**
 * Helper class for managing SYSTEM_ALERT_WINDOW permission
 */
object OverlayPermissionHelper {
    
    private const val TAG = "OverlayPermissionHelper"
    
    /**
     * Check if overlay permission is granted
     */
    fun hasPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true // Permission granted by default on older versions
        }
    }
    
    /**
     * Request overlay permission by opening system settings
     */
    fun requestPermission(activity: Activity, requestCode: Int = 1001) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${activity.packageName}")
            )
            activity.startActivityForResult(intent, requestCode)
        }
    }
    
    /**
     * Create intent for requesting overlay permission
     */
    fun createPermissionIntent(context: Context): Intent {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            )
        } else {
            // On older versions, just open app settings
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${context.packageName}")
            }
        }
    }
    
    /**
     * Check if we should show permission rationale
     */
    fun shouldShowRationale(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
    }
    
    /**
     * Log permission status for debugging
     */
    fun logPermissionStatus(context: Context) {
        val hasPermission = hasPermission(context)
        Log.i(TAG, "Overlay permission status: $hasPermission")
        
        if (!hasPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Log.w(TAG, "Overlay permission not granted. User needs to enable it in Settings.")
        }
    }
}
