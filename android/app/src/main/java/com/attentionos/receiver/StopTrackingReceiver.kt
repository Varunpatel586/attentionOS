package com.attentionos.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.attentionos.service.TrackingForegroundService
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class StopTrackingReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != ACTION_STOP_TRACKING) return

        Log.i(TAG, "StopTrackingReceiver: stop action received")

        // Stop the foreground tracking service
        TrackingForegroundService.stop(context)

        // Update Firebase activeMode -> scroll (and disable tracking)
        try {
            val user = FirebaseAuth.getInstance().currentUser
            if (user == null) {
                Log.w(TAG, "No Firebase user signed in; skipping Firestore update")
                return
            }

            FirebaseFirestore.getInstance()
                .collection("users")
                .document(user.uid)
                .update(
                    mapOf(
                        "activeMode" to "scroll",
                        "trackingEnabled" to false
                    )
                )
                .addOnSuccessListener {
                    Log.i(TAG, "Firestore updated: activeMode=scroll, trackingEnabled=false")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to update Firestore on stop tracking", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating Firestore on stop tracking", e)
        }
    }

    companion object {
        private const val TAG = "StopTrackingReceiver"
        const val ACTION_STOP_TRACKING = "com.attentionos.ACTION_STOP_TRACKING"
    }
}
