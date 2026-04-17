using Konscious.Security.Cryptography;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace TestingProject
{
    internal class Program
    {
        static void Main(string[] _)
        {
            //load the configuration from user secrets
            IConfiguration config = new ConfigurationBuilder()
                .AddUserSecrets<Program>() // Searches the assembly for the UserSecretsId
                .Build();

            if (config == null)
            {
                Console.WriteLine("Failed to build configuration.");
                return;
            }

            string connectionString = config.GetConnectionString("TimePunchDB") ?? string.Empty;

            Console.WriteLine("Attempting to retrieve connection string...");

            if (connectionString == null || connectionString == string.Empty)
            {
                Console.WriteLine("Failed to retrieve connection string.");
                return;
            }

            Console.WriteLine("Connection string retrieved successfully!");

            //Console.WriteLine($"\n===test===\n");

            Console.WriteLine("\nLog in was successful for ID 1: " + CheckLogin(connectionString, 1, "password1"));
            Console.WriteLine("\nLog in was successful for ID 2: " + CheckLogin(connectionString, 2, "password2"));
            var test = CheckLogin(connectionString, 3, "Password1");

            Console.WriteLine($"Log in was successful for ID 3: {test}");
            Console.WriteLine();

            //Console.WriteLine($"\n===test===\n");

            //Console.WriteLine(CheckLogin(connectionString, 1, "password2"));

            //int id = CreateEmployee(connectionString, "password1", "Jacob", "Bo");
            //Console.WriteLine($"Employee number: {id} was successfully created\n");

            TestQuery2(connectionString);
            TestQuery(connectionString);


            Console.ReadLine(); //keep the console open until the user presses Enter
        }

        private static byte[] CreateSalt() => RandomNumberGenerator.GetBytes(16);

        private static byte[] HashPassword(string password, byte[] salt)
        {
            using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password));
            argon2.Salt = salt;
            argon2.DegreeOfParallelism = 8; // core count
            argon2.Iterations = 4;
            argon2.MemorySize = 1024 * 64; // 64 MB

            return argon2.GetBytes(32);
        }

        public static bool VerifyPassword(string enteredPassword, byte[] storedHash, byte[] storedSalt)
        {
            byte[] newHash = HashPassword(enteredPassword, storedSalt);

            //Compare the hashes in "Fixed Time" to prevent hackers from guessing based on how long the comparison takes
            return CryptographicOperations.FixedTimeEquals(storedHash, newHash);
        }

        //create an employee and return their id
        private static int CreateEmployee(string connectionString, string pass, string firstName, string lastName)
        {
            if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(pass) || string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
                return -1;

            byte[] salt = CreateSalt();
            byte[] hash = HashPassword(pass, salt);

            using SqlConnection connection = new(connectionString);

            const string queryString = "insert into dbo.Employees (PasswordHash, Salt, FirstName, LastName) " +
                "values (@hash, @salt, @fName, @lName);" + 
                "SELECT CAST(SCOPE_IDENTITY() AS INT)";

            using SqlCommand command = new(queryString, connection); 
            command.Parameters.AddWithValue("@hash", hash);
            command.Parameters.AddWithValue("@salt", salt);
            command.Parameters.AddWithValue("@fName", firstName);
            command.Parameters.AddWithValue("@lName", lastName);

            connection.Open();

            var result = command.ExecuteScalar();
            return result != DBNull.Value ? Convert.ToInt32(result) : -1;
        }

        //
        private static bool CheckLogin(string connectionString, int id, string pass)
        {
            if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(pass) || id < 1)
                return false;

            using SqlConnection connection = new(connectionString);

            const string queryString = "SELECT PasswordHash, Salt FROM dbo.Employees WHERE ID = @id";

            using SqlCommand command = new(queryString, connection);
            command.Parameters.Add("@id", SqlDbType.Int).Value = id;

            try
            {
                connection.Open();
                using SqlDataReader reader = command.ExecuteReader();

                //Check if the user exists
                if (reader.Read())
                {
                    //Extract the binary data from the columns
                    byte[] storedHash = (byte[])reader["PasswordHash"];
                    byte[] storedSalt = (byte[])reader["Salt"];

                    return VerifyPassword(pass, storedHash, storedSalt);
                }
            }
            catch (SqlException e)
            {
                Console.WriteLine($"Database Error: {e.Message}");
            }

            // If we reach here, either the ID doesn't exist or verification failed
            return false;
        }

        private static async void TestQuery2(string connectionString)
        {
            try
            {
                await using var connection = new SqlConnection(connectionString);
                Console.WriteLine("=========================================\n");

                await connection.OpenAsync();
                Console.WriteLine("Connection successful!");

                var sql = "Select * from dbo.Employees";
                await using var command = new SqlCommand(sql, connection);
                await using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var id = reader.GetInt32(0);
                    // Extract the binary data
                    var hashBytes = (byte[])reader[1];
                    var saltBytes = (byte[])reader[2];

                    // Convert to Base64 String for the console
                    string hashBase64 = Convert.ToBase64String(hashBytes);

                    // We'll just show the first 15 characters of the hash so the console stays clean
                    string hashPreview = hashBase64.Length > 15 ? string.Concat(hashBase64.AsSpan(0, 15), "...") : hashBase64;

                    var fName = reader.GetString(3);
                    var lName = reader.GetString(4);

                    //Console.WriteLine($"ID: {id} | Name: {fName} {lName}");

                    Console.WriteLine($"ID: {id} | Name: {fName} {lName} | Hash: {hashPreview}");
                }
            }
            catch (SqlException e)
            {
                Console.WriteLine($"SQL Error: {e.Message}");
            }
            catch (Exception e)
            {
                Console.WriteLine(e.ToString());
            }
        }

        private static void TestQuery(string connectionString, string queryString = "Select * from dbo.TimePunches")
        {
            try
            {
                using SqlConnection connection = new(connectionString);
                connection.Open();
                Console.WriteLine("Connection successful!");

                // Example of executing a query
                using SqlCommand command = new(queryString, connection);
                using SqlDataReader reader = command.ExecuteReader();

                while (reader.Read())
                {
                    // Process the results (access columns by name or index)
                    //Console.WriteLine(String.Format("{0} | {1}", reader[0], reader[1]));
                    Console.WriteLine(String.Format("{0} | {1} | {2} | {3} | {4} | {5}", reader[0], reader[1], reader[2], reader[3], reader[4], reader[5]));
                }
            }
            catch (SqlException ex)
            {
                Console.WriteLine("An sql error occurred: " + ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine("An general error occurred: " + ex.Message);
            }
        }
    }
}