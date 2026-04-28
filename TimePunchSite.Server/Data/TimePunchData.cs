namespace TimePunchSite.Server.Data
{
    public enum ShiftStatus
    {
        Working,
        OnBreak,
        ClockedOut
    }

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

        public readonly ShiftStatus GetShiftStatus()
        {
            if (ClockOut.HasValue)                               //If ClockOut has a value, the employee is clocked out
                return ShiftStatus.ClockedOut;
            else if (BreakStart.HasValue && !BreakEnd.HasValue) //If BreakStart has a value and BreakEnd does not, the employee is on break
                return ShiftStatus.OnBreak;
            else                                                //If neither of the above conditions are met, the employee is working
                return ShiftStatus.Working;
        }
    }
}
