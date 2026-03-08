package com.attentionos.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.attentionos.utils.ReactNativeEventEmitter

class TimerEventReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val eventName = intent.getStringExtra("eventName")
        
        if (eventName != null) {
            // Use the singleton to emit the event
            ReactNativeEventEmitter.emit(eventName)
            Log.d(TAG, "Timer event emitted to React: $eventName")
        }
    }

    companion object {
        private const val TAG = "TimerEventReceiver"
    }
}
