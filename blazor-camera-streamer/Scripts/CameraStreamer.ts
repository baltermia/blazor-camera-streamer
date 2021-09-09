namespace BlazorCameraStreamer.Scripts {
    /**
     * This class is designed to work with Microsoft.JSInterop in C# Blazor and helps streaming a camera on a canvas
     */
    export class CameraStreamerInterop {
        private _video: HTMLVideoElement;
        private _api: any;

        /**
         * Returns a new instance of the CameraStreamerInterop class
         */
        public static createInstance(): CameraStreamerInterop {
            return new CameraStreamerInterop();
        }

        /**
         * Checks if the site has access to the camera
         * @param ask wether the method should ask the user if he wants to grant access if the access is currently denied
         * @returns whether the site can access the camera
         */
        public static getCameraAccess(ask: boolean = true) : boolean {
            return true;
        }

        public static getCameraDeviceList(): Promise<MediaDeviceInfo[]> {
            return navigator.mediaDevices.enumerateDevices().then(l => l.filter(d => d.kind === "videoinput"));
        }

        /**
         * Initializes the camera streamer - wihtout initializing the stream wont work
         * @param video ElementReference of the video
         * @param api TODO: this
         * @param camera Device-string (id) of the camera that should be used for the stream
         */
        public initialize(video: HTMLVideoElement, api: any, camera: string, width: number = 480, height: number = 270): void{
            this._video = video;
            this._api = api;

            this._video.height

            // Subscribe to onseeked event (you can't use '+=' like in c#)
            this._video.onseeked = this.video_onSeeked;
        }

        private video_onSeeked(e: Event) {

        }

        public dispose(): void {
            
        }
    }
}
