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
                /**
                 * Incremented on every stop. Used to detect streams of an outdated start call (e.g. the streamer was stopped or disposed before the camera was ready)
                 */
                this._startId = 0;
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
             * @param facingMode Preferred direction of the camera (e.g. "environment"), used if no deviceId is given when starting
             */
            init(video, callOnFrameInvoke, api = null, onFrameInvokeName = null, width = 640, height = 360, facingMode = null) {
                this._video = video;
                this._facingMode = facingMode;
                this._dotnetObject = api;
                this._invokeIdentifier = onFrameInvokeName;
                this._callInvoke = this._invokeIdentifier === null || this._dotnetObject === null ? false : callOnFrameInvoke;
                this._constraints = {
                    audio: false,
                    video: {
                        width: width,
                        height: height,
                        deviceId: undefined
                    }
                };
            }
            /**
             * Starts the camerastreamer. The deviceId of the camera must be specified
             * @param cameraId The deviceId of the camera
             */
            start(cameraId) {
                // Stop the previous stream first, even if it's still starting (otherwise the stream wouldn't be closed and the camera will be used even when stopping again)
                this.stop();
                const startId = this._startId;
                this._cameraId = cameraId;
                // Write the deviceId into the _constraints object. Only require a specific camera if an id is given, as an empty id
                // (e.g. from the device list before the camera access is granted) would fail with an OverconstrainedError
                this._constraints.video["deviceId"] = cameraId ? { exact: cameraId } : undefined;
                // Without a specific camera, prefer the one facing the given direction. Ideal instead of exact,
                // so devices without such a camera (e.g. a laptop without rear camera) fall back to another one
                this._constraints.video["facingMode"] = !cameraId && this._facingMode ? { ideal: this._facingMode } : undefined;
                navigator.mediaDevices.getUserMedia(this._constraints).then(mediaStream => {
                    // The streamer was stopped, restarted or disposed while waiting for the camera, release it immediately
                    if (startId !== this._startId) {
                        mediaStream.getTracks().forEach(t => t.stop());
                        return;
                    }
                    this._stream = mediaStream;
                    // Add the stream of the chosen camera as src on the video element
                    this._video.srcObject = this._stream;
                    if (this._callInvoke)
                        // Add with anonymous function, not assigning directly (neccesarry, otherwise the method isn't in the scope anymore, e.g. can't access properties etc.)
                        this._video.ontimeupdate = (ev) => this.onFrame(ev);
                });
                // Start the video element as soon as all metadata is loaded (this is needed as we get the mediastream object asynchronously in the code above)
                this._video.onloadedmetadata = (ev) => __awaiter(this, void 0, void 0, function* () {
                    if (startId !== this._startId)
                        return;
                    yield this._video.play();
                    this._streamActive = true;
                });
            }
            /**
             * Stops the camerastreamer (the last frame will be still shown in the video element)
             */
            stop() {
                var _a, _b;
                // Invalidate pending start calls, so their stream gets released as soon as it's ready
                this._startId++;
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
                if (this._streamActive && this._cameraId === newId)
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
                        const stream = yield navigator.mediaDevices.getUserMedia({ video: true });
                        // The stream is only needed to request the access, release the camera immediately (otherwise it stays in use until the stream is garbage collected)
                        stream.getTracks().forEach(t => t.stop());
                    }
                    catch (_a) {
                        return false;
                    }
                    return true;
                });
            }
            /**
             * Gets all media-devices of kind 'videoinput' and returns them as a CameraDeviceInfo array
             */
            static getCameraDeviceList() {
                return navigator.mediaDevices.enumerateDevices()
                    // Wait until all devices are enumerated
                    .then(l => l
                    // Filters out all videoinputs (the streamer doesn't support audio)
                    .filter(d => d.kind === "videoinput")
                    .map(d => ({ deviceId: d.deviceId, label: d.label, facingMode: CameraStreamerInterop.getFacingMode(d) })));
            }
            /**
             * Gets the direction the camera is facing, if the browser reports it (not supported by all browsers, and usually not reported for desktop webcams)
             * @returns "user", "environment", "left", "right" or null if unknown
             */
            static getFacingMode(device) {
                var _a, _b, _c;
                try {
                    // getCapabilities only exists on InputDeviceInfo, which not all browsers support (e.g. Firefox)
                    const facingMode = (_c = (_b = (_a = device).getCapabilities) === null || _b === void 0 ? void 0 : _b.call(_a).facingMode) === null || _c === void 0 ? void 0 : _c[0];
                    // Only return known values, as they're converted to an enum on the dotnet side
                    return facingMode && ["user", "environment", "left", "right"].includes(facingMode) ? facingMode : null;
                }
                catch (_d) {
                    return null;
                }
            }
            getCurrentFrame() {
                return (this._callInvoke && this._streamActive) ?
                    Promise.resolve(this._lastFrame) :
                    Promise.resolve(this.getCurrentCanvasFrame());
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
                this._lastFrame = null;
            }
            /**
             * Invokes the dotnet object on the provided method with the given data
             * @param data The string the dotnet method recieves
             */
            invokeDotnetObject(data) {
                if (this._callInvoke)
                    this._dotnetObject.invokeMethodAsync(this._invokeIdentifier, data);
            }
            getCurrentCanvasFrame() {
                let canvas = document.createElement("canvas");
                // Use the actual resolution of the stream, as it can differ from the constraints (e.g. rotated on mobile devices in portrait mode).
                // Fall back to the constraints if the video metadata isn't loaded yet
                canvas.width = this._video.videoWidth || this._constraints.video["width"];
                canvas.height = this._video.videoHeight || this._constraints.video["height"];
                // Draw the current image of the stream on the canvas
                canvas.getContext("2d").drawImage(this._video, 0, 0);
                // Get the iamge as 64base string
                return canvas.toDataURL("image/png");
            }
            /**
             * Handles the videos ontimeupdate event and invokes the dotnet object with the img
             */
            onFrame(ev) {
                if (this._callInvoke && this._streamActive)
                    this.invokeDotnetObject(this._lastFrame = this.getCurrentCanvasFrame());
            }
        }
        Scripts.CameraStreamerInterop = CameraStreamerInterop;
    })(Scripts = BlazorCameraStreamer.Scripts || (BlazorCameraStreamer.Scripts = {}));
})(BlazorCameraStreamer || (BlazorCameraStreamer = {}));
