using System.Text.Json.Serialization;

namespace TimePunchSite.Server.Data
{
    public record PunchDataRequest([property: JsonPropertyName("punchLimit")] int PunchLimit);
}
