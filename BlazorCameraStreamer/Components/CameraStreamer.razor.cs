using BlazorCameraStreamer.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace BlazorCameraStreamer
{
    /// <summary>
    /// Logic for streaming a webcam in the browser using typescript/javascript
    /// </summary>
    public partial class CameraStreamer : ICameraStreamerModel // ICameraStreamerModel interface is used to simulate mutliple inheritance (with CameraStreamerController), as CameraStreamer already extends ComponentBase by default
    {
        [Inject]
        private IJSRuntime JSRuntime { get; set; }

        /// <summary>
        /// Styles which are applied on the direct video element
        /// </summary>
        [Parameter]
        public string Style { get; set; } = string.Empty;

        /// <summary>
        /// Id that the video element should recieve
        /// </summary>
        [Parameter]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Class that the video element should recieve
        /// </summary>
        [Parameter]
        public string Class { get; set; } = string.Empty;

        /// <summary>
        /// The width *resolution* of the stream. The images recieved from the OnFrame-Callback will be in this resolution. This does not specifcy the visual width on the site. That should be specified in css
        /// </summary>
        [Parameter]
        public int Width { get; set; } = 640;

        /// <summary>
        /// The height *resolution* of the stream. The images recieved from the OnFrame-Callback will be in this resolution. This does not specifcy the visual height on the site. That should be specified in css
        /// </summary>
        [Parameter]
        public int Height { get; set; } = 360;

        /// <summary>
        /// Callback that is invoked on each new frame of the stream with the image as data-url (e.g. "data:image/png;base64,..."). A new frame is only captured
        /// after the callback of the previous one completed, so frames are skipped if the callback takes longer. See <see cref="FrameRate"/> to limit the frames per second
        /// </summary>
        [Parameter]
        public EventCallback<string> OnFrame { get; set; }

        /// <summary>
        /// Callback that is invoked on each new frame of the stream with the binary data of the image. This is faster than <see cref="OnFrame"/>,
        /// as the image doesn't need to be converted to a base64 string. A new frame is only captured after the callback of the previous one completed
        /// </summary>
        [Parameter]
        public EventCallback<CameraFrame> OnFrameData { get; set; }

        /// <summary>
        /// Maximum number of frames per second for the <see cref="OnFrame"/> and <see cref="OnFrameData"/> callbacks. If not set, every frame of the stream is captured
        /// (as long as the callbacks keep up). Changes are applied on reload
        /// </summary>
        [Parameter]
        public double? FrameRate { get; set; } = null;

        /// <summary>
        /// Image format of the captured frames (used for the frame callbacks and <see cref="GetCurrentFrameAsync"/>). Changes are applied on reload
        /// </summary>
        [Parameter]
        public CameraFrameFormat FrameFormat { get; set; } = CameraFrameFormat.Png;

        /// <summary>
        /// Quality of the captured frames between 0 and 1, only used for <see cref="CameraFrameFormat.Jpeg"/> and <see cref="CameraFrameFormat.Webp"/>.
        /// If not set, the browser default is used (usually 0.92). Changes are applied on reload
        /// </summary>
        [Parameter]
        public double? FrameQuality { get; set; } = null;

        /// <summary>
        /// Callback that is called after the first complete render of the component (and after the stream is started, if <see cref="Autostart"/> is set)
        /// </summary>
        [Parameter]
        public EventCallback OnRendered { get; set; }

        /// <summary>
        /// Default camera-deviceId to use if no other is specified
        /// </summary>
        [Parameter]
        public string CameraID { get; set; } = null;

        /// <summary>
        /// Preferred direction of the camera (e.g. <see cref="CameraFacingMode.Environment"/> for the rear camera of a phone). Only used if no camera-deviceId is specified.
        /// If the device has no camera facing this direction, another camera is used. Changes are applied on reload
        /// </summary>
        [Parameter]
        public CameraFacingMode? FacingMode { get; set; } = null;

        /// <summary>
        /// States if the stream should automatically start on initialization (render) and reload. If the site has no access to the camera yet, the browser asks the user for it.
        /// <see cref="OnRendered"/> is invoked after the stream is started
        /// </summary>
        [Parameter]
        public bool Autostart { get; set; } = false;

        private ElementReference VideoRef { get; set; }

        private CameraStreamerController streamerApi;

        /// <inheritdoc/>
        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                streamerApi = new CameraStreamerController(JSRuntime);

                await ReloadAsync();

                if (OnRendered.HasDelegate)
                    await OnRendered.InvokeAsync(firstRender);
            }

            await base.OnAfterRenderAsync(firstRender);
        }

        /// <summary>
        /// Reloads the CameraStream. The video Element is reinitialized and when specified the stream is started automatically
        /// </summary>
        /// <returns></returns>
        public async Task ReloadAsync()
        {
            await streamerApi.InitializeAsync(VideoRef, Width, Height, OnFrame, FacingMode, OnFrameData, FrameRate, FrameFormat, FrameQuality);

            if (Autostart)
                await StartAsync();
        }

        /// <inheritdoc/>
        public async Task StartAsync(string camera = null) => 
            await streamerApi.StartAsync(camera ?? CameraID);

        /// <inheritdoc/>
        public async Task StopAsync() => 
            await streamerApi.StopAsync();

        /// <inheritdoc/>
        public async Task ChangeCameraAsync(string newId) => 
            await streamerApi.ChangeCameraAsync(CameraID = newId);

        /// <inheritdoc/>
        public async Task<bool> GetCameraAccessAsync() =>
             await streamerApi.GetCameraAccessAsync();

        /// <inheritdoc/>
        public async Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync() =>
            await streamerApi.GetCameraDevicesAsync();

        /// <inheritdoc/>
        public ValueTask<string> GetCurrentFrameAsync() =>
            streamerApi.GetCurrentFrameAsync();

        /// <inheritdoc/>
        public async ValueTask DisposeAsync() => 
            // Check null for streamerApi as otherwise a exception is thrown on page-refresh
            await (streamerApi?.DisposeAsync() ?? ValueTask.CompletedTask);
    }
}
