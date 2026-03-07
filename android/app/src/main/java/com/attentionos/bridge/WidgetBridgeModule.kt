package com.attentionos.bridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeArray
import com.attentionos.service.WidgetUpdateService
import com.attentionos.utils.ReactNativeEventEmitter

class WidgetBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        // Initialize the event emitter with the React context
        ReactNativeEventEmitter.initialize(reactContext)
    }

    override fun getName(): String {
        return "WidgetBridge"
    }

    @ReactMethod
    fun updateFocusScroll(focusSeconds: Double, scrollSeconds: Double, promise: Promise) {
        try {
            WidgetUpdateService.updateFocusScroll(
                reactApplicationContext,
                focusSeconds.toLong(),
                scrollSeconds.toLong()
            )
            promise.resolve("Widget data updated successfully")
        } catch (e: Exception) {
            promise.reject("WIDGET_UPDATE_ERROR", "Failed to update focus/scroll data: ${e.message}")
        }
    }

    @ReactMethod
    fun updateTasks(tasks: ReadableArray, promise: Promise) {
        try {
            android.util.Log.d("WidgetBridge", "📝 updateTasks called with ${tasks.size()} tasks")
            val tasksList = mutableListOf<Map<String, Any>>()
            
            for (i in 0 until tasks.size()) {
                val task = tasks.getMap(i)
                if (task != null) {
                    val taskMap = mutableMapOf<String, Any>()
                    
                    if (task.hasKey("title")) {
                        taskMap["title"] = task.getString("title") ?: ""
                    }
                    if (task.hasKey("done")) {
                        taskMap["done"] = task.getBoolean("done")
                    }
                    if (task.hasKey("id")) {
                        taskMap["id"] = task.getString("id") ?: ""
                    }
                    
                    tasksList.add(taskMap)
                    android.util.Log.d("WidgetBridge", "Task $i: ${taskMap["title"]}")
                }
            }
            
            android.util.Log.d("WidgetBridge", "Sending ${tasksList.size} tasks to WidgetUpdateService")
            WidgetUpdateService.updateTasks(reactApplicationContext, tasksList)
            promise.resolve("Tasks updated successfully")
        } catch (e: Exception) {
            android.util.Log.e("WidgetBridge", "Error updating tasks", e)
            promise.reject("WIDGET_UPDATE_ERROR", "Failed to update tasks: ${e.message}")
        }
    }

    @ReactMethod
    fun updateTimer(seconds: Double, running: Boolean, promise: Promise) {
        try {
            android.util.Log.d("WidgetBridge", "⏰ updateTimer called: $seconds seconds, running: $running")
            WidgetUpdateService.updateTimer(
                reactApplicationContext,
                seconds.toLong(),
                running
            )
            promise.resolve("Timer updated successfully")
        } catch (e: Exception) {
            android.util.Log.e("WidgetBridge", "Error updating timer", e)
            promise.reject("WIDGET_UPDATE_ERROR", "Failed to update timer: ${e.message}")
        }
    }

    @ReactMethod
    fun refreshWidgets(promise: Promise) {
        try {
            WidgetUpdateService.refreshAllWidgets(reactApplicationContext)
            promise.resolve("All widgets refreshed successfully")
        } catch (e: Exception) {
            promise.reject("WIDGET_UPDATE_ERROR", "Failed to refresh widgets: ${e.message}")
        }
    }

    @ReactMethod
    fun getWidgetData(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("widget_data", 0)
            val data = com.facebook.react.bridge.Arguments.createMap()
            
            // Focus and scroll times
            data.putDouble("focusTime", prefs.getLong("focusTime", 0L).toDouble())
            data.putDouble("scrollTime", prefs.getLong("scrollTime", 0L).toDouble())
            
            // Timer data
            data.putDouble("timerSeconds", prefs.getLong("timerSeconds", 0L).toDouble())
            data.putBoolean("timerRunning", prefs.getBoolean("timerRunning", false))
            
            // Tasks data
            val tasksJson = prefs.getString("tasks", "[]") ?: "[]"
            try {
                val tasksArray = org.json.JSONArray(tasksJson)
                val tasks = WritableNativeArray()
                
                for (i in 0 until tasksArray.length()) {
                    val task = tasksArray.getJSONObject(i)
                    val taskMap = com.facebook.react.bridge.Arguments.createMap()
                    
                    taskMap.putString("title", task.optString("title", ""))
                    taskMap.putBoolean("done", task.optBoolean("done", false))
                    taskMap.putString("id", task.optString("id", ""))
                    
                    tasks.pushMap(taskMap)
                }
                
                data.putArray("tasks", tasks)
            } catch (e: org.json.JSONException) {
                // If JSON parsing fails, return empty array
                data.putArray("tasks", WritableNativeArray())
            }
            
            promise.resolve(data)
        } catch (e: Exception) {
            promise.reject("WIDGET_DATA_ERROR", "Failed to get widget data: ${e.message}")
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for event emitter interface
    }

    @ReactMethod
    fun removeListeners(count: Integer) {
        // Required for event emitter interface
    }
}
