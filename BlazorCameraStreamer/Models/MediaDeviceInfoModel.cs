namespace BlazorCameraStreamer
{
    /// <summary>
    /// Represents the MediaDeviceInfo interface from Typescript
    /// </summary>
    public class MediaDeviceInfoModel
    {
        /// <summary>
        /// Unique ID of the device
        /// </summary>
        public string DeviceId { get; set; }

        /// <summary>
        /// Name of the device
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Direction the camera is facing (e.g. front or rear camera of a phone). Is null if the browser doesn't report it,
        /// which is usually the case for desktop webcams and in browsers that don't support it (e.g. Firefox)
        /// </summary>
        public CameraFacingMode? FacingMode { get; set; }
    }
}
