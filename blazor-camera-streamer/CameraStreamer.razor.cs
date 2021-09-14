using BlazorCameraStreamer.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace BlazorCameraStreamer
{
    public partial class CameraStreamer : ICameraStreamerModel // ICameraStreamerModel interface is used to simulate mutliple inheritance, as CameraStreamer already extends ComponentBase by default
    {
        [Inject]
        private IJSRuntime JSRuntime { get; set; }

        [Parameter]
        public string Style { get; set; } = string.Empty;

        [Parameter]
        public string Id { get; set; } = string.Empty;

        [Parameter]
        public string Class { get; set; } = string.Empty;

        [Parameter]
        public int Width { get; set; } = 480;

        [Parameter]
        public int Height { get; set; } = 270;

        [Parameter]
        public EventCallback<string> OnFrame { get; set; }

        protected ElementReference VideoRef { get; set; }

        protected CameraStreamerController streamerApi;

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                streamerApi = new CameraStreamerController(JSRuntime);

                await LoadAsync();
            }

            await base.OnAfterRenderAsync(firstRender);
        }

        public async Task LoadAsync()
        {
            await streamerApi.InitializeAsync(VideoRef, Width, Height);
        }

        public async Task StartAsync(string camera) => await streamerApi.StartAsync(camera);

        public async Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync() => await streamerApi.GetCameraDevicesAsync();

        public async Task StopAsync() => await streamerApi.StopAsync();

        public Task ChangeCameraAsync(string newId) => streamerApi.ChangeCameraAsync(newId);

        public Task<bool> GetCameraAccessAsync(bool ask = true) => streamerApi.GetCameraAccessAsync(ask);
    }
}
