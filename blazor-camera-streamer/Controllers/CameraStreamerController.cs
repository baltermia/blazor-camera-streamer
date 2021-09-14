using BlazorCameraStreamer.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace BlazorCameraStreamer
{
    /// <summary>
    /// Communication logic between ts/js and c#
    /// </summary>
    public class CameraStreamerController : ICameraStreamerModel, IAsyncDisposable
    {
        public const string JS_STATIC = "BlazorCameraStreamer.Scripts.CameraStreamerInterop";
        public readonly IJSRuntime JSRuntime;
        
        private IJSObjectReference JSObject;
        public bool IsInitialized { get; private set; } = false;

        internal CameraStreamerController(IJSRuntime runtime)
        {
            JSRuntime = runtime;
        }

        public async Task InitializeAsync(ElementReference videoReference, int width = 480, int height = 270)
        {
            if (IsInitialized)
            {
                await DisposeAsync();
            }

            JSObject = await JSRuntime.InvokeAsync<IJSObjectReference>(JS_STATIC + ".createInstance");

            await JSObject.InvokeVoidAsync("init", videoReference, DotNetObjectReference.Create(this), width, height);

            IsInitialized = true;
        }

        public async Task StartAsync(string camera = null)
        {
            await JSObject.InvokeVoidAsync("start", camera ?? (await GetCameraDevicesAsync()).FirstOrDefault()?.DeviceId);
        }

        public async Task StopAsync()
        {
            await JSObject.InvokeVoidAsync("stop");
        }

        public async Task ChangeCameraAsync(string newId)
        {
            await JSObject.InvokeVoidAsync("changeCamera", newId);
        }

        public async Task<bool> GetCameraAccessAsync(bool ask = true)
        {
            return await JSObject.InvokeAsync<bool>("getCameraAccess", ask);
        }

        public async Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync()
        {
            return await GetCameraDevicesAsync(JSRuntime);
        }

        public async ValueTask DisposeAsync()
        {
            if (IsInitialized)
            {
                await JSObject.InvokeVoidAsync("dispose");
            }
        }

        public static async Task<MediaDeviceInfoModel[]> GetCameraDevicesAsync(IJSRuntime runtime)
        {
            return await runtime.InvokeAsync<MediaDeviceInfoModel[]>(JS_STATIC + ".getCameraDeviceList");
        }
    }
}
