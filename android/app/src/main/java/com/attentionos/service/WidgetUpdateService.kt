package com.attentionos.service

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.IBinder
import android.util.Log
import com.attentionos.widgets.FocusScrollWidgetProvider
import com.attentionos.widgets.FocusScrollSmallWidgetProvider
import com.attentionos.widgets.TasksWidgetProvider
import com.attentionos.widgets.TimerWidgetProvider
import org.json.JSONArray

class WidgetUpdateService : Service() {

    private lateinit var sharedPreferences: SharedPreferences

    override fun onCreate() {
        super.onCreate()
        sharedPreferences = getSharedPreferences("widget_data", Context.MODE_PRIVATE)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_UPDATE_FOCUS_SCROLL -> {
                val focusSeconds = intent.getLongExtra("focusSeconds", 0L)
                val scrollSeconds = intent.getLongExtra("scrollSeconds", 0L)
                updateFocusScrollData(focusSeconds, scrollSeconds)
            }
            ACTION_UPDATE_TASKS -> {
                val tasksJson = intent.getStringExtra("tasks") ?: "[]"
                updateTasksData(tasksJson)
            }
            ACTION_UPDATE_TIMER -> {
                val seconds = intent.getLongExtra("seconds", 0L)
                val running = intent.getBooleanExtra("running", false)
                updateTimerData(seconds, running)
            }
            ACTION_REFRESH_ALL -> {
                refreshAllWidgets()
            }
        }
        
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun updateFocusScrollData(focusSeconds: Long, scrollSeconds: Long) {
        sharedPreferences.edit()
            .putLong("focusTime", focusSeconds)
            .putLong("scrollTime", scrollSeconds)
            .apply()

        // Trigger widget updates
        FocusScrollWidgetProvider.triggerUpdate(this)
        FocusScrollSmallWidgetProvider.triggerUpdate(this)
        
        Log.d(TAG, "Updated focus/scroll data: focus=$focusSeconds, scroll=$scrollSeconds")
    }

    private fun updateTasksData(tasksJson: String) {
        sharedPreferences.edit()
            .putString("tasks", tasksJson)
            .apply()

        // Trigger widget update
        TasksWidgetProvider.triggerUpdate(this)
        
        Log.d(TAG, "Updated tasks data: $tasksJson")
    }

    private fun updateTimerData(seconds: Long, running: Boolean) {
        sharedPreferences.edit()
            .putLong("timerSeconds", seconds)
            .putBoolean("timerRunning", running)
            .apply()

        // Trigger widget update
        TimerWidgetProvider.triggerUpdate(this)
        
        Log.d(TAG, "Updated timer data: seconds=$seconds, running=$running")
    }

    private fun refreshAllWidgets() {
        FocusScrollWidgetProvider.triggerUpdate(this)
        FocusScrollSmallWidgetProvider.triggerUpdate(this)
        TasksWidgetProvider.triggerUpdate(this)
        TimerWidgetProvider.triggerUpdate(this)
        
        Log.d(TAG, "Refreshed all widgets")
    }

    companion object {
        private const val TAG = "WidgetUpdateService"
        
        const val ACTION_UPDATE_FOCUS_SCROLL = "com.attentionos.UPDATE_FOCUS_SCROLL"
        const val ACTION_UPDATE_TASKS = "com.attentionos.UPDATE_TASKS"
        const val ACTION_UPDATE_TIMER = "com.attentionos.UPDATE_TIMER"
        const val ACTION_REFRESH_ALL = "com.attentionos.REFRESH_ALL_WIDGETS"

        fun updateFocusScroll(context: Context, focusSeconds: Long, scrollSeconds: Long) {
            val intent = Intent(context, WidgetUpdateService::class.java).apply {
                action = ACTION_UPDATE_FOCUS_SCROLL
                putExtra("focusSeconds", focusSeconds)
                putExtra("scrollSeconds", scrollSeconds)
            }
            context.startService(intent)
        }

        fun updateTasks(context: Context, tasks: List<Map<String, Any>>) {
            val tasksJson = JSONArray(tasks).toString()
            val intent = Intent(context, WidgetUpdateService::class.java).apply {
                action = ACTION_UPDATE_TASKS
                putExtra("tasks", tasksJson)
            }
            context.startService(intent)
        }

        fun updateTimer(context: Context, seconds: Long, running: Boolean) {
            val intent = Intent(context, WidgetUpdateService::class.java).apply {
                action = ACTION_UPDATE_TIMER
                putExtra("seconds", seconds)
                putExtra("running", running)
            }
            context.startService(intent)
        }

        fun refreshAllWidgets(context: Context) {
            val intent = Intent(context, WidgetUpdateService::class.java).apply {
                action = ACTION_REFRESH_ALL
            }
            context.startService(intent)
        }
    }
}
