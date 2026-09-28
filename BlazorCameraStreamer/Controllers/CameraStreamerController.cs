using BlazorCameraStreamer.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace BlazorCameraStreamer
{
    /// <summary>
    /// Communication logic between ts/js and c#
    /// </summary>
    public class CameraStreamerController : ICameraStreamerModel
    {
        /// <summary>
        /// Path that can be used to access the static methods in the CameraStreamer typescript file
        /// </summary>
        private const string StaticInteropPath = "BlazorCameraStreamer.Scripts.CameraStreamerInterop";

        /// <summary>
        /// Runtime used to use javascript interopability
        /// </summary>
        private readonly IJSRuntime JSRuntime;
        
        /// <summary>
        /// Typescript CameraStreamer object
        /// </summary>
        private IJSObjectReference JSObject;

        /// <summary>
        /// Reference to this object which is passed to typescript (used for the OnFrame callback)
        /// </summary>
        private DotNetObjectReference<CameraStreamerController> DotNetReference;

        /// <summary>
        /// States if the object has been initialized already
        /// </summary>
        public bool IsInitialized { get; private set; } = false;

        /// <summary>
        /// Is called on each frame of the camera stream with a base64 string of the image
        /// </summary>
        private EventCallback<string> OnFrameCallback;

        /// <summary>
        /// Preferred direction of the camera, used if no camera is given when starting the stream
        /// </summary>
        private CameraFacingMode? FacingMode;

        /// <summary>
        /// Is called on each frame of the camera stream with the binary data of the image
        /// </summary>
        private EventCallback<CameraFrame> OnFrameDataCallback;

        /// <summary>
        /// Creates a new instance of the CameraStreamerController class
        /// </summary>
        /// <param name="runtime">Runtime used for javascript interopability</param>
        public CameraStreamerController(IJSRuntime runtime)
        {
            JSRuntime = runtime;
        }

        /// <summary>
        /// Initializes the typescript object with the provided parameters
        /// </summary>
        /// <param name="videoReference"></param>
        /// <param name="width"></param>
        /// <param name="height"></param>
        /// <param name="onFrameCallback"></param>
        /// <param name="facingMode">Preferred direction of the camera, used if no camera is given when starting the stream</param>
        /// <param name="onFrameDataCallback">Is called on each frame of the camera stream with the binary data of the image</param>
        /// <param name="frameRate">Maximum number of frames per second for the frame callbacks (null for no limit)</param>
        /// <param name="frameFormat">Image format of the captured frames</param>
        /// <param name="frameQuality">Quality of the captured frames between 0 and 1, only used for <see cref="CameraFrameFormat.Jpeg"/> and <see cref="CameraFrameFormat.Webp"/> (null for the browser default)</param>
        /// <returns></returns>
        public async Task InitializeAsync(ElementReference videoReference, int width = 640, int height = 360, EventCallback<string> onFrameCallback = default, CameraFacingMode? facingMode = null,
            EventCallback<CameraFrame> onFrameDataCallback = default, double? frameRate = null, CameraFrameFormat frameFormat = CameraFrameFormat.Png, double? frameQuality = null)
        {
            if (IsInitialized)
            {
                await DisposeAsync();
            }

            OnFrameCallback = onFrameCallback;
            OnFrameDataCallback = onFrameDataCallback;
            FacingMode = facingMode;

            JSObject = await JSRuntime.InvokeAsync<IJSObjectReference>(StaticInteropPath + ".createInstance");

            DotNetReference = DotNetObjectReference.Create(this);

            // The facing mode is passed as lowercase string, as used by the MediaStream API (e.g. "environment")
            await JSObject.InvokeVoidAsync("init", videoReference, OnFrameCallback.HasDelegate, DotNetReference, nameof(OnFrame), width, height, FacingMode?.ToString().ToLowerInvariant(),
                OnFrameDataCallback.HasDelegate ? nameof(OnFrameData) : null, frameRate, GetContentType(frameFormat), frameQuality);

            IsInitialized = true;
        }

        /// <inheritdoc/>
        public async Task StartAsync(string camera = null)
        {
            // Use the first found camera if no camrea is given (if a facing mode is set, the browser chooses the camera based on it instead)
            if (string.IsNullOrEmpty(camera) && FacingMode is null)
                camera = (await GetCameraDevicesAsync()).FirstOrDefault()?.DeviceId;

            // Completes when the stream is started. No timeout, as the user might have to allow the camera access first (serverside, calls are cancelled after one minute by default)
            await JSObject.InvokeVoidAsync("start", CancellationToken.None, camera);
        }

        /// <inheritdoc/>
        public async Task StopAsync()
        {
            await JSObject.InvokeVoidAsync("stop");
        }

        /// <inheritdoc/>
        public async Task ChangeCameraAsync(string newId)
        {
            await JSObject.InvokeVoidAsync("changeCamera", CancellationToken.None, newId);
        }

        /// <inheritdoc/>
        public async Task<bool> GetCameraAccessAsync()
        {
            // No timeout, as the user might take a while to allow the camera access
            return await JSRuntime.InvokeAsync<bool>(StaticInteropPath + ".getCameraAccess", CancellationToken.None);
        }

        /// <inheritdoc/>
        public async Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync()
        {
            return await GetCameraDevicesAsync(JSRuntime);
        }

        /// <inheritdoc/>
        public async ValueTask DisposeAsync()
        {
            if (IsInitialized && JSObject != null)
            {
                try
                {
                    await JSObject.InvokeVoidAsync("dispose");

                    await JSObject.DisposeAsync();
                }
                catch (JSDisconnectedException)
                {
                    // Serverside: The circuit is already disconnected (e.g. the tab was closed), so there's nothing left to release in the browser
                }
            }

            // Release the reference, otherwise this object can't be garbage collected
            DotNetReference?.Dispose();
            DotNetReference = null;
        }

        /// <inheritdoc/>
        public ValueTask<string> GetCurrentFrameAsync()
        {
            return JSObject.InvokeAsync<string>("getCurrentFrame");
        }

        /// <summary>
        /// Gets all camera devices (no audio) as MediaDeviceInfo and returns them as an array
        /// </summary>
        /// <returns>An array of all cameras as MediaDeviceInfo</returns>
        public static async Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync(IJSRuntime runtime)
        {
            return await runtime.InvokeAsync<MediaDeviceInfoModel[]>(StaticInteropPath + ".getCameraDeviceList");
        }

        /// <summary>
        /// Invokable method from javascript/typescript that calls the given callback method
        /// </summary>
        /// <param name="data">Base64 string of the image</param>
        [JSInvokable]
        public async Task OnFrame(string data)
        {
            if (OnFrameCallback.HasDelegate)
                await OnFrameCallback.InvokeAsync(data);
        }

        /// <summary>
        /// Invokable method from javascript/typescript that calls the given callback method with the binary data of the frame
        /// </summary>
        /// <param name="data">The encoded image</param>
        /// <param name="contentType">The actual type of the image (e.g. "image/jpeg")</param>
        /// <param name="width">Width of the image in pixels</param>
        /// <param name="height">Height of the image in pixels</param>
        [JSInvokable]
        public async Task OnFrameData(byte[] data, string contentType, int width, int height)
        {
            if (OnFrameDataCallback.HasDelegate)
                await OnFrameDataCallback.InvokeAsync(new CameraFrame { Data = data, ContentType = contentType, Width = width, Height = height });
        }

        /// <summary>
        /// Gets the content type of the given format, as used by the browser (e.g. "image/jpeg")
        /// </summary>
        private static string GetContentType(CameraFrameFormat format) => format switch
        {
            CameraFrameFormat.Jpeg => "image/jpeg",
            CameraFrameFormat.Webp => "image/webp",
            _ => "image/png"
        };
    }
}
