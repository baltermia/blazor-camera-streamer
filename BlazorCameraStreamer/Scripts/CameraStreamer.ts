namespace BlazorCameraStreamer.Scripts {
    /**
     * Interface representing a DotNetObjekt
     */
    interface DotNetObjectReference {
        /**
         * Invokes the method specified with the identifier on the dotnet object with the given arguments
         * @param identifier The identifier of the JSInvokable method in the dotnet object
         * @param args The arguments that are given when invoking the method
         */
        invokeMethodAsync(identifier: string, ...args: any): any;
    }

    /**
     * Information about a camera, which is returned to the dotnet side (MediaDeviceInfoModel)
     */
    interface CameraDeviceInfo {
        deviceId: string;
        label: string;
        /**
         * Direction the camera is facing ("user", "environment", "left" or "right"), null if unknown
         */
        facingMode: string;
    }

    /**
     * This class is designed to work with Microsoft.JSInterop in C# Blazor and helps streaming webcams in a video element
     */
    export class CameraStreamerInterop {
        /**
         * Reference to the html video element in which the camera should be streamed
         */
        private _video: HTMLVideoElement;

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
         * Reference to the calling dotnet object. This is used to invoke the C# methods (used for callbacks/events)
         */
        private _dotnetObject: DotNetObjectReference;

        /**
         * The name of the method that should be invoked when a frame is recieved 
         */
        private _invokeIdentifier: string;

        /**
         * Whether the provided method should be invoked when a frame is recived 
         */
        private _callInvoke: boolean;

        /**
         * The name of the method that should be invoked with the binary data of each frame (null if not used)
         */
        private _frameDataInvokeIdentifier: string;

        /**
         * Maximum number of frames per second for the frame callbacks (null or 0 for no limit)
         */
        private _frameRate: number;

        /**
         * Image type of the captured frames (e.g. "image/jpeg")
         */
        private _frameType: string;

        /**
         * Quality of the captured frames between 0 and 1, only used for lossy types like jpeg and webp (null for the browser default)
         */
        private _frameQuality: number;

        /**
         * Time (performance.now) at which the last frame was sent to the frame callbacks
         */
        private _lastFrameTime: number = 0;

        /**
         * Canvas the frames are drawn on (reused for every frame)
         */
        private _canvas: HTMLCanvasElement;

        /**
         * Incremented on every stop. Used to detect streams of an outdated start call (e.g. the streamer was stopped or disposed before the camera was ready)
         */
        private _startId: number = 0;

        /**
         * The deviceId of the camera given in the last start call
         */
        private _cameraId: string;

        /**
         * Preferred direction of the camera (e.g. "environment"), used if no deviceId is given when starting
         */
        private _facingMode: string;

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
         * @param facingMode Preferred direction of the camera (e.g. "environment"), used if no deviceId is given when starting
         * @param onFrameDataInvokeName Name of the method that should be invoked with the binary data of each frame (null if not used)
         * @param frameRate Maximum number of frames per second for the frame callbacks (null or 0 for no limit)
         * @param frameType Image type of the captured frames (e.g. "image/jpeg")
         * @param frameQuality Quality of the captured frames between 0 and 1, only used for lossy types like jpeg and webp (null for the browser default)
         */
        public init(video: HTMLVideoElement, callOnFrameInvoke: boolean, api: DotNetObjectReference = null, onFrameInvokeName: string = null, width: number = 640, height: number = 360, facingMode: string = null,
            onFrameDataInvokeName: string = null, frameRate: number = null, frameType: string = "image/png", frameQuality: number = null): void {
            this._video = video;
            this._facingMode = facingMode;
            this._dotnetObject = api;
            this._invokeIdentifier = onFrameInvokeName;
            this._callInvoke = this._invokeIdentifier === null || this._dotnetObject === null ? false : callOnFrameInvoke;
            this._frameDataInvokeIdentifier = this._dotnetObject === null ? null : onFrameDataInvokeName;
            this._frameRate = frameRate;
            this._frameType = frameType || "image/png";
            this._frameQuality = frameQuality;

            this._constraints = {
                audio: false,
                video: {
                    width: width,
                    height: height,
                    deviceId: undefined
                }
            }
        }

        /**
         * Starts the camerastreamer. The deviceId of the camera must be specified
         * @param cameraId The deviceId of the camera
         */
        public start(cameraId: string): void {
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
            });

            // Start the video element as soon as all metadata is loaded (this is needed as we get the mediastream object asynchronously in the code above)
            this._video.onloadedmetadata = async (ev: Event) => {
                if (startId !== this._startId) return;

                await this._video.play();

                // The streamer was stopped or restarted while starting the video
                if (startId !== this._startId) return;

                // The event can fire again (e.g. if the metadata changes), but the frames should only be captured once per start call
                const firstPlay = !this._streamActive;

                this._streamActive = true;

                // Start capturing the frames for the callbacks. Only now that the video is playing, as requestVideoFrameCallback stops firing if it's requested before
                if (firstPlay && (this._callInvoke || this._frameDataInvokeIdentifier))
                    this.requestFrame(startId);
            }
        }

        /**
         * Stops the camerastreamer (the last frame will be still shown in the video element)
         */
        public stop(): void {
            // Invalidate pending start calls, so their stream gets released as soon as it's ready
            this._startId++;

            // Use pause method as there's no stop method in the HTMLVideoElement interface
            this._video?.pause();

            // Stop all tracks of the stream (without doing this the stream would still be processed and the browser will show that the camera is still in use by the site)
            this._stream?.getTracks().forEach(t => t.stop());

            this._streamActive = false;
        }

        /**
         * Changes the current camera (if the camera is the same as the one at the moment nothing will happen)
         * @param newId
         */
        public changeCamera(newId: string): void {
            // Don't start the stream again if the camera's still the same
            if (this._streamActive && this._cameraId === newId) return;

            // Simply calling the start method again will change the camera that is being used
            this.start(newId);
        }

        /**
         * Checks if the site has access to the camera(s) and asks for it if the access is currently denied
         * @returns whether the site can access the camera
         */
        public static async getCameraAccess(): Promise<boolean> {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });

                // The stream is only needed to request the access, release the camera immediately (otherwise it stays in use until the stream is garbage collected)
                stream.getTracks().forEach(t => t.stop());
            } catch {
                return false;
            }
            return true;
        }

        /**
         * Gets all media-devices of kind 'videoinput' and returns them as a CameraDeviceInfo array
         */
        public static getCameraDeviceList(): Promise<CameraDeviceInfo[]> {
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
        private static getFacingMode(device: MediaDeviceInfo): string {
            try {
                // getCapabilities only exists on InputDeviceInfo, which not all browsers support (e.g. Firefox)
                const facingMode = (device as InputDeviceInfo).getCapabilities?.().facingMode?.[0];

                // Only return known values, as they're converted to an enum on the dotnet side
                return facingMode && ["user", "environment", "left", "right"].includes(facingMode) ? facingMode : null;
            } catch {
                return null;
            }
        }

        /**
         * Captures the current frame of the stream
         * @returns The image as data-url (e.g. "data:image/png;base64,...")
         */
        public getCurrentFrame(): Promise<string> {
            return Promise.resolve(this.drawFrame().toDataURL(this._frameType, this._frameQuality));
        }

        /**
         * Releases all resources and stops the stream. The object must be reinitialized before it can be used again
         */
        public dispose(): void {
            this.stop();

            // Set variables to null
            this._video = null;
            this._dotnetObject = null;
            this._stream = null;
            this._constraints = null;
            this._canvas = null;
        }

        /**
         * Requests the frame callback for the next frame of the video. Uses requestVideoFrameCallback if supported (called for every new frame of the video), otherwise requestAnimationFrame
         * @param startId Id of the start call the frames are captured for
         */
        private requestFrame(startId: number): void {
            // The streamer was stopped, restarted or disposed in the meantime (this ends the loop)
            if (startId !== this._startId) return;

            if ("requestVideoFrameCallback" in this._video)
                this._video.requestVideoFrameCallback(() => this.onFrame(startId));
            else
                requestAnimationFrame(() => this.onFrame(startId));
        }

        /**
         * Captures the current frame and invokes the dotnet callbacks with it (if the frame rate allows it), then requests the next frame
         * @param startId Id of the start call the frames are captured for
         */
        private async onFrame(startId: number): Promise<void> {
            if (startId !== this._startId) return;

            // Allow a small tolerance, as the frames of the video don't arrive in exact intervals
            const minInterval = this._frameRate > 0 ? 1000 / this._frameRate * 0.9 : 0;

            if (this._streamActive && performance.now() - this._lastFrameTime >= minInterval) {
                this._lastFrameTime = performance.now();

                try {
                    // Wait until the callbacks are completed, so that no more frames are sent than the dotnet side can process (frames in between are skipped)
                    await this.sendFrame(startId);
                } catch (e) {
                    // Errors after stopping are expected (e.g. the dotnet object is already disposed)
                    if (startId === this._startId)
                        console.error(e);
                }
            }

            this.requestFrame(startId);
        }

        /**
         * Captures the current frame and invokes the dotnet callbacks with it
         * @param startId Id of the start call the frames are captured for
         */
        private async sendFrame(startId: number): Promise<void> {
            const canvas = this.drawFrame();
            const calls: Promise<any>[] = [];

            if (this._frameDataInvokeIdentifier) {
                // Encoding to a blob doesn't block the page, and the bytes are sent as binary data (a lot faster than a base64 string)
                const blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve, this._frameType, this._frameQuality));
                const data = blob ? new Uint8Array(await blob.arrayBuffer()) : null;

                if (startId !== this._startId || data === null) return;

                // The type of the blob is the actual type of the image, as browsers fall back to png if a type isn't supported
                calls.push(this._dotnetObject.invokeMethodAsync(this._frameDataInvokeIdentifier, data, blob.type, canvas.width, canvas.height));
            }

            if (this._callInvoke)
                calls.push(this._dotnetObject.invokeMethodAsync(this._invokeIdentifier, canvas.toDataURL(this._frameType, this._frameQuality)));

            await Promise.all(calls);
        }

        /**
         * Draws the current frame of the video on the canvas
         * @returns The canvas with the current frame
         */
        private drawFrame(): HTMLCanvasElement {
            this._canvas ??= document.createElement("canvas");

            // Use the actual resolution of the stream, as it can differ from the constraints (e.g. rotated on mobile devices in portrait mode).
            // Fall back to the constraints if the video metadata isn't loaded yet
            const width = this._video.videoWidth || this._constraints.video["width"];
            const height = this._video.videoHeight || this._constraints.video["height"];

            // Only resize if needed, as resizing reallocates the canvas
            if (this._canvas.width !== width) this._canvas.width = width;
            if (this._canvas.height !== height) this._canvas.height = height;

            // Draw the current image of the stream on the canvas
            this._canvas.getContext("2d").drawImage(this._video, 0, 0);

            return this._canvas;
        }
    }
}
