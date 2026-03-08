package com.attentionos

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  private val timerControlReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      when (intent?.action) {
        "com.attentionos.TIMER_PAUSE" -> {
          sendTimerEvent("timerPause")
        }
        "com.attentionos.TIMER_RESUME" -> {
          sendTimerEvent("timerResume")
        }
        "com.attentionos.TIMER_RESET" -> {
          sendTimerEvent("timerReset")
        }
      }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Register timer control receiver
    val filter = IntentFilter().apply {
      addAction("com.attentionos.TIMER_PAUSE")
      addAction("com.attentionos.TIMER_RESUME")
      addAction("com.attentionos.TIMER_RESET")
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(timerControlReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(timerControlReceiver, filter)
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    unregisterReceiver(timerControlReceiver)
  }

  private fun getCurrentReactContext(): ReactContext? {
    val app = application as? ReactApplication ?: return null
    return app.reactNativeHost.reactInstanceManager.currentReactContext
  }

  private fun sendTimerEvent(eventName: String) {
    try {
      val context = getCurrentReactContext()
      if (context != null) {
        context
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit(eventName, null)
        return
      }

      val app = application as? ReactApplication ?: return
      val instanceManager = app.reactNativeHost.reactInstanceManager
      val listener = object : ReactInstanceEventListener {
        override fun onReactContextInitialized(reactContext: ReactContext) {
          reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, null)
          instanceManager.removeReactInstanceEventListener(this)
        }
      }
      instanceManager.addReactInstanceEventListener(listener)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AttentionOS"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
