using Microsoft.Data.SqlClient;
using System.Data;
using TimePunchSite.Server.Security;

namespace TimePunchSite.Server.Data;

public enum EmployeeRole
{
    Employee = 1,
    Admin = 2,
    Manager = 3
}

public record LoginResult(bool Success, EmployeeRole? Role = null);

public class EmployeeRepository(DatabaseService database, PasswordService passwordService)
{
    private readonly DatabaseService _database = database;
    private readonly PasswordService _passwordService = passwordService;

    public LoginResult CheckLogin(int id, string pass)
    {
        if (id < 1 || string.IsNullOrEmpty(pass))
            return new LoginResult(false);

        using var connection = _database.CreateConnection();

        const string query =
            "SELECT PasswordHash, Salt, RoleID FROM dbo.Employees WHERE ID = @id";

        using var command = new SqlCommand(query, connection);
        command.Parameters.Add("@id", SqlDbType.Int).Value = id;

        connection.Open();

        using var reader = command.ExecuteReader();

        if (reader.Read())
        {
            byte[] storedHash = (byte[])reader["PasswordHash"];
            byte[] storedSalt = (byte[])reader["Salt"];

            if(_passwordService.VerifyPassword(pass, storedHash, storedSalt))
            {
                EmployeeRole role = (EmployeeRole)reader["RoleID"];
                return new LoginResult(true, role);
            }
        }

        return new LoginResult(false);
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

    /// <summary>
    /// Gets a dictionary of employee time punches for a given work week based on the input day.
    /// </summary>
    /// <param name="day">The day for which to base the .</param>
    /// <returns>A dictionary mapping employee IDs to their time punches.</returns>
    public Dictionary<int, EmployeeView> GetEmployeeTimePunchesDictionaryForWeek(DateTime day)
    {
        DateTime monday = DateHelper.GetDateOfMonday(day);
        DateTime nextMonday = DateHelper.GetDateOfNextMonday(monday.AddDays(1));

        using var connection = _database.CreateConnection();
        const string queryString = @"
                SELECT t.ClockIn, t.ClockOut, t.BreakStart, t.BreakEnd, e.FirstName, e.LastName, t.EmployeeID, e.RoleID
                FROM dbo.TimePunches t JOIN dbo.Employees e
                ON t.EmployeeID = e.ID
                WHERE t.ClockIn >= @monday AND t.ClockIn < @nextMonday
                Order by t.EmployeeID desc";

        using SqlCommand command = new(queryString, connection);
        command.Parameters.Add("@monday", SqlDbType.DateTime2).Value = monday;
        command.Parameters.Add("@nextMonday", SqlDbType.DateTime2).Value = nextMonday;

        connection.Open();

        using var reader = command.ExecuteReader();

        var employeeMap = new Dictionary<int, EmployeeView>();

        while (reader.Read())
        {
            // Process each row
            int employeeId = reader.GetInt32(reader.GetOrdinal("EmployeeID"));

            if (!employeeMap.TryGetValue(employeeId, out EmployeeView? employee))
            {
                employee = new EmployeeView
                {
                    ID = employeeId,
                    FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                    LastName = reader.GetString(reader.GetOrdinal("LastName")),
                    Role = (EmployeeRole)reader.GetInt32(reader.GetOrdinal("RoleID")),
                    TimePunches = []
                };

                employeeMap.Add(employeeId, employee);
            }

            employee.TimePunches.Add(new TimePunchData
            {
                EmployeeID = employeeId,
                ClockIn = reader.GetDateTime(reader.GetOrdinal("ClockIn")),
                ClockOut = reader.IsDBNull(reader.GetOrdinal("ClockOut")) ? null : reader.GetDateTime(reader.GetOrdinal("ClockOut")),
                BreakStart = reader.IsDBNull(reader.GetOrdinal("BreakStart")) ? null : reader.GetDateTime(reader.GetOrdinal("BreakStart")),
                BreakEnd = reader.IsDBNull(reader.GetOrdinal("BreakEnd")) ? null : reader.GetDateTime(reader.GetOrdinal("BreakEnd"))
            });
        }

        return employeeMap;
    }

    public List<EmployeeView> GetEmployeeTimePunchesListForWeek(DateTime day)
    {
        return [.. GetEmployeeTimePunchesDictionaryForWeek(day).Values];
    }
}