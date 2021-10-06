# BlazorCameraStreamer
  
[![Nuget](https://img.shields.io/nuget/v/BlazorCameraStreamer?style=flat-square)](https://www.nuget.org/packages/BlazorCameraStreamer/)
[![BlazorCameraStreamer](https://img.shields.io/nuget/dt/BlazorCameraStreamer.svg?style=flat-square)](https://www.nuget.org/packages/BlazorCameraStreamer/)
[![CodeFactor](https://img.shields.io/codefactor/grade/github/speyck/blazor-camera-streamer?style=flat-square)](https://www.codefactor.io/repository/github/speyck/barcodereader)
[![Build Status](https://img.shields.io/travis/speyck/blazor-camera-streamer.svg?branch=main&style=flat-square)](https://app.travis-ci.com/speyck/blazor-camera-streamer)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/speyck/blazor-camera-streamer?style=flat-square)](https://codeclimate.com/github/speyck/blazor-camera-streamer)
[![Total alerts](https://img.shields.io/lgtm/alerts/github/speyck/blazor-camera-streamer?style=flat-square)](https://lgtm.com/projects/g/speyck/blazor-camera-streamer/alerts/)

A Blazor Component library that adds a simple to use camera-streaming functionality which you can use with C#.

## Features
  - Stream cameras in a html `<video>` element
  - Retrieve each frame of the stream on a callback
  - Get a list of all avaliable cameras
  - Ask the user for access to cameras

 The library works only with video-devices, there's no support for audio devices (at least for now)
  
## Examples
Implementations of the library can be found in the following projects:
  - [blazor-camera-streamer.Demo](https://github.com/speyck/blazor-camera-streamer/tree/main/blazor-camera-streamer.Demo) (this repo) - Blazor Webassembly
  - [speyck/blazor-antdesign-test](https://github.com/speyck/blazor-antdesign-test) - Serverside Blazor

## Browser Support
The component currently only works on Blazor Serverside due to a bug. Webassembly will be supported asap.

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
    // Remove the suffix added by javascriot
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
You can then do anything with this `Bitmap` object. E.g. in the [speyck/blazor-antdesign-test](https://github.com/speyck/blazor-antdesign-test) project listed in the [Examples](#examples) above uses the object to decode barcodes. 

**Style (Id & Class)**

The component also supports the standard `Style`, `Id` and `Class` parameters. They are applied directly on the `<video>` element in the component (the only element the component has) so they should function very well.

In the code above I use the `Style` parameter to set the display size of the stream.

**CameraID**

This is the deviceId that is used by default if no other id is specified (otherwise the deviceId is given as a parameter with the `StartAsync()` method.

**Autostart**

This parameter starts the stream on Reload automatically. This is either triggered when the component is rendered or the `ReloadAsync()` method is called.

---

The C# code is explained in the code itself so there's no further explanation needed.

## Finish

I think that should sum it up pretty well.

If you have any question, feature requests or anything else related to the project feel free to contact me anytime. I'm very keen on this project and want to maintain it for a long time.

 
