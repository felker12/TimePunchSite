using Microsoft.Data.SqlClient;
using System.Data;
using TimePunchSite.Server.Security;

namespace TimePunchSite.Server.Data;

public class EmployeeRepository
{
    private readonly DatabaseService _database;
    private readonly PasswordService _passwordService;

    public EmployeeRepository(DatabaseService database, PasswordService passwordService)
    {
        _database = database;
        _passwordService = passwordService;
    }

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
}