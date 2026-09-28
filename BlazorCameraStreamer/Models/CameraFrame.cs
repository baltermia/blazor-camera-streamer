namespace BlazorCameraStreamer
{
    /// <summary>
    /// A captured frame of the camera stream
    /// </summary>
    public class CameraFrame
    {
        /// <summary>
        /// The encoded image (e.g. the bytes of a png or jpeg file)
        /// </summary>
        public byte[] Data { get; init; }

        /// <summary>
        /// The actual type of the image (e.g. "image/jpeg"). Can differ from the requested format, as browsers fall back to "image/png" if a format isn't supported
        /// </summary>
        public string ContentType { get; init; }

        /// <summary>
        /// Width of the image in pixels
        /// </summary>
        public int Width { get; init; }

        /// <summary>
        /// Height of the image in pixels
        /// </summary>
        public int Height { get; init; }
    }
}
