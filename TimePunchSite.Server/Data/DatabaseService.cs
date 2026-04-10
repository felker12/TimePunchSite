namespace TimePunchSite.Server.Data
{
    using Microsoft.Data.SqlClient;

    public class DatabaseService(IConfiguration configuration)
    {
        private readonly string _connectionString = configuration.GetConnectionString("TimePunchDB")
                ?? throw new InvalidOperationException("Connection string not found.");

        public SqlConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }
    }
}
