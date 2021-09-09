var BlazorCameraStreamer;
(function (BlazorCameraStreamer) {
    var Scripts;
    (function (Scripts) {
        /**
         * This class is designed to work with Microsoft.JSInterop in C# Blazor and helps streaming a camera on a canvas
         */
        var CameraStreamerInterop = /** @class */ (function () {
            function CameraStreamerInterop() {
            }
            /**
             * Returns a new instance of the CameraStreamerInterop class
             */
            CameraStreamerInterop.createInstance = function () {
                return new CameraStreamerInterop();
            };
            /**
             * Checks if the site has access to the camera
             * @param ask wether the method should ask the user if he wants to grant access if the access is currently denied
             * @returns whether the site can access the camera
             */
            CameraStreamerInterop.getCameraAccess = function (ask) {
                if (ask === void 0) { ask = true; }
                return true;
            };
            CameraStreamerInterop.getCameraDeviceList = function () {
                return navigator.mediaDevices.enumerateDevices().then(function (l) { return l.filter(function (d) { return d.kind === "videoinput"; }); });
            };
            /**
             * Initializes the camera streamer - wihtout initializing the stream wont work
             * @param video ElementReference of the video
             * @param api TODO: this
             * @param camera Device-string (id) of the camera that should be used for the stream
             */
            CameraStreamerInterop.prototype.initialize = function (video, api, camera, width, height) {
                if (width === void 0) { width = 480; }
                if (height === void 0) { height = 270; }
                this._video = video;
                this._api = api;
                this._video.height;
                // Subscribe to onseeked event (you can't use '+=' like in c#)
                this._video.onseeked = this.video_onSeeked;
            };
            CameraStreamerInterop.prototype.video_onSeeked = function (e) {
            };
            CameraStreamerInterop.prototype.dispose = function () {
            };
            return CameraStreamerInterop;
        }());
        Scripts.CameraStreamerInterop = CameraStreamerInterop;
    })(Scripts = BlazorCameraStreamer.Scripts || (BlazorCameraStreamer.Scripts = {}));
})(BlazorCameraStreamer || (BlazorCameraStreamer = {}));
//# sourceMappingURL=CameraStreamer.js.map