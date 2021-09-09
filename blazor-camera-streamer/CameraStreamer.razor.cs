using BlazorCameraStreamer.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BlazorCameraStreamer
{
    public partial class CameraStreamer
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
        public EventCallback<string> OnFrame { get; set; }

        protected ElementReference VideoRef { get; set; }

        protected CameraStreamerAPI streamerApi;

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                streamerApi = new CameraStreamerAPI(JSRuntime);

                await ReloadAsync();
            }

            await base.OnAfterRenderAsync(firstRender);
        }

        public async Task ReloadAsync()
        {
            await streamerApi.InitializeAsync();
        }

        public async Task<IEnumerable<MediaDeviceInfo>> GetMediaDeviceInfoAsync() => await streamerApi.GetCameraDevicesAsync();
    }
}
