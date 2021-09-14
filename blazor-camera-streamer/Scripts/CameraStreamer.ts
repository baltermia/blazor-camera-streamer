namespace BlazorCameraStreamer.Scripts {
    /**
     * This class is designed to work with Microsoft.JSInterop in C# Blazor and helps streaming webcams in a video element
     */
    export class CameraStreamerInterop {
        /**
         * Reference to the html video element in which the camera should be streamed
         */
        private _video: HTMLVideoElement;

        /**
         * Reference to the calling dotnet object. This is used to invoke the C# methods (used for callbacks/events)
         */
        private _apiRef: any;

        /**
         * Object of the current stream (webcam)
         */
        private _stream: MediaStream;

        /**
         * Constraints used for the MediaStream (used to specificy height, width, camera, audio etc.) 
         */
        private _constraints: MediaStreamConstraints;

        /**
         * Whether or not the stream is currently active
         */
        private _streamActive: boolean = false;

        /**
         * Returns a new instance of the CameraStreamerInterop class
         */
        public static createInstance(): CameraStreamerInterop {
            return new CameraStreamerInterop();
        }

        /**
         * Initializes the camera streamer - wihtout initializing the stream wont work
         * @param video ElementReference of the video
         * @param api Reference to the dotnet object that should recieve callbacks
         * @param camera Device-string (id) of the camera that should be used for the stream
         */
        public init(video: HTMLVideoElement, api: any, width: number = 480, height: number = 270): void{
            this._video = video;
            this._apiRef = api;

            this._constraints = {
                audio: false,
                video: {
                    width: width,
                    height: height,
                    deviceId: { exact: undefined }
                }
            }
        }

        /**
         * Starts the camerastreamer. The deviceId of the camera must be specified
         * @param cameraId The deviceId of the camera
         */
        public start(cameraId: string): void {
            // Stop the stream first if it's active already (otherwise the stream wouldn't be closed and the camera will be used even when stopping again)
            if (this._streamActive) this.stop();

            // Write the deviceId into the _constraints object
            this._constraints.video["deviceId"]["exact"] = cameraId;

            navigator.mediaDevices.getUserMedia(this._constraints).then(mediaStream => {
                this._stream = mediaStream;

                // Add the stream of the chosen camera as src on the video element
                this._video.srcObject = this._stream;

                // Todo: Implement callback to _apiRef on each frame with data
            });

            // Start the video element as soon as all metadata is loaded (this is needed as we get the mediastream object asynchronously in the code above)
            this._video.onloadedmetadata = async e => await this._video.play();

            this._streamActive = true;
        }

        /**
         * Stops the camerastreamer (the last frame will be still shown in the video element)
         */
        public stop(): void {
            // Use pause method as there's no stop method in the HTMLVideoElement interface
            this._video.pause();

            // Stop all tracks of the stream (without doing this the stream would still be processed and the browser will show that the camera is still in use by the site)
            this._stream.getTracks().forEach(t => t.stop());

            this._streamActive = false;
        }

        /**
         * Changes the current camera (if the camera is the same as the one at the moment nothing will happen)
         * @param newId
         */
        public changeCamera(newId: string): void {
            // Don't start the stream again if the camera's still the same
            if (this._constraints.video["deviceId"] === newId) return;

            // Simply calling the start method again will change the camera that is being used
            this.start(newId);
        }

        /**
         * Checks if the site has access to the camera(s)
         * @param ask wether the method should ask the user if he wants to grant access if the access is currently denied
         * @returns whether the site can access the camera
         */
        public static getCameraAccess(ask: boolean = true): boolean {
            // navigator.mediaDevices.getUserMedia({ video: true, audio: false });

            // Todo: finish getCameraAccess

            return true;
        }

        /**
         * Gets all media-devices of kind 'videoinput' and returns them as a MediaDeviceInfo array
         */
        public static getCameraDeviceList(): Promise<MediaDeviceInfo[]> {
            return navigator.mediaDevices.enumerateDevices()
                // Wait until all devices are enumerated
                .then(l => l
                    // Filters out all videoinputs (the streamer doesn't support audio)
                    .filter(d => d.kind === "videoinput"));
        }

        /**
         * Releases all resources and stops the stream. The object must be reinitialized before it can be used again
         */
        public dispose(): void {
            this.stop();

            // Set variables to null
            this._video = null;
            this._apiRef = null;
            this._stream = null;
            this._constraints = null;
        }
    }
}
