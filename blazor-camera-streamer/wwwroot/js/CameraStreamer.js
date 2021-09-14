var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var BlazorCameraStreamer;
(function (BlazorCameraStreamer) {
    var Scripts;
    (function (Scripts) {
        /**
         * This class is designed to work with Microsoft.JSInterop in C# Blazor and helps streaming webcams in a video element
         */
        var CameraStreamerInterop = /** @class */ (function () {
            function CameraStreamerInterop() {
                /**
                 * Whether or not the stream is currently active
                 */
                this._streamActive = false;
            }
            /**
             * Returns a new instance of the CameraStreamerInterop class
             */
            CameraStreamerInterop.createInstance = function () {
                return new CameraStreamerInterop();
            };
            /**
             * Initializes the camera streamer - wihtout initializing the stream wont work
             * @param video ElementReference of the video
             * @param api Reference to the dotnet object that should recieve callbacks
             * @param camera Device-string (id) of the camera that should be used for the stream
             */
            CameraStreamerInterop.prototype.init = function (video, api, width, height) {
                if (width === void 0) { width = 480; }
                if (height === void 0) { height = 270; }
                this._video = video;
                this._apiRef = api;
                this._constraints = {
                    audio: false,
                    video: {
                        width: width,
                        height: height,
                        deviceId: { exact: undefined }
                    }
                };
            };
            /**
             * Starts the camerastreamer. The deviceId of the camera must be specified
             * @param cameraId The deviceId of the camera
             */
            CameraStreamerInterop.prototype.start = function (cameraId) {
                var _this = this;
                // Stop the stream first if it's active already (otherwise the stream wouldn't be closed and the camera will be used even when stopping again)
                if (this._streamActive)
                    this.stop();
                // Write the deviceId into the _constraints object
                this._constraints.video["deviceId"]["exact"] = cameraId;
                navigator.mediaDevices.getUserMedia(this._constraints).then(function (mediaStream) {
                    _this._stream = mediaStream;
                    // Add the stream of the chosen camera as src on the video element
                    _this._video.srcObject = _this._stream;
                    // Todo: Implement callback to _apiRef on each frame with data
                });
                // Start the video element as soon as all metadata is loaded (this is needed as we get the mediastream object asynchronously in the code above)
                this._video.onloadedmetadata = function (e) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._video.play()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                }); }); };
                this._streamActive = true;
            };
            /**
             * Stops the camerastreamer (the last frame will be still shown in the video element)
             */
            CameraStreamerInterop.prototype.stop = function () {
                // Use pause method as there's no stop method in the HTMLVideoElement interface
                this._video.pause();
                // Stop all tracks of the stream (without doing this the stream would still be processed and the browser will show that the camera is still in use by the site)
                this._stream.getTracks().forEach(function (t) { return t.stop(); });
                this._streamActive = false;
            };
            /**
             * Changes the current camera (if the camera is the same as the one at the moment nothing will happen)
             * @param newId
             */
            CameraStreamerInterop.prototype.changeCamera = function (newId) {
                // Don't start the stream again if the camera's still the same
                if (this._constraints.video["deviceId"] === newId)
                    return;
                // Simply calling the start method again will change the camera that is being used
                this.start(newId);
            };
            /**
             * Checks if the site has access to the camera(s)
             * @param ask wether the method should ask the user if he wants to grant access if the access is currently denied
             * @returns whether the site can access the camera
             */
            CameraStreamerInterop.getCameraAccess = function (ask) {
                // navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                if (ask === void 0) { ask = true; }
                // Todo: finish getCameraAccess
                return true;
            };
            /**
             * Gets all media-devices of kind 'videoinput' and returns them as a MediaDeviceInfo array
             */
            CameraStreamerInterop.getCameraDeviceList = function () {
                return navigator.mediaDevices.enumerateDevices()
                    // Wait until all devices are enumerated
                    .then(function (l) { return l
                    // Filters out all videoinputs (the streamer doesn't support audio)
                    .filter(function (d) { return d.kind === "videoinput"; }); });
            };
            /**
             * Releases all resources and stops the stream. The object must be reinitialized before it can be used again
             */
            CameraStreamerInterop.prototype.dispose = function () {
                this.stop();
                // Set variables to null
                this._video = null;
                this._apiRef = null;
                this._stream = null;
                this._constraints = null;
            };
            return CameraStreamerInterop;
        }());
        Scripts.CameraStreamerInterop = CameraStreamerInterop;
    })(Scripts = BlazorCameraStreamer.Scripts || (BlazorCameraStreamer.Scripts = {}));
})(BlazorCameraStreamer || (BlazorCameraStreamer = {}));
//# sourceMappingURL=CameraStreamer.js.map