package com.attentionos.overlay

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.PixelFormat
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.OvalShape
import android.graphics.Color

/**
 * Floating timer overlay that displays a draggable bubble with live scroll timer.
 * 
 * This overlay appears above other apps when the user is scrolling in distraction apps.
 * It shows a circular bubble with a timer displaying the scroll duration.
 */
class FloatingTimerOverlay private constructor() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var timerTextView: TextView? = null
    private var handler: Handler? = null
    private var timerRunnable: Runnable? = null
    private var currentSeconds: Long = 0
    private var isTimerRunning: Boolean = false

    // Dragging state
    private var initialX: Int = 0
    private var initialY: Int = 0
    private var initialTouchX: Float = 0f
    private var initialTouchY: Float = 0f

    companion object {
        // Singleton instance
        @Volatile
        private var INSTANCE: FloatingTimerOverlay? = null
        
        fun getInstance(): FloatingTimerOverlay {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: FloatingTimerOverlay().also { INSTANCE = it }
            }
        }
    }

    /**
     * Check if overlay permission is granted
     */
    fun hasOverlayPermission(context: Context): Boolean {
        return Settings.canDrawOverlays(context)
    }

    /**
     * Show the floating overlay bubble
     */
    @SuppressLint("ClickableViewAccessibility")
    fun showOverlay(context: Context) {
        if (overlayView != null) {
            // Overlay already shown
            return
        }

        if (!hasOverlayPermission(context)) {
            throw SecurityException("SYSTEM_ALERT_WINDOW permission not granted")
        }

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        handler = Handler(Looper.getMainLooper())

        // Create the overlay view programmatically
        overlayView = createBubbleView(context)

        // Set up window layout parameters
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        )

        // Position the overlay
        params.gravity = Gravity.TOP or Gravity.START
        params.x = 100
        params.y = 300

        // Add touch listener for dragging
        overlayView?.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    params.x = initialX + deltaX.toInt()
                    params.y = initialY + deltaY.toInt()
                    windowManager?.updateViewLayout(view, params)
                    true
                }
                else -> false
            }
        }

        // Add the overlay to the window manager
        try {
            windowManager?.addView(overlayView, params)
            startTimer()
        } catch (e: Exception) {
            // Clean up on failure
            removeOverlay()
            throw e
        }
    }

    /**
     * Update the timer display with the given seconds
     */
    fun updateTimer(seconds: Long) {
        currentSeconds = seconds
        timerTextView?.text = formatTimer(seconds)
    }

    /**
     * Remove the floating overlay
     */
    fun removeOverlay() {
        stopTimer()
        
        overlayView?.let { view ->
            try {
                windowManager?.removeView(view)
            } catch (e: Exception) {
                // View might already be removed
            }
        }
        
        overlayView = null
        timerTextView = null
        windowManager = null
        handler = null
        currentSeconds = 0
    }

    /**
     * Check if overlay is currently visible
     */
    fun isOverlayVisible(): Boolean {
        return overlayView != null
    }

    /**
     * Create the bubble view programmatically
     */
    private fun createBubbleView(context: Context): View {
        // Create main container with circular background
        val container = FrameLayout(context).apply {
            // Create circular background
            background = createCircularBackground()
            
            // Set padding
            setPadding(16, 16, 16, 16)
        }

        // Create content layout
        val contentLayout = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        // Create timer icon
        val iconTextView = TextView(context).apply {
            text = "⏱"
            textSize = 16f
            setTextColor(Color.WHITE)
            setPadding(0, 0, 4, 0)
        }

        // Create timer text
        timerTextView = TextView(context).apply {
            text = "00:00"
            textSize = 14f
            setTextColor(Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        // Add views to layout
        contentLayout.addView(iconTextView)
        contentLayout.addView(timerTextView)

        // Add content to container
        container.addView(contentLayout)

        return container
    }

    /**
     * Create circular background drawable
     */
    private fun createCircularBackground(): ShapeDrawable {
        val shape = OvalShape()
        val drawable = ShapeDrawable(shape)
        drawable.paint.color = Color.parseColor("#CC000000") // Semi-transparent black
        return drawable
    }

    /**
     * Start the timer that updates every second
     */
    private fun startTimer() {
        if (isTimerRunning) return
        
        isTimerRunning = true
        handler?.post(object : Runnable {
            override fun run() {
                if (!isTimerRunning || overlayView == null) return
                
                currentSeconds++
                updateTimer(currentSeconds)
                
                // Schedule next update
                handler?.postDelayed(this, 1000)
            }
        })
    }

    /**
     * Stop the timer
     */
    private fun stopTimer() {
        isTimerRunning = false
        timerRunnable?.let { handler?.removeCallbacks(it) }
        timerRunnable = null
    }

    /**
     * Format seconds as MM:SS
     */
    private fun formatTimer(seconds: Long): String {
        val minutes = seconds / 60
        val remainingSeconds = seconds % 60
        return String.format("%02d:%02d", minutes, remainingSeconds)
    }
}
