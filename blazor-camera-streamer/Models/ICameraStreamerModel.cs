using System;
using System.Threading.Tasks;

namespace BlazorCameraStreamer.Models
{
    /// <summary>
    /// This interface is used to simulate multiple inheritance
    /// </summary>
    public interface ICameraStreamerModel : IAsyncDisposable
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
        /// Returns whether the site has access to the camera and asks the user for permission if not
        /// </summary>
        /// <returns>Whether the site has access to the camera(s)</returns>
        public Task<bool> GetCameraAccessAsync();

        /// <summary>
        /// Gets all camera devices (no audio) as MediaDeviceInfo and returns them as an array
        /// </summary>
        /// <returns>An array of all cameras as MediaDeviceInfo</returns>
        public Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync();
        
        /// <summary>
        /// Gets the current camera-frame that is streamed
        /// </summary>
        /// <returns>The current frame in the camera</returns>
        public ValueTask<string> GetCurrentFrameAsync();
    }
}