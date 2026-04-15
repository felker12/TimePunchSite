export interface TimePunch {
    employeeID: number;
    clockIn: string;     //Dates come across as ISO strings in JSON
    clockOut: string | null;
    breakStart: string | null;
    breakEnd: string | null;
}

export type ShiftStatus = "Working" | "On Break" | "Clocked Out";

//Format the time for display, showing only hours and minutes. If the time is null, return a placeholder.
export const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

//Determine the current status of a shift based on the time punch data.
//If the employee has clocked in but not clocked out, check if they are currently on a break or working.
export const getShiftStatus = (punch: TimePunch): ShiftStatus => {
    if (punch.clockIn && !punch.clockOut) { //If clockIn exists but clockOut doesn't, the shift is still active.
        return punch.breakStart && !punch.breakEnd ? "On Break" : "Working"; //If breakStart exists but breakEnd doesn't, they're on break. Otherwise, they're working.
    }
    return "Clocked Out";
};