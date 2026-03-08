package com.attentionos.overlay

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.OvalShape
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import android.text.style.StyleSpan
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Floating timer overlay that displays a draggable card with live scroll timer,
 * styled to match the 'Insights' screen aesthetic of AttentionOS.
 */
class FloatingTimerOverlay private constructor() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var timerTextView: TextView? = null // Global reference to the styled text
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
     * Show the floating overlay card
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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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
     * Update the timer display with the given seconds, formatting it with complex styling.
     */
    fun updateTimer(seconds: Long) {
        currentSeconds = seconds
        timerTextView?.text = formatToInsightsString(seconds) // Set the full Spannable text
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
     * Create the card view programmatically to match the AttentionOS style.
     */
    private fun createBubbleView(context: Context): View {
        // Fixed dimensions for a clean card (e.g., wide and rounded)
        val widthInDp = 160f
        val heightInDp = 90f
        val scale = context.resources.displayMetrics.density
        val widthInPx = (widthInDp * scale + 0.5f).toInt()
        val heightInPx = (heightInDp * scale + 0.5f).toInt()

        val container = FrameLayout(context).apply {
            // Use cream card background with rounded corners
            background = createCardBackground()

            // Force dimensions
            layoutParams = ViewGroup.LayoutParams(widthInPx, heightInPx)
            setPadding(16, 12, 16, 12)
        }

        // Vertical content layout for centering
        val contentLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL

            val params = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
            }
            layoutParams = params
        }

        // Single large TextView to hold complex formatted time (numbers + units)
        val infoTextView = TextView(context).apply {
            // Initialize with zero formatted text to reserve space correctly
            text = formatToInsightsString(0)
            textSize = 28f // Large base text size, will be scaled within Spannable
            setTextColor(Color.parseColor("#1A1A1A")) // Dark Gray (like number '7')
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER_HORIZONTAL
        }
        // Update the global reference
        timerTextView = infoTextView

        // Sub-label text view below the large numbers
        val labelTextView = TextView(context).apply {
            text = "SCROLL DURATION"
            textSize = 10f // Smaller sub-label
            setTextColor(Color.parseColor("#7A7A7A")) // Lighter Gray sub-text
            setTypeface(null, Typeface.NORMAL)
            setPadding(0, 4, 0, 0)
            gravity = Gravity.CENTER_HORIZONTAL
        }

        contentLayout.addView(timerTextView)
        contentLayout.addView(labelTextView)

        container.addView(contentLayout)

        return container
    }

    /**
     * Create cream card background drawable with rounded corners.
     */
    private fun createCardBackground(): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 24f // Large rounded corners like the card
            setColor(Color.parseColor("#FFFAF5")) // Cream from the UI
            setStroke(0, Color.TRANSPARENT) // No border
        }
    }

    /**
     * Create the formatted Spannable string for the insights card.
     * Numbers are large and bold, units are smaller and lighter gray.
     * Integrates hours logic.
     */
    private fun formatToInsightsString(seconds: Long): Spanned {
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val remainingSeconds = seconds % 60

        val spannable = SpannableStringBuilder()

        val darkGrayColor = Color.parseColor("#1A1A1A") // Number color
        val lightGrayColor = Color.parseColor("#7A7A7A") // Unit label color
        val unitRelativeSize = 0.5f // Unit text is smaller

        if (hours > 0) {
            spannable.append(hours.toString(), StyleSpan(Typeface.BOLD), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.setSpan(ForegroundColorSpan(darkGrayColor), spannable.length - hours.toString().length, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

            spannable.append("h", StyleSpan(Typeface.NORMAL), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.setSpan(RelativeSizeSpan(unitRelativeSize), spannable.length - 1, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.setSpan(ForegroundColorSpan(lightGrayColor), spannable.length - 1, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.append(" ")
        }

        spannable.append(String.format("%02d", minutes), StyleSpan(Typeface.BOLD), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.setSpan(ForegroundColorSpan(darkGrayColor), spannable.length - 2, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

        spannable.append("m", StyleSpan(Typeface.NORMAL), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.setSpan(RelativeSizeSpan(unitRelativeSize), spannable.length - 1, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.setSpan(ForegroundColorSpan(lightGrayColor), spannable.length - 1, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.append(" ")

        spannable.append(String.format("%02d", remainingSeconds), StyleSpan(Typeface.BOLD), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.setSpan(ForegroundColorSpan(darkGrayColor), spannable.length - 2, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

        spannable.append("s", StyleSpan(Typeface.NORMAL), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.setSpan(RelativeSizeSpan(unitRelativeSize), spannable.length - 1, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.setSpan(ForegroundColorSpan(lightGrayColor), spannable.length - 1, spannable.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

        return spannable
    }

    /**
     * Start the timer display (no independent counting)
     */
    private fun startTimer() {
        if (isTimerRunning) return

        isTimerRunning = true
        // Timer is now controlled externally - no independent counting
    }

    /**
     * Stop the timer display
     */
    private fun stopTimer() {
        isTimerRunning = false
        // No independent timer to clean up - controlled externally
    }
}