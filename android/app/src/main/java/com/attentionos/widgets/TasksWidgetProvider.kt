package com.attentionos.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.attentionos.MainActivity
import com.attentionos.R
import org.json.JSONArray

class TasksWidgetProvider : AppWidgetProvider() {

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
        
        if (intent.action == ACTION_UPDATE_WIDGET) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                ComponentName(context, TasksWidgetProvider::class.java)
            )
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        private const val ACTION_UPDATE_WIDGET = "com.attentionos.UPDATE_TASKS_WIDGET"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_tasks)

            // Get tasks from SharedPreferences
            val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
            val tasksJson = prefs.getString("tasks", "[]") ?: "[]"
            
            try {
                val tasksArray = JSONArray(tasksJson)
                val tasks = mutableListOf<String>()
                
                for (i in 0 until minOf(3, tasksArray.length())) {
                    val task = tasksArray.getJSONObject(i)
                    tasks.add(task.optString("title", ""))
                }

                // Update task views
                if (tasks.isNotEmpty()) {
                    views.setTextViewText(R.id.task1Text, tasks[0])
                    views.setViewVisibility(R.id.task1Row, android.view.View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.task1Row, android.view.View.GONE)
                }

                if (tasks.size > 1) {
                    views.setTextViewText(R.id.task2Text, tasks[1])
                    views.setViewVisibility(R.id.task2Row, android.view.View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.task2Row, android.view.View.GONE)
                }

                if (tasks.size > 2) {
                    views.setTextViewText(R.id.task3Text, tasks[2])
                    views.setViewVisibility(R.id.task3Row, android.view.View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.task3Row, android.view.View.GONE)
                }

            } catch (e: Exception) {
                // Handle JSON parsing error
                views.setViewVisibility(R.id.task1Row, android.view.View.GONE)
                views.setViewVisibility(R.id.task2Row, android.view.View.GONE)
                views.setViewVisibility(R.id.task3Row, android.view.View.GONE)
            }

            // Set click intent to open app to todo screen
            val intent = Intent(context, MainActivity::class.java).apply {
                putExtra("screen", "todos")
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.tasksContainer, pendingIntent)

            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun triggerUpdate(context: Context) {
            val intent = Intent(ACTION_UPDATE_WIDGET)
            context.sendBroadcast(intent)
        }
    }
}
