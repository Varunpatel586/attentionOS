package com.attentionos.bridge

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.attentionos.overlay.OverlayPermissionHelper
import com.attentionos.overlay.FloatingTimerOverlay

/**
 * React Native bridge module for overlay functionality
 * 
 * Provides methods to:
 * - Check overlay permission status
 * - Request overlay permission
 * - Control floating timer overlay
 */
class OverlayModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "OverlayModule"
    }

    /**
     * Check if overlay permission is granted
     */
    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        try {
            val hasPermission = OverlayPermissionHelper.hasPermission(reactApplicationContext)
            val result = Arguments.createMap()
            result.putBoolean("hasPermission", hasPermission)
            result.putString("status", if (hasPermission) "granted" else "denied")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", "Failed to check overlay permission", e)
        }
    }

    /**
     * Request overlay permission by opening system settings
     */
    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (OverlayPermissionHelper.hasPermission(reactApplicationContext)) {
                // Permission already granted
                val result = Arguments.createMap()
                result.putBoolean("granted", true)
                result.putString("message", "Permission already granted")
                promise.resolve(result)
                return
            }

            // Create intent for permission settings
            val intent = OverlayPermissionHelper.createPermissionIntent(reactApplicationContext)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            // Start the intent
            reactApplicationContext.startActivity(intent)
            
            val result = Arguments.createMap()
            result.putBoolean("granted", false)
            result.putString("message", "Permission request dialog opened")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PERMISSION_REQUEST_ERROR", "Failed to request overlay permission", e)
        }
    }

    /**
     * Show the floating timer overlay
     */
    @ReactMethod
    fun showOverlay(options: ReadableMap?, promise: Promise) {
        try {
            if (!OverlayPermissionHelper.hasPermission(reactApplicationContext)) {
                promise.reject("PERMISSION_DENIED", "Overlay permission not granted")
                return
            }

            val overlay = FloatingTimerOverlay.getInstance()
            overlay.showOverlay(reactApplicationContext)
            
            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putString("message", "Overlay shown successfully")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("OVERLAY_SHOW_ERROR", "Failed to show overlay", e)
        }
    }

    /**
     * Hide the floating timer overlay
     */
    @ReactMethod
    fun hideOverlay(promise: Promise) {
        try {
            val overlay = FloatingTimerOverlay.getInstance()
            overlay.removeOverlay()
            
            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putString("message", "Overlay hidden successfully")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("OVERLAY_HIDE_ERROR", "Failed to hide overlay", e)
        }
    }

    /**
     * Check if overlay is currently visible
     */
    @ReactMethod
    fun isOverlayVisible(promise: Promise) {
        try {
            val overlay = FloatingTimerOverlay.getInstance()
            val isVisible = overlay.isOverlayVisible()
            
            val result = Arguments.createMap()
            result.putBoolean("visible", isVisible)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("OVERLAY_STATUS_ERROR", "Failed to check overlay status", e)
        }
    }

    /**
     * Update the overlay timer with specific seconds
     */
    @ReactMethod
    fun updateOverlayTimer(seconds: Double, promise: Promise) {
        try {
            val overlay = FloatingTimerOverlay.getInstance()
            overlay.updateTimer(seconds.toLong())
            
            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putString("message", "Timer updated successfully")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("TIMER_UPDATE_ERROR", "Failed to update overlay timer", e)
        }
    }

    /**
     * Get overlay permission status for debugging
     */
    @ReactMethod
    fun getPermissionInfo(promise: Promise) {
        try {
            val hasPermission = OverlayPermissionHelper.hasPermission(reactApplicationContext)
            val shouldShowRationale = OverlayPermissionHelper.shouldShowRationale()
            
            val result = Arguments.createMap()
            result.putBoolean("hasPermission", hasPermission)
            result.putBoolean("shouldShowRationale", shouldShowRationale)
            result.putString("status", if (hasPermission) "granted" else "denied")
            result.putString("platform", "Android")
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PERMISSION_INFO_ERROR", "Failed to get permission info", e)
        }
    }
}
