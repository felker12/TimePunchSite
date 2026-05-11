namespace TimePunchSite.Server.Data
{
    public static class DateHelper
    {
        public static (DateTime Monday, DateTime Sunday) GetWorkWeek(DateTime day)
        {
            return (GetDateOfMonday(day), GetDateOfNextSunday(day));
        }

        public static void DaysSinceLastMonday()
        {
            DateTime today = DateTime.Today;
            int daysSinceMonday = ((int)today.DayOfWeek + 6) % 7; //Calculate how many days have passed since Monday
            DateTime lastMonday = today.AddDays(-daysSinceMonday); //Subtract that number of days from today
            Console.WriteLine($"Last Monday's date was: {lastMonday:yyyy-MM-dd}");
        }

        public static void DaysSinceMonday(DateTime day)
        {
            int daysSinceMonday = ((int)day.DayOfWeek + 6) % 7; //Calculate how many days have passed since Monday
            DateTime lastMonday = day.AddDays(-daysSinceMonday); //Subtract that number of days from today
            Console.WriteLine($"Last Monday's date was: {lastMonday:yyyy-MM-dd}");
        }

        public static DateTime GetDateOfMonday(DateTime day)
        {
            //If the day is already Monday, this will return the same day. Otherwise, it will return the most recent Monday.
            int daysSinceMonday = ((int)day.DayOfWeek + 6) % 7; //Calculate how many days have passed since Monday
            return day.AddDays(-daysSinceMonday).Date; //Subtract that number of days from the given day (.Date clears the time component)
        }

        public static DateTime GetDateOfSunday(DateTime day)
        {
            //If the day is already Sunday, this will return the same day. Otherwise, it will return the most recent Sunday.
            int daysSinceSunday = ((int)day.DayOfWeek) % 7; //Calculate how many days have passed since Sunday
            return day.AddDays(-daysSinceSunday).Date; //Subtract that number of days from the given day (.Date clears the time component)
        }

        public static DateTime GetDateOfNextMonday(DateTime day)
        {
            //If the day is already Monday, this will return the same day. Otherwise, it will return the next Monday.
            int daysUntilMonday = (7 - (int)day.DayOfWeek + 1) % 7; //Calculate how many days until the next Monday
            return day.AddDays(daysUntilMonday).Date; //Add that number of days to the given day (.Date clears the time component)
        }

        public static DateTime GetDateOfNextSunday(DateTime day)
        {
            //If the day is already Sunday, this will return the same day. Otherwise, it will return the next Sunday.
            int daysUntilSunday = (7 - (int)day.DayOfWeek) % 7; //Calculate how many days until the next Sunday
            return day.AddDays(daysUntilSunday).Date; //Add that number of days to the given day (.Date clears the time component)
        }
    }
}
