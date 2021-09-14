using System.Threading.Tasks;

namespace BlazorCameraStreamer.Models
{
    /// <summary>
    /// This interface is used to simulate multiple inheritance
    /// </summary>
    public interface ICameraStreamerModel
    {
        /// <summary>
        /// Starts the camera stream
        /// </summary>
        /// <param name="camera">DeviceID of the camera, if left empty the first camera found will be used</param>
        public Task StartAsync(string camera = null);

        /// <summary>
        /// Stops the camera stream
        /// </summary>
        public Task StopAsync();

        /// <summary>
        /// Changes the current camera that is being used as streaming device
        /// </summary>
        public Task ChangeCameraAsync(string newId);

        /// <summary>
        /// Returns whether the program has access to the camera (and asks for access by default)
        /// </summary>
        /// <param name="ask">Whether the method should ask for access if the access is currently denied (defualt is true)</param>
        public Task<bool> GetCameraAccessAsync(bool ask = true);

        /// <summary>
        /// Gets all camera devices (no audio) as MediaDeviceInfo and returns them as an array
        /// </summary>
        /// <returns>An array of all cameras as MediaDeviceInfo</returns>
        public Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync();
    }
}