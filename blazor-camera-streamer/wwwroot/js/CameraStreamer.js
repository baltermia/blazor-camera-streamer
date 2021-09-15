var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var BlazorCameraStreamer;
(function (BlazorCameraStreamer) {
    var Scripts;
    (function (Scripts) {
        /**
         * This class is designed to work with Microsoft.JSInterop in C# Blazor and helps streaming webcams in a video element
         */
        class CameraStreamerInterop {
            constructor() {
                /**
                 * Whether or not the stream is currently active
                 */
                this._streamActive = false;
            }
            /**
             * Returns a new instance of the CameraStreamerInterop class
             */
            static createInstance() {
                return new CameraStreamerInterop();
            }
            /**
             * Initializes the camera streamer - wihtout initializing the stream wont work
             * @param video ElementReference of the video
             * @param api Reference to the dotnet object that should recieve callbacks
             * @param camera Device-string (id) of the camera that should be used for the stream
             */
            init(video, callOnFrameInvoke, api = null, onFrameInvokeName = null, width = 640, height = 360) {
                this._video = video;
                this._dotnetObject = api;
                this._invokeIdentifier = onFrameInvokeName;
                this._callInvoke = this._invokeIdentifier === null || this._dotnetObject === null ? false : callOnFrameInvoke;
                this._constraints = {
                    audio: false,
                    video: {
                        width: width,
                        height: height,
                        deviceId: { exact: undefined }
                    }
                };
            }
            /**
             * Starts the camerastreamer. The deviceId of the camera must be specified
             * @param cameraId The deviceId of the camera
             */
            start(cameraId) {
                // Stop the stream first if it's active already (otherwise the stream wouldn't be closed and the camera will be used even when stopping again)
                if (this._streamActive)
                    this.stop();
                // Write the deviceId into the _constraints object
                this._constraints.video["deviceId"]["exact"] = cameraId;
                navigator.mediaDevices.getUserMedia(this._constraints).then(mediaStream => {
                    this._stream = mediaStream;
                    // Add the stream of the chosen camera as src on the video element
                    this._video.srcObject = this._stream;
                    // Add with anonymous function, not assigning directly (neccesarry, otherwise the method isn't in the scope anymore, e.g. can't access properties etc.)
                    this._video.ontimeupdate = (ev) => this.onFrame(ev);
                });
                // Start the video element as soon as all metadata is loaded (this is needed as we get the mediastream object asynchronously in the code above)
                this._video.onloadedmetadata = (ev) => __awaiter(this, void 0, void 0, function* () {
                    yield this._video.play();
                    this._streamActive = true;
                });
            }
            /**
             * Stops the camerastreamer (the last frame will be still shown in the video element)
             */
            stop() {
                var _a, _b;
                // Use pause method as there's no stop method in the HTMLVideoElement interface
                (_a = this._video) === null || _a === void 0 ? void 0 : _a.pause();
                // Stop all tracks of the stream (without doing this the stream would still be processed and the browser will show that the camera is still in use by the site)
                (_b = this._stream) === null || _b === void 0 ? void 0 : _b.getTracks().forEach(t => t.stop());
                this._streamActive = false;
                if (this._video !== null)
                    this._video.ontimeupdate = null;
            }
            /**
             * Changes the current camera (if the camera is the same as the one at the moment nothing will happen)
             * @param newId
             */
            changeCamera(newId) {
                // Don't start the stream again if the camera's still the same
                if (this._constraints.video["deviceId"] === newId)
                    return;
                // Simply calling the start method again will change the camera that is being used
                this.start(newId);
            }
            /**
             * Checks if the site has access to the camera(s) and asks for it if the access is currently denied
             * @returns whether the site can access the camera
             */
            static getCameraAccess() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield navigator.mediaDevices.getUserMedia({ video: true });
                    }
                    catch (_a) {
                        return false;
                    }
                    return true;
                });
            }
            /**
             * Gets all media-devices of kind 'videoinput' and returns them as a MediaDeviceInfo array
             */
            static getCameraDeviceList() {
                return navigator.mediaDevices.enumerateDevices()
                    // Wait until all devices are enumerated
                    .then(l => l
                    // Filters out all videoinputs (the streamer doesn't support audio)
                    .filter(d => d.kind === "videoinput"));
            }
            /**
             * Releases all resources and stops the stream. The object must be reinitialized before it can be used again
             */
            dispose() {
                this.stop();
                // Set variables to null
                this._video = null;
                this._dotnetObject = null;
                this._stream = null;
                this._constraints = null;
            }
            /**
             * Invokes the dotnet object on the provided method with the given data
             * @param data The string the dotnet method recieves
             */
            invokeDotnetObject(data) {
                if (this._callInvoke)
                    this._dotnetObject.invokeMethodAsync(this._invokeIdentifier, data);
            }
            /**
             * Handles the videos ontimeupdate event and invokes the dotnet object with the img
             */
            onFrame(ev) {
                if (!this._callInvoke || !this._streamActive)
                    return;
                let canvas = document.createElement("canvas");
                canvas.width = this._constraints.video["width"];
                canvas.height = this._constraints.video["height"];
                // Draw the current image of the stream on the canvas
                canvas.getContext("2d").drawImage(this._video, 0, 0);
                // Get the iamge as 64base string
                let img = canvas.toDataURL("image/png");
                this.invokeDotnetObject(img);
            }
        }
        Scripts.CameraStreamerInterop = CameraStreamerInterop;
    })(Scripts = BlazorCameraStreamer.Scripts || (BlazorCameraStreamer.Scripts = {}));
})(BlazorCameraStreamer || (BlazorCameraStreamer = {}));
//# sourceMappingURL=CameraStreamer.js.map