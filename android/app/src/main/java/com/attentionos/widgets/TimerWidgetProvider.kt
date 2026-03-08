package com.attentionos.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import com.attentionos.MainActivity
import com.attentionos.R

class TimerWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        when (intent.action) {
            ACTION_UPDATE_WIDGET -> {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(
                    ComponentName(context, TimerWidgetProvider::class.java)
                )
                onUpdate(context, appWidgetManager, appWidgetIds)
            }
            ACTION_TIMER_PAUSE -> {
                // Send broadcast to app to pause timer
                val timerIntent = Intent("com.attentionos.TIMER_PAUSE")
                context.sendBroadcast(timerIntent)
            }
            ACTION_TIMER_RESUME -> {
                // Send broadcast to app to resume timer
                val timerIntent = Intent("com.attentionos.TIMER_RESUME")
                context.sendBroadcast(timerIntent)
            }
            ACTION_TIMER_RESET -> {
                // Send broadcast to app to reset timer
                val timerIntent = Intent("com.attentionos.TIMER_RESET")
                context.sendBroadcast(timerIntent)
            }
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }

    companion object {
        const val ACTION_UPDATE_WIDGET = "com.attentionos.UPDATE_TIMER_WIDGET"
        const val ACTION_TIMER_PAUSE = "com.attentionos.TIMER_PAUSE"
        const val ACTION_TIMER_RESUME = "com.attentionos.TIMER_RESUME"
        const val ACTION_TIMER_RESET = "com.attentionos.TIMER_RESET"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_timer)

            // Get timer data from SharedPreferences
            val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
            val timerSeconds = prefs.getLong("timerSeconds", 0L)
            val timerRunning = prefs.getBoolean("timerRunning", false)

            // Format timer display
            val timerText = formatTimer(timerSeconds)
            views.setTextViewText(R.id.timerDisplay, timerText)
            
            android.util.Log.d("TimerWidget", "Timer updated: $timerSeconds seconds, running: $timerRunning, display: $timerText")

            // Set up button intents
            val pauseIntent = Intent(context, TimerWidgetProvider::class.java).apply {
                action = ACTION_TIMER_PAUSE
            }
            val pausePendingIntent = PendingIntent.getBroadcast(
                context, 0, pauseIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.pauseButton, pausePendingIntent)

            val resumeIntent = Intent(context, TimerWidgetProvider::class.java).apply {
                action = ACTION_TIMER_RESUME
            }
            val resumePendingIntent = PendingIntent.getBroadcast(
                context, 1, resumeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.resumeButton, resumePendingIntent)

            val resetIntent = Intent(context, TimerWidgetProvider::class.java).apply {
                action = ACTION_TIMER_RESET
            }
            val resetPendingIntent = PendingIntent.getBroadcast(
                context, 2, resetIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.resetButton, resetPendingIntent)

            // Set click intent on timer display to open app
            val appIntent = Intent(context, MainActivity::class.java).apply {
                putExtra("screen", "timer")
            }
            val appPendingIntent = PendingIntent.getActivity(
                context, 3, appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.timerDisplay, appPendingIntent)

            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun formatTimer(seconds: Long): String {
            val minutes = seconds / 60
            val remainingSeconds = seconds % 60
            return "${minutes}m ${remainingSeconds}s"
        }

        fun triggerUpdate(context: Context) {
            val intent = Intent(ACTION_UPDATE_WIDGET)
            context.sendBroadcast(intent)
        }
    }
}
