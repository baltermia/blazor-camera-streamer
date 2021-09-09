using BlazorCameraStreamer.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace BlazorCameraStreamer
{
    /// <summary>
    /// Communication logic between ts/js and c#
    /// </summary>
    public class CameraStreamerAPI : IAsyncDisposable
    {
        public const string JS_STATIC = "BlazorCameraStreamer.Scripts.CameraStreamerInterop";
        public readonly IJSRuntime JSRuntime;

        private IJSObjectReference JSObject;
        public bool IsInitialized { get; private set; } = false;

        internal CameraStreamerAPI(IJSRuntime runtime)
        {
            JSRuntime = runtime;
        }

        public async Task InitializeAsync()
        {
            if (IsInitialized)
            {
                await DisposeAsync();
            }

            JSObject = await JSRuntime.InvokeAsync<IJSObjectReference>(JS_STATIC + ".createInstance");

            IsInitialized = true;
        }

        public async ValueTask DisposeAsync()
        {
            if (IsInitialized)
            {
                await JSObject.InvokeVoidAsync("dispose");
            }
        }

        public static async Task<IEnumerable<MediaDeviceInfo>> GetCameraDevicesAsync(IJSRuntime runtime)
        {
            return await runtime.InvokeAsync<MediaDeviceInfo[]>(JS_STATIC + ".getCameraDeviceList");
        }

        public async Task<IEnumerable<MediaDeviceInfo>> GetCameraDevicesAsync()
        {
            return await GetCameraDevicesAsync(JSRuntime);
        }
    }
}
