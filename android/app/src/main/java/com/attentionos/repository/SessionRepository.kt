package com.attentionos.repository

import com.attentionos.database.AppDatabase
import com.attentionos.database.AppSession
import com.attentionos.database.SessionDao
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Calendar

/**
 * Repository for accessing app session data.
 * Provides a clean API for the service and native module layers.
 * All operations are async using Kotlin coroutines.
 */
class SessionRepository(private val sessionDao: SessionDao) {

    /**
     * Insert a new session into the database.
     * @return The ID of the inserted session
     */
    suspend fun insertSession(session: AppSession): Long {
        return withContext(Dispatchers.IO) {
            sessionDao.insertSession(session)
        }
    }

    /**
     * Get total distracted scrolling time for today.
     * @return Total milliseconds spent in distracted scrolling today
     */
    suspend fun getTodayDistractedTime(): Long {
        return withContext(Dispatchers.IO) {
            val todayStart = getTodayStartMillis()
            sessionDao.getTodayDistractedTimeMillis(todayStart) ?: 0L
        }
    }

    /**
     * Get total distracted scrolling time for this week (past 7 days).
     * @return Total milliseconds spent in distracted scrolling this week
     */
    suspend fun getWeeklyDistractedTime(): Long {
        return withContext(Dispatchers.IO) {
            val weekStart = getWeekStartMillis()
            sessionDao.getWeeklyDistractedTimeMillis(weekStart) ?: 0L
        }
    }

    /**
     * Get all sessions for today (for debugging/analytics).
     * @return List of all sessions from today
     */
    suspend fun getSessionsForToday(): List<AppSession> {
        return withContext(Dispatchers.IO) {
            val todayStart = getTodayStartMillis()
            sessionDao.getSessionsForToday(todayStart)
        }
    }

    /**
     * Get all sessions for this week (for debugging/analytics).
     * @return List of all sessions from the past 7 days
     */
    suspend fun getSessionsForWeek(): List<AppSession> {
        return withContext(Dispatchers.IO) {
            val weekStart = getWeekStartMillis()
            sessionDao.getSessionsForWeek(weekStart)
        }
    }

    /**
     * Delete sessions older than the specified number of days.
     * @param daysToKeep Number of days of data to retain
     * @return Number of sessions deleted
     */
    suspend fun deleteOldSessions(daysToKeep: Int = 30): Int {
        return withContext(Dispatchers.IO) {
            val cutoffTime = System.currentTimeMillis() - (daysToKeep * 24 * 60 * 60 * 1000L)
            sessionDao.deleteOldSessions(cutoffTime)
        }
    }

    /**
     * Get timestamp for today's midnight (00:00:00).
     */
    private fun getTodayStartMillis(): Long {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }

    /**
     * Get timestamp for 7 days ago.
     */
    private fun getWeekStartMillis(): Long {
        return System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000L)
    }

    companion object {
        @Volatile
        private var INSTANCE: SessionRepository? = null

        /**
         * Get the singleton repository instance.
         */
        fun getInstance(database: AppDatabase): SessionRepository {
            return INSTANCE ?: synchronized(this) {
                val instance = SessionRepository(database.sessionDao())
                INSTANCE = instance
                instance
            }
        }
    }
}
