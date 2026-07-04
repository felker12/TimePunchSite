using System.Text.RegularExpressions;

namespace TimePunchSite.Server.Data
{
    public enum ShiftStatus
    {
        Working,
        OnBreak,
        ClockedOut,
    }

    public struct TimePunchData
    {
        public int EmployeeID { get; set; } = 0;
        public DateTime ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        public DateTime? BreakStart { get; set; }
        public DateTime? BreakEnd { get; set; }
        public int? TimePunchID { get; set; }

        //Expose the status clearly for serialization to the frontend
        //Uses regex to insert a space before uppercase letters (except the first character)
        public readonly string Status => Regex.Replace(GetShiftStatus().ToString(), "(\\B[A-Z])", " $1");

        //Calculate total payable hours
        public readonly double TotalHours
        {
            get
            {
                //Determine end of shift tracking (use current time if still live)
                DateTime shiftEnd = ClockOut ?? DateTime.Now;
                TimeSpan totalShiftTime = shiftEnd - ClockIn;

                //Calculate unpaid break time if a break occurred
                TimeSpan breakTime = TimeSpan.Zero;
                if (BreakStart.HasValue)
                {
                    DateTime breakEndActual = BreakEnd ?? DateTime.Now;
                    breakTime = breakEndActual - BreakStart.Value;
                }

                //Subtract break duration from total shift duration
                TimeSpan netWorkTime = totalShiftTime - breakTime;

                //Return total hours rounded cleanly to 2 decimal places
                return Math.Max(0, Math.Round(netWorkTime.TotalHours, 2));
            }
        }

        public TimePunchData(int employeeId, DateTime clockIn, DateTime? clockOut, DateTime? breakStart, DateTime? breakEnd, int? timePunchID)
            {
                EmployeeID = employeeId;
                ClockIn = clockIn;
                ClockOut = clockOut;
                BreakStart = breakStart;
                BreakEnd = breakEnd;
                TimePunchID = timePunchID;
        }

        public TimePunchData() { }

        public override readonly string ToString()
        {
            return $"EmployeeID: {EmployeeID}, ClockIn: {ClockIn}, ClockOut: {ClockOut}, BreakStart: {BreakStart}, BreakEnd: {BreakEnd}, TimePunchID: {TimePunchID}";
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
