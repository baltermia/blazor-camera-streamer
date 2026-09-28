namespace BlazorCameraStreamer
{
    /// <summary>
    /// Image format of the captured frames
    /// </summary>
    public enum CameraFrameFormat
    {
        /// <summary>
        /// Lossless, but slow to encode and large (image/png)
        /// </summary>
        Png,

        /// <summary>
        /// Lossy, fast to encode and small (image/jpeg)
        /// </summary>
        Jpeg,

        /// <summary>
        /// Lossy and small (image/webp). Browsers that can't encode webp fall back to png
        /// </summary>
        Webp
    }
}
