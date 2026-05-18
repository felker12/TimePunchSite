export interface TimePunch {
    employeeID: number;
    clockIn: string;     //Dates come across as ISO strings in JSON
    clockOut: string | null;
    breakStart: string | null;
    breakEnd: string | null;
}

export interface EmployeeView {
    id: number;
    firstName: string;
    lastName: string;
    role: EmployeeRole;
    timePunches: TimePunch[];
}

export type ShiftStatus = "Working" | "On Break" | "Clocked Out";

export type EmployeeRole = "Employee" | "Manager" | "Admin";

//Format the time for display, showing only hours and minutes. If the time is null, return a placeholder.
export const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "--";

    //If it's a string from the DB, append 'Z' to force it to be treated as UTC
    const date = new Date(ensureUTC(dateStr));
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const ensureUTC = (dateStr: string): string => {
    return dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
};  

export const formatDate = (dateStr: string) => {
    return new Date(ensureUTC(dateStr)).toLocaleDateString();
};

export const formatDateShort = (dateStr: string) => {
    return new Date(ensureUTC(dateStr)).toLocaleDateString([], {
        month: 'numeric',
        day: 'numeric'
    });
};

export const formatDateToDayOfWeek = (date: Date): string => {
    return dayOfWeek(date) + ", " + formatDateShort(date.toISOString());
}

export const dayOfWeek = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(ensureUTC(dateInput)) : dateInput;
    return date.toLocaleDateString([], { weekday: 'long' });
};

export const getWorkWeek = (date: Date): Date[] => {
    const dates: Date[] = [];

    const monday = getDateOfMonday(date);

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(currentDate.getDate() + i);
        dates.push(currentDate);
    }

    return dates;
}

export const getDateOfMonday = (date: Date): Date => {
    const day = date.getDay(); //0 (Sun) to 6 (Sat)
    const daysSinceMonday = (day + 6) % 7; //Calculate how many days have passed since Monday
    const lastMonday = new Date(date);
    lastMonday.setDate(lastMonday.getDate() - daysSinceMonday);
    lastMonday.setHours(0, 0, 0, 0); //Set to start of the day for consistency

    return lastMonday;
};

export const dateMatches = (date1: string, date2: Date) => {
    const d1 = new Date(ensureUTC(date1));

    return d1.toLocaleDateString() === date2.toLocaleDateString();
};

//Determine the current status of a shift based on the time punch data.
//If the employee has clocked in but not clocked out, check if they are currently on a break or working.
export const getShiftStatus = (punch: TimePunch): ShiftStatus => {
    if (punch.clockIn && !punch.clockOut) { //If clockIn exists but clockOut doesn't, the shift is still active.
        return punch.breakStart && !punch.breakEnd ? "On Break" : "Working"; //If breakStart exists but breakEnd doesn't, they're on break. Otherwise, they're working.
    }
    return "Clocked Out";
};

export const getBreakCompleted = (punch: TimePunch): boolean => {
    if (punch.breakStart && punch.breakEnd)
    {
        return true;
    }
    
    return false;
}

export const getEmployeeFullName = (employee: EmployeeView) => {
    return `${employee.firstName} ${employee.lastName}`;
};

export const getEmployeeFullNameShort = (employee: EmployeeView) => {
    return `${employee.firstName[0]}. ${employee.lastName}`;
};

export const LogTimePunch = (timePunch: TimePunch) => {
    console.log("employee id: " + timePunch.employeeID);
    console.log("clock in:    " + timePunch.clockIn);
    console.log("break start: " + timePunch.breakStart);
    console.log("break end:   " + timePunch.breakEnd);
    console.log("clock out:   " + timePunch.clockOut);
};