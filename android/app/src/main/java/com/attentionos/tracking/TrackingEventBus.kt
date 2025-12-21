object TrackingEventBus {

    private var scrollListener: ((String, Long) -> Unit)? = null

    fun registerScrollListener(listener: (String, Long) -> Unit) {
        scrollListener = listener
    }

    fun onScrollDetected(packageName: String, timestamp: Long) {
        scrollListener?.invoke(packageName, timestamp)
    }
}
