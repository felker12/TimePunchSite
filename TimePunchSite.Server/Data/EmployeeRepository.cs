using Microsoft.Data.SqlClient;
using System.Data;
using System.Reflection.Metadata.Ecma335;
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
            "clock-in" => "INSERT INTO dbo.TimePunches (EmployeeID, ClockIn) VALUES (@id, GETDATE())",

            "clock-out" => @"UPDATE dbo.TimePunches SET ClockOut = GETDATE() 
                         WHERE TimePunchID = (SELECT TOP 1 TimePunchID FROM dbo.TimePunches 
                                              WHERE EmployeeID = @id AND ClockOut IS NULL 
                                              ORDER BY ClockIn DESC)",

            "break-start" => @"UPDATE dbo.TimePunches SET BreakStart = GETDATE() 
                           WHERE EmployeeID = @id AND ClockOut IS NULL AND BreakStart IS NULL",

            "break-end" => @"UPDATE dbo.TimePunches SET BreakEnd = GETDATE() 
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

    public List<TimePunchData> GetTimePunchDataList(int id)
    {
        List<TimePunchData> punches = [];

        using var connection = _database.CreateConnection();
        const string query = "SELECT EmployeeID, ClockIn, ClockOut, BreakStart, BreakEnd FROM dbo.TimePunches WHERE EmployeeID = @id ORDER BY ClockIn DESC";

        using var command = new SqlCommand(query, connection);
        command.Parameters.Add("@id", SqlDbType.Int).Value = id;
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

    public List<string> GetTimePunches(int id)
    {
        List<string> punches = [];

        if (id < 1) 
            return punches;

        using var connection = _database.CreateConnection();

        // Querying all timing columns for the specific employee
        const string query = @"
            SELECT ClockIn, ClockOut, BreakStart, BreakEnd 
            FROM dbo.TimePunches 
            WHERE EmployeeID = @id 
            ORDER BY ClockIn DESC";

        using var command = new SqlCommand(query, connection);
        command.Parameters.Add("@id", SqlDbType.Int).Value = id;

        connection.Open();
        using var reader = command.ExecuteReader();

        while (reader.Read())
        {
            //ClockIn is NOT NULL, so get it directly
            DateTime clockIn = reader.GetDateTime(0);
            string entry = $"In: {clockIn:MM/dd/yyyy hh:mm tt}";

            //ClockOut, BreakStart, and BreakEnd are NULLABLE, so check for DBNull
            if (!reader.IsDBNull(1))
                entry += $" | Out: {reader.GetDateTime(1):hh:mm tt}";

            if (!reader.IsDBNull(2))
                entry += $" | Break: {reader.GetDateTime(2):hh:mm tt}";

            punches.Add(entry);
        }

        return punches;
    }

    public string GetMostRecentTimePunch(int id)
    {
        if (id < 1) 
            return "No punches found.";

        using var connection = _database.CreateConnection();
        const string query = @"
            SELECT TOP 1 ClockIn, ClockOut, BreakStart, BreakEnd 
            FROM dbo.TimePunches 
            WHERE EmployeeID = @id 
            ORDER BY ClockIn DESC";

        using var command = new SqlCommand(query, connection);
        command.Parameters.Add("@id", SqlDbType.Int).Value = id;

        connection.Open();
        using var reader = command.ExecuteReader();

        if (reader.Read())
        {
            DateTime clockIn = reader.GetDateTime(0);
            string entry = $"In: {clockIn:MM/dd/yyyy hh:mm tt}";
            if (!reader.IsDBNull(1))
                entry += $" | Out: {reader.GetDateTime(1):hh:mm tt}";
            if (!reader.IsDBNull(2))
                entry += $" | Break: {reader.GetDateTime(2):hh:mm tt}";
            return entry;
        }
        return "No punches found.";
    }
}