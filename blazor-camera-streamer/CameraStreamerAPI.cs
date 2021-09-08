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
    /// Communication logic between ts/js script and cs script
    /// </summary>
    public class CameraStreamerAPI
    {
        internal readonly IJSRuntime JSRuntime;
        private IJSObjectReference JSObject;

        internal CameraStreamerAPI(IJSRuntime runtime)
        {
            JSRuntime = runtime;
        }

        public async Task InitializeAsync()
        {
            JSObject = await JSRuntime.InvokeAsync<IJSObjectReference>("BlazorCameraStreamer.Scripts.CameraStreamerInterop.CreateInstance");
        }
    }
}
