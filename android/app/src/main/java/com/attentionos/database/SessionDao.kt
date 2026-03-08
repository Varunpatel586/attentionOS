package com.attentionos.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

/**
 * Room DAO for accessing app session data.
 * All queries are executed on background threads via coroutines.
 */
@Dao
interface SessionDao {

    /**
     * Insert a new session into the database.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertSession(session: AppSession): Long

    /**
     * Get all sessions that started today (since midnight).
     * @param todayStartMillis Timestamp of today's midnight (00:00:00)
     * @return List of sessions from today
     */
    @Query("SELECT * FROM app_sessions WHERE startTime >= :todayStartMillis ORDER BY startTime DESC")
    fun getSessionsForToday(todayStartMillis: Long): List<AppSession>

    /**
     * Get all sessions from the past 7 days.
     * @param weekStartMillis Timestamp of 7 days ago
     * @return List of sessions from the past week
     */
    @Query("SELECT * FROM app_sessions WHERE startTime >= :weekStartMillis ORDER BY startTime DESC")
    fun getSessionsForWeek(weekStartMillis: Long): List<AppSession>

    /**
     * Get all sessions (for debugging/admin purposes).
     * @return All sessions in the database
     */
    @Query("SELECT * FROM app_sessions ORDER BY startTime DESC")
    fun getAllSessions(): List<AppSession>

    /**
     * Delete sessions older than a specified timestamp (for data retention).
     * @param beforeTimestamp Delete all sessions that ended before this timestamp
     * @return Number of sessions deleted
     */
    @Query("DELETE FROM app_sessions WHERE endTime < :beforeTimestamp")
    fun deleteOldSessions(beforeTimestamp: Long): Int

    /**
     * Delete all sessions from today.
     * @param todayStartMillis Timestamp of today's midnight (00:00:00)
     * @return Number of sessions deleted
     */
    @Query("DELETE FROM app_sessions WHERE startTime >= :todayStartMillis")
    fun deleteTodaySessions(todayStartMillis: Long): Int

    /**
     * Get the sum of duration for all DISTRACTED sessions today.
     * @param todayStartMillis Timestamp of today's midnight
     * @return Total distracted time in milliseconds (0 if no sessions)
     */
    @Query("SELECT COALESCE(SUM(durationMillis), 0) FROM app_sessions WHERE classification = 'DISTRACTED' AND startTime >= :todayStartMillis")
    fun getTodayDistractedTimeMillis(todayStartMillis: Long): Long

    /**
     * Get the sum of duration for all DISTRACTED sessions this week.
     * @param weekStartMillis Timestamp of 7 days ago
     * @return Total distracted time in milliseconds (0 if no sessions)
     */
    @Query("SELECT COALESCE(SUM(durationMillis), 0) FROM app_sessions WHERE classification = 'DISTRACTED' AND startTime >= :weekStartMillis")
    fun getWeeklyDistractedTimeMillis(weekStartMillis: Long): Long
}
