import { useEffect, useState } from 'react';
import { type EmployeeRole, type EmployeeView, type TimePunch, formatTime, getEmployeeFullName, getWorkWeek, formatDateToDayOfWeek, ensureUTC, getEmployeeFullNameShort} from './utils/TimePunchScripts';
import { apiService } from '../src/utils/apiService';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    //const [verifiedId, setVerifiedId] = useState<number | null>(null);
    //const [verifiedRole, setVerifiedRole] = useState<EmployeeRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [employeeData, setEmployeeData] = useState<EmployeeView[]>([]);
    const [date, setDate] = useState(new Date());
    const [weekDates, setWeekDates] = useState<Date[]>([]);
    const [selectedTP, setSelectedTP] = useState<TimePunch | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeView | null>(null);

    //Navigation logic
    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate('/employee-dashboard'); //Navigate to the employee log in page
    }

    const handleTPClick = (employee: EmployeeView, timePunch: TimePunch | null) => {
        setSelectedTP(timePunch);
        setSelectedEmployee(employee);
    }

    const displayPunches = (employee: EmployeeView, date: Date) => {
        const punches = employee.timePunches.filter(punch => dateMatches(punch.clockIn, date));

        if (punches.length === 0)
            return (
                <div className="punch-container empty-cell"
                    style={{
                        cursor: 'pointer', minHeight: '40px', // Ensures there is a vertical target even if row is short
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
                            e.stopPropagation(); // Prevents the TD's onClick from firing
                            handleTPClick(employee, p);
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

    const dateMatches = (date1: string, date2: Date) => {
        const d1 = new Date(ensureUTC(date1));

        return d1.toLocaleDateString() === date2.toLocaleDateString();
    };


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

            //setVerifiedId(id);
            //setVerifiedRole(role);
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
                                    <td key={i} onClick={() => handleTPClick(employee, null)}>
                                        {displayPunches(employee, d)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedEmployee !== null && (
                <div className="card"
                    style={{ flex: 1, position: 'sticky', top: '20px', minWidth: '300px' }}>
                    <span>{ getEmployeeFullName(selectedEmployee)}</span>
                </div>
            )}

        </div>
    );
}

export default AdminDashboard;