package com.attentionos.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

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
            // Send a broadcast that will be picked up by the React Native app
            val intent = Intent("com.attentionos.TIMER_EVENT").apply {
                putExtra("eventName", eventName)
            }
            context.sendBroadcast(intent)
            Log.d(TAG, "Timer event broadcast sent: $eventName")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send timer event", e)
        }
    }

    companion object {
        private const val TAG = "TimerControlReceiver"
    }
}
