import { useEffect, useState } from 'react';
import { type EmployeeRole, type EmployeeView, type TimePunch, formatTime, getEmployeeFullName, getWorkWeek, formatDateToDayOfWeek, getEmployeeFullNameShort, dateMatches, formatDate} from './utils/TimePunchScripts';
import { apiService } from '../src/utils/apiService';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [verifiedRole, setVerifiedRole] = useState<EmployeeRole | null>(null);
    const [verifiedId, setVerifiedId] = useState<number | null>(null);
    const [employeeData, setEmployeeData] = useState<EmployeeView[]>([]);
    const [date, setDate] = useState(new Date());
    const [weekDates, setWeekDates] = useState<Date[]>([]);
    const [selectedTP, setSelectedTP] = useState<TimePunch | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeView | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    //Navigation logic
    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate('/employee-dashboard'); //Navigate to the employee log in page
    }

    const handleTPClick = (employee: EmployeeView, timePunch: TimePunch | null, date: Date) => {
        setSelectedTP(timePunch);
        setSelectedEmployee(employee);
        setSelectedDate(date);
    }

    const displayPunch = (employee: EmployeeView, date: Date) => {
        const punches = employee.timePunches.filter(punch => dateMatches(punch.clockIn, date));

        if (punches.length === 0)
            return (
                <div className="punch-container empty-cell"
                    style={{
                        cursor: 'pointer', minHeight: '40px', //Ensures there is a vertical target even if row is short
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', transition: 'background 0.2s' }}>
                    <span className="text-muted" style={{ opacity: 0.4 }}>—</span>
                </div>);

        return (
            <div className="punch-container" style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: '0.75rem',
                lineHeight: '1.2',
                gap: '4px'
            }}>
                {punches.map((p, i) => (
                    <div key={i} className="punch-row"
                        style={{ cursor: 'pointer', padding: '2px', borderRadius: '4px', transition: 'background 0.2s' }}
                        onClick={(e) => {
                            e.stopPropagation(); //Prevents the TD's onClick from firing
                            handleTPClick(employee, p, date);
                        }}>
                        <strong>{formatTime(p.clockIn)}</strong> - {p.clockOut ? formatTime(p.clockOut) : <span style={{ color: 'red' }}>LIVE</span>}
                        {p.breakStart && (
                            <div style={{ color: '#666', fontSize: '0.7rem' }}>
                                Break: {formatTime(p.breakStart)}-{p.breakEnd ? formatTime(p.breakEnd) : '...'}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    const loadDash = async () => {
        //TODO: for testing purposes, we can set the date to a specific value to ensure we have consistent data to work with. In production, this would likely be set to the current date.
        const targetDate = new Date("2026-05-07"); // Use a local constant
        setDate(targetDate); //Set the date for testing, this will trigger a reload of the punches for the current week

        const currentWeek = getWorkWeek(targetDate);
        setWeekDates(currentWeek); //Calculate the dates for the current week to display in the table header

        try {
            const [id, role, employees] = await Promise.all([
                apiService.getVerifiedUserID(),
                apiService.getUserRole(),
                apiService.getTimePunchesForWeek(targetDate) //Get punches for the current week, the backend will handle determining the actual date range
            ]);

            //If the user not an admin or manager, we don't want them to access the admin dashboard, 
            //so we redirect them to the employee dashboard instead
            if(role !== 'Admin' && role !== 'Manager') {
                handleNavigation();
                return;
            }

            setVerifiedId(id);
            setVerifiedRole(role);
            setEmployeeData(employees);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            handleNavigation();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDash();
    }, [navigate]);

    if (isLoading || weekDates.length == 0) return <p>Loading Data...</p>;

    return (
        <div className="admin-dashboard-layout"
            style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', width: '100%' }}>
            <div className="card" style={{ flex: 3 }}>
                <h3>Employee Data</h3>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th></th>
                            {weekDates.map((d, i) => (
                                <th key={i}>{formatDateToDayOfWeek(d)}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {employeeData.map((employee) => (
                            <tr key={employee.id}>
                                <td><strong>{getEmployeeFullNameShort(employee)}</strong></td>
                                {weekDates.map((d, i) => (
                                    <td key={i} onClick={() => handleTPClick(employee, null, d)}>
                                        {displayPunch(employee, d)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedEmployee !== null && (<EmployeeDetailCard
                employee={selectedEmployee}
                timePunch={selectedTP}
                date={selectedDate}
            />
            )}

        </div>
    );
}

function EmployeeDetailCard({ employee, timePunch, date }: { employee: EmployeeView, timePunch: TimePunch | null, date: Date }) {
    const [clockIn, setClockIn] = useState("");
    const [breakStart, setBreakStart] = useState("");
    const [breakEnd, setBreakEnd] = useState("");
    const [clockOut, setClockOut] = useState("");

    const validateTPInput = (input: string, isRequired: boolean = false): boolean => {
        if (input !== null) {
            if (input === "") {
                return isRequired; //ClockIn is usually required, others can be empty
            }

            // Regex for HH:mm (24-hour format)
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            return timeRegex.test(input);
        }

        return false;
    }

    const handleSaveClick = () => {
        const checkClockIn = validateTPInput(clockIn, true);

        //Clock In is mandatory for any punch
        if (!checkClockIn) {
            alert("Please enter a valid Clock In time (HH:mm)");
            return;
        }

        //Validate the rest
        const checkBreakStart = validateTPInput(breakStart);
        const checkBreadkEnd = validateTPInput(breakEnd);
        const checkClockOut = validateTPInput(clockOut);

        // Validate the rest
        if (!checkBreakStart || !checkBreadkEnd || !checkClockOut) {
            alert("One or more times are invalid. Use HH:mm format.");
            return;
        }

        const combineDateAndTime = (timeStr: string) => {
            if (!timeStr)
                return null;

            const [hours, minutes] = timeStr.split(':').map(Number);
            const newDate = new Date(date); // Use the date passed from the dashboard
            newDate.setHours(hours, minutes, 0, 0);

            return newDate.toISOString();
        };

        const timePunch: TimePunch = {
            employeeID: employee.id,
            clockIn: combineDateAndTime(clockIn)!,
            breakStart: combineDateAndTime(breakStart),
            breakEnd: combineDateAndTime(breakEnd),
            clockOut: combineDateAndTime(clockOut),
        };

        try {
            if (timePunch) {
                //TODO: Update logic 
            } else {
                //TODO: Create logic
            }

            alert("Success!");
                //TODO: refresh the dashboard
        } catch (err) {
            console.error("Save failed", err);
        }
    }

    useEffect(() => {
        if (timePunch !== null) {
            setClockIn(timePunch.clockIn ? formatTime(timePunch.clockIn): "");
            setBreakStart(timePunch.breakStart ? formatTime(timePunch.breakStart) : "");
            setBreakEnd(timePunch.breakEnd ? formatTime(timePunch.breakEnd) : "");
            setClockOut(timePunch.clockOut ? formatTime(timePunch.clockOut) : "");
        }
        else {
            setClockIn("");
            setBreakStart("");
            setBreakEnd("");
            setClockOut("");
        }
    }, [timePunch]);

    return (
        <div className="card" style={{ flex: 1, position: 'sticky', top: '20px', minWidth: '180px', maxWidth: '250'}}>
            <span><strong>{getEmployeeFullName(employee)}</strong></span>
            <span>{formatDateToDayOfWeek(date)}</span>
            {<div className="employee-card">
                    <span>Clock In</span>
                    <div>
                        <input id="clockInTB"
                            value={clockIn}
                            onChange={(e) => setClockIn(e.target.value)}
                        >
                        </input>
                    </div>
                    <span>Break Start - Break End</span>
                    <div>
                        <input id="breakStartTB"
                            value={breakStart}
                            onChange={(e) => setBreakStart(e.target.value)}
                        >
                        </input>
                        <span> - </span>
                        <input id="breakEndTB"
                            value={breakEnd}
                            onChange={(e) => setBreakEnd(e.target.value)}
                        >
                        </input>
                    </div>
                    <span>Clock Out</span>
                    <div>
                        <input id="clockOutTB"
                            value={clockOut}
                            onChange={(e) => setClockOut(e.target.value)}
                        >
                        </input>
                    </div>
                    
                <button id="updateTP" onClick={() => handleSaveClick()}>{timePunch !== null ? "Save" : "Create" }</button>
                </div>}
        </div>
    );
}

export default AdminDashboard;