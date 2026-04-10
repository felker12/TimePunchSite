using System.Text.Json.Serialization;

namespace TimePunchSite.Server.Data
{
    // Ensure this matches the JSON keys sent by React (id and password)
    // Record for the incoming JSON
    public record LoginRequest(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("password")] string Password
    );
}
