package com.attentionos.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import androidx.localbroadcastmanager.content.LocalBroadcastManager

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
 * This service is used solely for detecting continuous scrolling behavior in distraction apps with
 * full user consent.
 */
class ScrollDetectionAccessibilityService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "ScrollDetectionAccessibilityService connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val packageName = event.packageName?.toString() ?: return

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                Log.i(TAG, "📜 SCROLL_DETECTED from $packageName")
                handleScrollEvent(packageName)
            }
            AccessibilityEvent.TYPE_GESTURE_DETECTION_START -> {
                Log.i(TAG, "👆 GESTURE_START from $packageName")
                handleInteractionStart(packageName)
            }
            AccessibilityEvent.TYPE_GESTURE_DETECTION_END -> {
                Log.i(TAG, "✋ GESTURE_END from $packageName")
                handleInteractionEnd(packageName)
            }
        }
    }

    /**
     * Handle scroll event by broadcasting to the tracking service. We do NOT inspect the event
     * details or node structure.
     */
    private fun handleScrollEvent(packageName: String) {
        val intent =
                Intent(ACTION_SCROLL_EVENT).apply {
                    putExtra(EXTRA_PACKAGE_NAME, packageName)
                    putExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())
                }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }

    /** Handle interaction start event. */
    private fun handleInteractionStart(packageName: String) {
        Log.d(TAG, "Interaction started in $packageName")

        val intent =
                Intent(ACTION_INTERACTION_START).apply {
                    putExtra(EXTRA_PACKAGE_NAME, packageName)
                    putExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())
                }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }

    /** Handle interaction end event. */
    private fun handleInteractionEnd(packageName: String) {
        Log.d(TAG, "Interaction ended in $packageName")

        val intent =
                Intent(ACTION_INTERACTION_END).apply {
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

    companion object {
        private const val TAG = "ScrollAccessibility"

        // Broadcast action constants
        const val ACTION_SCROLL_EVENT = "com.attentionos.SCROLL_EVENT"
        const val ACTION_INTERACTION_START = "com.attentionos.INTERACTION_START"
        const val ACTION_INTERACTION_END = "com.attentionos.INTERACTION_END"

        // Intent extra keys
        const val EXTRA_PACKAGE_NAME = "package_name"
        const val EXTRA_TIMESTAMP = "timestamp"
    }
}
