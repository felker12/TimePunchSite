namespace TimePunchSite.Server.Data
{
    public class EmployeeView
    {
        public int ID { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public EmployeeRole Role { get; set; } = EmployeeRole.Employee;
        public List<TimePunchData> TimePunches { get; set; } = [];

        public EmployeeView() { }

        public EmployeeView(int id, string firstName, string lastName, EmployeeRole role)
        {
            ID = id;
            FirstName = firstName;
            LastName = lastName;
            Role = role;
        }

        public override string ToString()
        {
            return $"ID: {ID}, Name: {FirstName} {LastName}, Role: {Role}";
        }

        public string GetFullName()
        {
            return $"{FirstName} {LastName}";
        }

        public string GetRoleString()
        {
            return Role.ToString();
        }

        public string TimePunchesToString()
        {
            return string.Join("\n", TimePunches.Select(tp => tp.ToString()));
        }
    }
}
