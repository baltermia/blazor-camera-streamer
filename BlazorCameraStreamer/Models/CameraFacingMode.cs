using System.Text.Json.Serialization;

namespace BlazorCameraStreamer
{
    /// <summary>
    /// Direction a camera is facing (represents the facingMode of the MediaStream API)
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum CameraFacingMode
    {
        /// <summary>
        /// The camera is facing the user (e.g. the front camera of a phone)
        /// </summary>
        User,

        /// <summary>
        /// The camera is facing away from the user (e.g. the rear camera of a phone)
        /// </summary>
        Environment,

        /// <summary>
        /// The camera is facing the environment to the left of the user
        /// </summary>
        Left,

        /// <summary>
        /// The camera is facing the environment to the right of the user
        /// </summary>
        Right
    }
}
