import { useState, useEffect } from 'react';
import { apiService } from './utils/apiService';
import { type EmployeeView, type TimePunch, formatTime, getEmployeeFullName, formatDateToDayOfWeek } from './utils/TimePunchScripts';

export function EmployeeDetailCard({ employee, timePunch, date, onClose, onSaveSuccess }: { employee: EmployeeView; timePunch: TimePunch | null; date: Date; onClose: () => void; onSaveSuccess: () => void; }) {
    const [clockIn, setClockIn] = useState("");
    const [breakStart, setBreakStart] = useState("");
    const [breakEnd, setBreakEnd] = useState("");
    const [clockOut, setClockOut] = useState("");

    const validateTPInput = (input: string, isRequired: boolean = false): boolean => {
        if (input === null || input === undefined || input === "") {
            return !isRequired;
        }
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return timeRegex.test(input);
    };

    const handleTimeInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        currentValue: string,
        setterFunc: (v: string) => void
    ) => {
        const rawValue = e.target.value;
        const isDeletion = (e.nativeEvent as InputEvent).inputType === 'deleteContentBackward';

        if (isDeletion && currentValue.includes(':') && !rawValue.includes(':')) {
            const colonIndex = currentValue.indexOf(':');
            const updatedVal = currentValue.slice(0, colonIndex - 1) + currentValue.slice(colonIndex + 1);
            setterFunc(updatedVal);
            return;
        }

        let filteredVal = rawValue.replace(/[^0-9:]/g, '');

        if (filteredVal.length === 2 && !filteredVal.includes(':') && !isDeletion) {
            filteredVal += ':';
        }

        setterFunc(filteredVal);
    };

    const handleSaveClick = async () => {
        if (!validateTPInput(clockIn, true)) {
            alert("Please enter a valid Clock In time (HH:mm)");
            return;
        }
        if (!validateTPInput(breakStart) || !validateTPInput(breakEnd) || !validateTPInput(clockOut)) {
            alert("One or more times are invalid. Use HH:mm format.");
            return;
        }

        const combineDateAndTime = (timeStr: string) => {
            if (!timeStr) return null;
            const [hours, minutes] = timeStr.split(':').map(Number);
            const newDate = new Date(date);
            newDate.setHours(hours, minutes, 0, 0);
            return newDate.toISOString();
        };

        const timePunchPayload: TimePunch = {
            employeeID: employee.id,
            clockIn: combineDateAndTime(clockIn)!,
            breakStart: combineDateAndTime(breakStart),
            breakEnd: combineDateAndTime(breakEnd),
            clockOut: combineDateAndTime(clockOut),
            timePunchID: timePunch?.timePunchID ?? null
        };

        try {
            await apiService.updatePunch(timePunchPayload);
            alert("Success!");
            onSaveSuccess();
            onClose();
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save changes.");
        }
    };

    // New Delete Handler
    const handleDeleteClick = async () => {
        if (!timePunch || !timePunch.timePunchID) return;

        const confirmDelete = window.confirm(
            `Are you sure you want to permanently delete this shift for ${getEmployeeFullName(employee)}?`
        );
        
        if (!confirmDelete) return;

        try {
            await apiService.deletePunch(timePunch.timePunchID);
            alert("Punch deleted successfully.");
            onSaveSuccess(); // Refresh table view grid
            onClose();       // Close card panel context
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete the time punch entry.");
        }
    };

    useEffect(() => {
        if (timePunch !== null) {
            setClockIn(timePunch.clockIn ? formatTime(timePunch.clockIn) : "");
            setBreakStart(timePunch.breakStart ? formatTime(timePunch.breakStart) : "");
            setBreakEnd(timePunch.breakEnd ? formatTime(timePunch.breakEnd) : "");
            setClockOut(timePunch.clockOut ? formatTime(timePunch.clockOut) : "");
        } else {
            setClockIn("");
            setBreakStart("");
            setBreakEnd("");
            setClockOut("");
        }
    }, [timePunch]);

    return (
        <div className="card" style={{ flex: 1, position: 'sticky', top: '20px', minWidth: '180px', maxWidth: '250px' }}>
            <div>
                <span><strong>{getEmployeeFullName(employee)}</strong></span>
                <button id="clearBtn"
                    style={{ width: "30px", float: "right", cursor: "pointer" }}
                    onClick={onClose}
                >
                    X
                </button>
            </div>
            <div style={{ color: '#555', fontSize: '1rem' }}>{formatDateToDayOfWeek(date)}</div>
            <div className="employee-card">
                <label htmlFor="clockInTB" style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold' }}>Clock In</label>
                <div>
                    <input id="clockInTB"
                        type="text"
                        value={clockIn}
                        maxLength={5}
                        onChange={(e) => handleTimeInputChange(e, clockIn, setClockIn)}
                    />
                </div>
                
                <label style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold' }}>Break Start - Break End</label>
                <div>
                    <input id="breakStartTB"
                        value={breakStart}
                        maxLength={5}
                        onChange={(e) => handleTimeInputChange(e, breakStart, setBreakStart)}
                    />
                    <span> - </span>
                    <input id="breakEndTB"
                        value={breakEnd}
                        maxLength={5}
                        onChange={(e) => handleTimeInputChange(e, breakEnd, setBreakEnd)}
                    />
                </div>
                
                <label htmlFor="clockOutTB" style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold' }}>Clock Out</label>
                <div>
                    <input id="clockOutTB"
                        value={clockOut}
                        maxLength={5}
                        onChange={(e) => handleTimeInputChange(e, clockOut, setClockOut)}
                    />
                </div>

                {/* Inline Action Container layout */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                        id="updateTP"
                        style={{ flex: 1 }}
                        onClick={handleSaveClick}
                    >
                        {timePunch !== null ? "Save" : "Create"}
                    </button>
                    
                    {/* Conditionally rendered Delete Button */}
                    {timePunch !== null && (
                        <button 
                            id="deleteTP"
                            style={{ 
                                flex: 1, 
                                backgroundColor: '#dc3545', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer' 
                            }}
                            onClick={handleDeleteClick}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}