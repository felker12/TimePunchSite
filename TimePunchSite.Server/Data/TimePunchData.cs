namespace TimePunchSite.Server.Data
{
    public struct TimePunchData
    {
        public int EmployeeID { get; set; } = 0;
        public DateTime ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        public DateTime? BreakStart { get; set; }
        public DateTime? BreakEnd { get; set; }

        public TimePunchData(int employeeId, DateTime clockIn, DateTime? clockOut, DateTime? breakStart, DateTime? breakEnd)
            {
                EmployeeID = employeeId;
                ClockIn = clockIn;
                ClockOut = clockOut;
                BreakStart = breakStart;
                BreakEnd = breakEnd;
        }

        public TimePunchData() { }

        public override readonly string ToString()
        {
            return $"EmployeeID: {EmployeeID}, ClockIn: {ClockIn}, ClockOut: {ClockOut}, BreakStart: {BreakStart}, BreakEnd: {BreakEnd}";
        }
    }
}
