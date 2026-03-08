package com.attentionos.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.attentionos.tracking.SessionClassifier

/**
 * AccessibilityService for detecting scroll events and touch interactions.
 * 
 * PRIVACY & COMPLIANCE:
 * - This service ONLY listens to scroll and touch events
 * - It does NOT read UI text, content, or node structure
 * - It does NOT identify specific UI elements (e.g., which Reel is being viewed)
 * - It does NOT capture screenshots or record the screen
 * - All processing is on-device
 * 
 * This service is used solely for detecting continuous scrolling behavior
 * in distraction apps with full user consent.
 */
class ScrollDetectionAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ScrollAccessibility"
        
        // Broadcast action constants
        const val ACTION_SCROLL_EVENT = "com.attentionos.SCROLL_EVENT"
        const val ACTION_INTERACTION_START = "com.attentionos.INTERACTION_START"
        const val ACTION_INTERACTION_END = "com.attentionos.INTERACTION_END"
        
        // Intent extra keys
        const val EXTRA_PACKAGE_NAME = "packageName"
        const val EXTRA_TIMESTAMP = "timestamp"
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "ScrollDetectionAccessibilityService connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val packageName = event.packageName?.toString() ?: return

        // Only process events from distraction apps
        if (!SessionClassifier.isDistractionApp(packageName)) {
            return
        }

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                    val deltaX = kotlin.math.abs(event.scrollDeltaX)
                    val deltaY = kotlin.math.abs(event.scrollDeltaY)

                    // 1. FILTER PROGRAMMATIC SCROLLS (App Launch / Loading)
                    // If pixels didn't actually move, it's a fake layout event, not a human swipe!
                    if (deltaX == 0 && deltaY == 0) {
                        Log.v(TAG, "👻 Ignored zero-pixel layout scroll in $packageName")
                        return
                    }

                    // 2. FILTER HORIZONTAL SCROLLS (Photo Carousels)
                    // If X movement is greater than Y, it's a horizontal swipe
                    if (deltaX > deltaY) {
                        Log.v(TAG, "⏭️ Ignored horizontal swipe in $packageName")
                        return
                    }
                }
                
                // It is a real, physical vertical scroll (Reels/Shorts) -> Handle it
                handleScrollEvent(packageName)
            }
            AccessibilityEvent.TYPE_TOUCH_INTERACTION_START -> {
                handleInteractionStart(packageName)
            }
            AccessibilityEvent.TYPE_TOUCH_INTERACTION_END -> {
                handleInteractionEnd(packageName)
            }
        }
    }

    /**
     * Handle vertical scroll event (Reels/Shorts).
     * Now simplified since filtering is done by pixel deltas.
     */
    private fun handleScrollEvent(packageName: String) {
        val currentTime = System.currentTimeMillis()
        
        Log.d(TAG, "↕️ Vertical scroll detected in $packageName")
        
        // Broadcast scroll event to TrackingForegroundService
        val intent = Intent(ACTION_SCROLL_EVENT).apply {
            putExtra(EXTRA_PACKAGE_NAME, packageName)
            putExtra(EXTRA_TIMESTAMP, currentTime)
        }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }

    /**
     * Handle interaction start event.
     */
    private fun handleInteractionStart(packageName: String) {
        Log.d(TAG, "Interaction started in $packageName")
        
        val intent = Intent(ACTION_INTERACTION_START).apply {
            putExtra(EXTRA_PACKAGE_NAME, packageName)
            putExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())
        }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }

    /**
     * Handle interaction end event.
     */
    private fun handleInteractionEnd(packageName: String) {
        Log.d(TAG, "Interaction ended in $packageName")
        
        val intent = Intent(ACTION_INTERACTION_END).apply {
            putExtra(EXTRA_PACKAGE_NAME, packageName)
            putExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())
        }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }

    override fun onInterrupt() {
        Log.w(TAG, "ScrollDetectionAccessibilityService interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "ScrollDetectionAccessibilityService destroyed")
    }
}
