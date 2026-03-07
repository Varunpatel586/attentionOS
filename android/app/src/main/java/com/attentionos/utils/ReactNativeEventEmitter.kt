package com.attentionos.utils

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Utility class for emitting events to React Native from native code.
 * This provides a singleton that can be used to emit events from anywhere in the native code.
 */
object ReactNativeEventEmitter {
    private var reactContext: ReactApplicationContext? = null
    private const val TAG = "ReactNativeEventEmitter"

    /**
     * Initialize with a ReactApplicationContext.
     * This should be called from a native module during initialization.
     */
    fun initialize(context: ReactApplicationContext) {
        reactContext = context
        Log.d(TAG, "Initialized with ReactApplicationContext")
    }

    /**
     * Emit an event to React Native
     */
    fun emit(eventName: String, params: Any? = null) {
        try {
            if (reactContext == null) {
                Log.w(TAG, "ReactApplicationContext not initialized. Event '$eventName' not emitted.")
                return
            }

            reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, params)
            
            Log.d(TAG, "Event emitted: $eventName")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit event '$eventName'", e)
        }
    }
}
