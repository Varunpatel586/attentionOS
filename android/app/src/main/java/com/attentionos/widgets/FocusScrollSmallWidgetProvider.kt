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

class FocusScrollSmallWidgetProvider : AppWidgetProvider() {

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
                ComponentName(context, FocusScrollSmallWidgetProvider::class.java)
            )
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        private const val ACTION_UPDATE_WIDGET = "com.attentionos.UPDATE_FOCUS_SCROLL_SMALL_WIDGET"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_focus_scroll_small)

            // Get widget data from SharedPreferences
            val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
            val focusSeconds = prefs.getLong("focusTime", 0L)
            val scrollSeconds = prefs.getLong("scrollTime", 0L)

            // Format time display
            val focusTimeText = formatTime(focusSeconds)
            val scrollTimeText = formatTime(scrollSeconds)

            // Update views
            views.setTextViewText(R.id.focusTimeValue, focusTimeText)
            views.setTextViewText(R.id.scrollTimeValue, scrollTimeText)

            // Set click intent to open app
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.focusTimeValue, pendingIntent)
            views.setOnClickPendingIntent(R.id.scrollTimeValue, pendingIntent)

            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun formatTime(seconds: Long): String {
            val hours = seconds / 3600
            val minutes = (seconds % 3600) / 60
            return if (hours > 0) {
                "${hours}h ${minutes}m"
            } else {
                "${minutes}m"
            }
        }

        fun triggerUpdate(context: Context) {
            val intent = Intent(ACTION_UPDATE_WIDGET)
            context.sendBroadcast(intent)
        }
    }
}
