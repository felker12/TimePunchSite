using Konscious.Security.Cryptography;
using System.Security.Cryptography;
using System.Text;

namespace TimePunchSite.Server.Security;

public class PasswordService
{
    public byte[] CreateSalt() => RandomNumberGenerator.GetBytes(16);

    public byte[] HashPassword(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password));

        argon2.Salt = salt;
        argon2.DegreeOfParallelism = 8;
        argon2.Iterations = 4;
        argon2.MemorySize = 1024 * 64;

        return argon2.GetBytes(32);
    }

    public bool VerifyPassword(string enteredPassword, byte[] storedHash, byte[] storedSalt)
    {
        var newHash = HashPassword(enteredPassword, storedSalt);
        return CryptographicOperations.FixedTimeEquals(storedHash, newHash);
    }
}