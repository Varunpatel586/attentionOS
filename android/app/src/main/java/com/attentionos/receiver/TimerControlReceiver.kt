package com.attentionos.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class TimerControlReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            "com.attentionos.TIMER_PAUSE" -> {
                sendTimerEvent(context, "timerPause")
                Log.d(TAG, "Timer pause event received")
            }
            "com.attentionos.TIMER_RESUME" -> {
                sendTimerEvent(context, "timerResume")
                Log.d(TAG, "Timer resume event received")
            }
            "com.attentionos.TIMER_RESET" -> {
                sendTimerEvent(context, "timerReset")
                Log.d(TAG, "Timer reset event received")
            }
        }
    }

    private fun sendTimerEvent(context: Context, eventName: String) {
        try {
            // Try to get React context and emit event
            val reactContext = getReactContext(context)
            if (reactContext != null) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, null)
            } else {
                Log.w(TAG, "React context not available for timer event")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send timer event", e)
        }
    }

    private fun getReactContext(context: Context): ReactApplicationContext? {
        // Try to get React context from application
        return try {
            val application = context.applicationContext
            if (application is com.attentionos.MainApplication) {
                // This would need to be implemented in MainApplication to expose React context
                null // For now, return null - this would need proper implementation
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        private const val TAG = "TimerControlReceiver"
    }
}
