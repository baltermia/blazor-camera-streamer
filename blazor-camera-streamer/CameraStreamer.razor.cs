using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace BlazorCameraStreamer
{
    public partial class CameraStreamer
    {
        [Inject]
        private IJSRuntime JSRuntime { get; set; }

        protected ElementReference VideoRef { get; set; }

        protected CameraStreamerAPI streamerApi;

        protected override void OnInitialized()
        {
            streamerApi = new CameraStreamerAPI(JSRuntime);

            base.OnInitialized();
        }
    }
}
