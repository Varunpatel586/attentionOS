package com.attentionos.overlay

/**
 * Helper object for timer formatting utilities
 */
object TimerFormatter {
    
    /**
     * Format seconds as MM:SS string
     * 
     * @param seconds Total seconds to format
     * @return Formatted time string (e.g., "01:24", "05:41")
     */
    fun formatTime(seconds: Long): String {
        val minutes = seconds / 60
        val remainingSeconds = seconds % 60
        return String.format("%02d:%02d", minutes, remainingSeconds)
    }
    
    /**
     * Format seconds as HH:MM:SS string
     * 
     * @param seconds Total seconds to format
     * @return Formatted time string (e.g., "01:05:24")
     */
    fun formatTimeWithHours(seconds: Long): String {
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val remainingSeconds = seconds % 60
        return String.format("%02d:%02d:%02d", hours, minutes, remainingSeconds)
    }
    
    /**
     * Format seconds in a human-readable format
     * 
     * @param seconds Total seconds to format
     * @return Human readable format (e.g., "1m 24s", "5m 41s", "1h 5m")
     */
    fun formatHumanReadable(seconds: Long): String {
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val remainingSeconds = seconds % 60
        
        return when {
            hours > 0 -> "${hours}h ${minutes}m"
            minutes > 0 -> "${minutes}m ${remainingSeconds}s"
            else -> "${remainingSeconds}s"
        }
    }
    
    /**
     * Get seconds from formatted MM:SS string
     * 
     * @param timeString Time string in "MM:SS" format
     * @return Total seconds
     */
    fun parseTime(timeString: String): Long {
        return try {
            val parts = timeString.split(":")
            if (parts.size == 2) {
                val minutes = parts[0].toLongOrNull() ?: 0L
                val seconds = parts[1].toLongOrNull() ?: 0L
                minutes * 60 + seconds
            } else {
                0L
            }
        } catch (e: Exception) {
            0L
        }
    }
}
