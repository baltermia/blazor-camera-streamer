namespace BlazorCameraStreamer
{
    /// <summary>
    /// Represents the MediaDeviceInfo interface from Typescript
    /// </summary>
    public class MediaDeviceInfo
    {
        /// <summary>
        /// Unique ID of the device
        /// </summary>
        public string DeviceId { get; set; }

        /// <summary>
        /// Name of the device
        /// </summary>
        public string Label { get; set; }
    }
}
