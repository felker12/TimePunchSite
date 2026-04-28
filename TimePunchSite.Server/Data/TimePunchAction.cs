using System.Text.Json.Serialization;

namespace TimePunchSite.Server.Data
{
    public record TimePunchAction(
        [property: JsonPropertyName("actionType")] string ActionType
    );
}