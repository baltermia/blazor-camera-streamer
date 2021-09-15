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
        /// Callback that is invoked on each new frame of the stream
        /// </summary>
        [Parameter]
        public EventCallback<string> OnFrame { get; set; }

        /// <summary>
        /// Callback that is called after the first complete render of the component
        /// </summary>
        [Parameter]
        public EventCallback OnRendered { get; set; }

        /// <summary>
        /// Default camera-deviceId to use if no other is specified
        /// </summary>
        [Parameter]
        public string CameraID { get; set; } = null;

        /// <summary>
        /// States if the stream should automatically start on initialization (render) and reload
        /// </summary>
        [Parameter]
        public bool Autostart { get; set; } = false;

        private ElementReference VideoRef { get; set; }

        private CameraStreamerController streamerApi;

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
            await streamerApi.InitializeAsync(VideoRef, Width, Height, OnFrame);

            if (Autostart)
                await StartAsync();
        }

        public async Task StartAsync(string camera = null) => 
            await streamerApi.StartAsync(camera ?? CameraID);

        public async Task StopAsync() => 
            await streamerApi.StopAsync();

        public async Task ChangeCameraAsync(string newId) => 
            await streamerApi.ChangeCameraAsync(CameraID = newId);

        public async Task<bool> GetCameraAccessAsync() =>
             await streamerApi.GetCameraAccessAsync();

        public async Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync() =>
            await streamerApi.GetCameraDevicesAsync();

        public async ValueTask DisposeAsync() => 
            // Check null for streamerApi as otherwise a exception is thrown on page-refresh
            await (streamerApi?.DisposeAsync() ?? ValueTask.CompletedTask);
    }
}
