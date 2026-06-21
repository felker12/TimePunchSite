using System.Text.Json.Serialization;

namespace TimePunchSite.Server.Data;

//Ensure this matches the JSON keys sent by React (id and password)
//Record for the incoming JSON
public record LoginRequest(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("password")] string Password
);

public record TimePunchAction(
    [property: JsonPropertyName("actionType")] string ActionType
);

public record PunchDataRequest([property: JsonPropertyName("punchLimit")] int PunchLimit);

public record WeeklyReportRequest(DateTime Day);

public record TimePunchUpdateRequest([property: JsonPropertyName("punch")] TimePunchData Punch);