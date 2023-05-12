# 📷 BlazorCameraStreamer

[![Nuget](https://img.shields.io/nuget/v/BlazorCameraStreamer?style=flat-square)](https://www.nuget.org/packages/BlazorCameraStreamer/)
[![BlazorCameraStreamer](https://img.shields.io/nuget/dt/BlazorCameraStreamer.svg?style=flat-square)](https://www.nuget.org/packages/BlazorCameraStreamer/)
![Build Status](https://img.shields.io/github/actions/workflow/status/baltermia/blazor-camera-streamer/dotnet.yml?style=flat-square)

A Blazor Component library that adds a simple to use camera-streaming functionality which you can use with C#.

## Features
  - Stream cameras in a html `<video>` element
  - Retrieve each frame of the stream on a callback
  - Get a list of all avaliable cameras
  - Ask the user for access to cameras
  - Get the currently streamed frame

 The library works only with video-devices, there's no support for audio devices (at least for now)

 💡 Want a new feature to be implemented, or you found/have any issues?  Create a [new Issue](https://github.com/baltermia/blazor-cookies/issues/new/choose).
  
## Examples
Implementations of the library can be found in the following projects:
  - [BlazorCameraStreamer.Demo.WASM](https://github.com/baltermia/blazor-camera-streamer/tree/main/BlazorCameraStreamer.Demo.WASM) - Blazor Webassembly
  - [BlazorCameraStreamer.Demo.Serverside](https://github.com/baltermia/blazor-camera-streamer/tree/main/BlazorCameraStreamer.Demo.Serverside) - Blazor Server

## Browser Support
The component works both on Serverside and WASM Blazor.

## Installation Guide

### Download and install the nuget package

Open the command line and go into the directoy where your .csproj file is located, then execute this command:
```
dotnet add package BlazorCameraStreamer
```

Or add it in the GUI of Visual Studio 20XX:  
`Tools` -> `Nuget Package Manager` -> `Manage Nuget Packages for Solution...`

### Reference the script in your project
Then add the following \<script\> tag in your project:
```html
<script src="_content/BlazorCameraStreamer/js/CameraStreamer.js"></script>
```
Depending on your type of project, the file you have to add this is either
  - `wwwroot\index.html` - Webassembly
  - `Pages\_Host.cshtml` - Serverside

It doesn't really matter if you add the tag in the `<head>` or `<body>` block.

If you're unsure on where to put it, look it up in the [Examples](#examples) listed above.

### Serverside Image-Size Restriction

**⚠️ This step is crucial if you want to use the CameraStreamer on ServerSide Blazor ⚠️**

The data from the JavaScript-Interop is sent through SignalR to the Server, where your C# Code handles the received data. SignalR has a image cap of 32KB (which is tiny, smaller than 150x150 pixels).

This restriction can be bypassed though. In your `[ProjectName].Startup.ConfigureServices` method, change the following line:

```csharp
services.AddServerSideBlazor()
        .AddHubOptions(o => o.MaximumReceiveMessageSize = 100_000_000); // add this
```

The `MaximumReceiveMessageSize` value indicates the maximum allowed number of bytes that can be sent through SignalR. It could also be set to `long.MaxValue`, to entirely max out the restriction. 

100'000'000 has no significant meaning, it's just a general cap. As an example, a 3-Channel 8-Bit 1920x1080 image has the following size: `3 * 1920 * 1080 = 6'220'800 Bytes` (this calculation does not take image-compression into account).

**⚠️ BlazorCameraStreamer can be used in ServerSide Blazor. In general though, it is not recommended to use on ServerSide, since a lot of data is sent through SignalR which can cause network delays. There is a reason, why Microsoft set the default limit to only 32KB. ⚠️**

## How to use

There are lots of ways to use the `CameraStreamer` component. All features should be well-documented in the code, so you should have no issues with finding out what each features does.

A implementation of the component can be as simple as this:
```html
<CameraStreamer Autostart />
```
The component automatically selects the first avaliable camera and uses it for the stream. The `Autostart` parameter lets the stream start every time the component is loaded. 

---
If you want a to use most of the features of the component, it would look more like this:

### Code
```html
<CameraStreamer @ref="CameraStreamerReference"
                Width="1920"
                Height="1080"
                OnRendered="OnRenderedHandler"
                OnFrame="OnFrameHandler"
                Style="width: 480px; height: 270px;"
                CameraID="@cameraId"
                Autostart />
```

And here's the C# code:
```csharp
CameraStreamer CameraStreamerReference;

string cameraId = null;

private async void OnRenderedHandler()
{
    // Check camera-access or ask user, if it's not allowed currently
    if (await CameraStreamerReference.GetCameraAccessAsync())
    {
        // Reloading re-initializes the stream and starts the
        // stream automatically if the Autostart parameter is set
        await CameraStreamerReference.ReloadAsync();

        // If Autostart is not set, you have to manually start the stream again
        /* await CameraStreamerReference.StartAsync(); */
    }
}

private void OnFrameHandler(string data)
{
    // Remove the suffix added by javascript
    data = data[(data.IndexOf(',') + 1)..];

    // Convert the base64 string to a System.Drawing.Bitmap
    Bitmap bmp = new(new MemoryStream(Convert.FromBase64String(data)));

    // Do something with the bitmap
}
```

### Explanation
**Width and Height**

These two parameters specify the resolution of the stream - NOT the display size on the site. The standard size is set to 360p/nHD (640x360).


**OnRendered**

As soon as the component is completely rendered, this callback is invoked - although only on the first render of the instance (so a reload will definitely fire it again).

**OnFrame**

This is one of the key features of the component that other similar components lack. On each Frame of the stream, this callback is invoked with the base64 string of the image. You can easily convert this data to a `System.Drawing.Bitmap` by using the following code (keep in my that you need to have the `System.Drawing.Common` package install):
```csharp
Bitmap bmp = new(new MemoryStream(Convert.FromBase64String(data)));
```
You can then do anything with this `Bitmap` object. E.g. use the object to decode barcodes. 

**Style (Id & Class)**

The component also supports the standard `Style`, `Id` and `Class` parameters. They are applied directly on the `<video>` element in the component (the only element the component has) so they should function very well.

In the code above I use the `Style` parameter to set the display size of the stream.

**CameraID**

This is the deviceId that is used by default if no other id is specified (otherwise the deviceId is given as a parameter with the `StartAsync()` method.

**Autostart**

This parameter starts the stream on Reload automatically. This is either triggered when the component is rendered or the `ReloadAsync()` method is called.

---

If you dont want to use the `OnFrame`-Callback, you can receive frames individually by calling the `GetCurrentFrameAsync`-Method:

```csharp
string imageData = await CameraStreamerReference.GetCurrentFrameAsync();
```
