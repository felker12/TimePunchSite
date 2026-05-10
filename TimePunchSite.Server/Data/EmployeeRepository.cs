using Microsoft.Data.SqlClient;
using System.Data;
using TimePunchSite.Server.Security;

namespace TimePunchSite.Server.Data;
public class EmployeeRepository(DatabaseService database, PasswordService passwordService)
{
    private readonly DatabaseService _database = database;
    private readonly PasswordService _passwordService = passwordService;

    public bool CheckLogin(int id, string pass)
    {
        if (id < 1 || string.IsNullOrEmpty(pass))
            return false;

        using var connection = _database.CreateConnection();

        const string query =
            "SELECT PasswordHash, Salt FROM dbo.Employees WHERE ID = @id";

        using var command = new SqlCommand(query, connection);
        command.Parameters.Add("@id", SqlDbType.Int).Value = id;

        connection.Open();

        using var reader = command.ExecuteReader();

        if (reader.Read())
        {
            byte[] storedHash = (byte[])reader["PasswordHash"];
            byte[] storedSalt = (byte[])reader["Salt"];

            return _passwordService.VerifyPassword(pass, storedHash, storedSalt);
        }

        return false;
    }

    public bool PerformPunchAction(int id, string actionType)
    {
        if (id < 1 || string.IsNullOrEmpty(actionType))
            return false;

        string query = actionType.ToLower() switch
        {
            "clock-in" => "INSERT INTO dbo.TimePunches (EmployeeID, ClockIn) VALUES (@id, GETUTCDATE())",

            "clock-out" => @"UPDATE dbo.TimePunches SET ClockOut = GETUTCDATE() 
                         WHERE TimePunchID = (SELECT TOP 1 TimePunchID FROM dbo.TimePunches 
                                              WHERE EmployeeID = @id AND ClockOut IS NULL 
                                              ORDER BY ClockIn DESC)",

            "break-start" => @"UPDATE dbo.TimePunches SET BreakStart = GETUTCDATE() 
                           WHERE EmployeeID = @id AND ClockOut IS NULL AND BreakStart IS NULL",

            "break-end" => @"UPDATE dbo.TimePunches SET BreakEnd = GETUTCDATE() 
                 WHERE EmployeeID = @id 
                 AND ClockOut IS NULL 
                 AND BreakStart IS NOT NULL 
                 AND BreakEnd IS NULL",

            _ => throw new ArgumentException("Invalid punch action type", nameof(actionType))
        };

        if (query == null)
            return false;

        using var connection = _database.CreateConnection();

        using var command = new SqlCommand(query, connection);
        command.Parameters.Add("@id", SqlDbType.Int).Value = id;

        connection.Open();

        int rowsAffected = command.ExecuteNonQuery();
        return rowsAffected > 0;
    }

    public List<TimePunchData> GetTimePunchDataList(int id, int limit = 2000)
    {
        List<TimePunchData> punches = [];

        using var connection = _database.CreateConnection();
        const string query = @"
            SELECT TOP (@limit) EmployeeID, ClockIn, ClockOut, BreakStart, BreakEnd
            FROM dbo.TimePunches
            WHERE EmployeeID = @id
            ORDER BY ClockIn DESC";

        using var command = new SqlCommand(query, connection);
        command.Parameters.Add("@id", SqlDbType.Int).Value = id;
        command.Parameters.Add("@limit", SqlDbType.Int).Value = limit;
        connection.Open();

        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            punches.Add(new TimePunchData(
                reader.GetInt32(0),
                reader.GetDateTime(1),
                reader.IsDBNull(2) ? null : reader.GetDateTime(2),
                reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                reader.IsDBNull(4) ? null : reader.GetDateTime(4)
            ));
        }

        return punches;
    }
}