import { useEffect, useState } from 'react';
import { type EmployeeRole, type EmployeeView, type TimePunch, formatTime, getWorkWeek, 
    formatDateToDayOfWeek, getEmployeeFullNameShort, dateMatches} from './utils/TimePunchScripts';
import { apiService } from '../src/utils/apiService';
import { useNavigate } from 'react-router-dom';
import { EmployeeDetailCard } from './EmployeeDetailCard';

function AdminDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [verifiedRole, setVerifiedRole] = useState<EmployeeRole | null>(null);
    const [verifiedId, setVerifiedId] = useState<number | null>(null);
    const [employeeData, setEmployeeData] = useState<EmployeeView[]>([]);
    const [date, setDate] = useState(new Date("2026-05-07"));
    const [selectedTP, setSelectedTP] = useState<TimePunch | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeView | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [weekDates, setWeekDates] = useState<Date[]>([]);

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

    const handleClear = () => {
        setSelectedEmployee(null);
        setSelectedTP(null);
    }

    //Helper to format JavaScript Date objects into YYYY-MM-DD local strings for the date picker input
    const toInputDateFormat = (d: Date): string => {
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000)); //Adjusts the date to local timezone to avoid off-by-one-day issues in the picker
        return localDate.toISOString().split('T')[0];
    };

    // Handler when an admin picks a new date from the UI picker
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        //Split the YYYY-MM-DD to instantiate a proper local date object instance 
        const [year, month, day] = e.target.value.split('-').map(Number);
        const newTargetDate = new Date(year, month - 1, day);

        setDate(newTargetDate);
        handleClear(); //Clear active editing cards to avoid mismatched context
    };

    const displayPunch = (employee: EmployeeView, date: Date) => {
        const punches = employee.timePunches.filter(punch => dateMatches(punch.clockIn, date));

        if (punches.length === 0)
            return (
                <div className="punch-container empty-cell"
                    style={{
                        cursor: 'pointer', minHeight: '40px', //Ensures there is a vertical target even if row is short
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '100%', transition: 'background 0.2s',
                        pointerEvents: "none" //click passes straight through
                    }}>
                    <span className="text-muted" style={{ opacity: 0.4 }}>—</span>
                </div>);

        return (
            <div className="punch-container" style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: '0.75rem',
                lineHeight: '1.2',
                gap: '4px',
                pointerEvents: 'none' //Container padding passes clicks through to td for adding new shifts
            }}>
                {punches.map((p, i) => (
                    <div key={i} className="punch-row"
                        style={{
                            cursor: 'pointer', padding: '2px',
                            borderRadius: '4px', transition: 'background 0.2s',
                            pointerEvents: 'auto' //Re-enables pointer tracking explicitly for this specific shift item
                        }}
                        onClick={(e) => {
                            e.stopPropagation(); //Prevents the TD's onClick from creating a blank context
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
        const currentWeek = getWorkWeek(date);
        setWeekDates(currentWeek); //Calculate the dates for the current week to display in the table header

        try {
            const [id, role, employees] = await Promise.all([
                apiService.getVerifiedUserID(),
                apiService.getUserRole(),
                apiService.getTimePunchesForWeek(date) //Get punches for the current week, the backend will handle determining the actual date range
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
    }, [date, navigate]);

    if (isLoading || weekDates.length == 0) return <p>Loading Data...</p>;

    return (
        <div className="admin-dashboard-layout"
            style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', width: '100%' }}>
            <div className="card" style={{ flex: 3 }}>
                <div>
                    <div style={{float: "right"}}>
                        <label htmlFor="adminDatePicker" style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                            Select Pay Period/Week View:
                        </label>
                        <input
                            type="date"
                            id="adminDatePicker"
                            value={toInputDateFormat(date)}
                            onChange={handleDateChange}
                            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
                        />
                    </div>
                </div>

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

            {selectedEmployee !== null && selectedDate !== null && (<EmployeeDetailCard
                employee={selectedEmployee}
                timePunch={selectedTP}
                date={selectedDate}
                onClose={handleClear}
                onSaveSuccess={loadDash}
            />
            )}

        </div>
    );
}

export default AdminDashboard;