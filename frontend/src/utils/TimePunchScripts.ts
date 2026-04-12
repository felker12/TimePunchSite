export interface TimePunch {
    employeeID: number;
    clockIn: string;     // Dates come across as ISO strings in JSON
    clockOut: string | null;
    breakStart: string | null;
    breakEnd: string | null;
}

export type ShiftStatus = "Working" | "On Break" | "Shift Ended";

export const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getShiftStatus = (punch: TimePunch): ShiftStatus => {
    if (punch.clockIn && !punch.clockOut) {
        return punch.breakStart && !punch.breakEnd ? "On Break" : "Working";
    }
    return "Shift Ended";
};