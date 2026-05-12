import { useEffect, useState } from 'react';
import { type EmployeeRole, type EmployeeView, type TimePunch, formatTime, getEmployeeFullName, getWorkWeek, formatDateToDayOfWeek, ensureUTC} from './utils/TimePunchScripts';
import { apiService } from '../src/utils/apiService';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [verifiedId, setVerifiedId] = useState<number | null>(null);
    const [verifiedRole, setVerifiedRole] = useState<EmployeeRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [employeeData, setEmployeeData] = useState<EmployeeView[]>([]);
    const [date, setDate] = useState(new Date());
    const [weekDates, setWeekDates] = useState<Date[]>([]);

    //Navigation logic
    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate('/employee-dashboard'); //Navigate to the employee log in page
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
        <div className="card">
            <p>Hello user number: {verifiedId}, verified role: {verifiedRole}!</p>
            <h3>Employee Data</h3>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th scope="employeeName"></th>
                        {weekDates.map((d, i) => (
                            <th key={i}>{formatDateToDayOfWeek(d)}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {employeeData.map((employee) => (
                        <tr key={employee.id}>
                            <td scope={getEmployeeFullName(employee)}><strong>{getEmployeeFullName(employee)}</strong></td>
                            {weekDates.map((d, i) => (
                                <td key={i}>
                                    {displayPunches(employee, d)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}

const renderPunches = (employee: EmployeeView, targetDate: Date) => {
    const punches = employee.timePunches.filter(p => dateMatches(p.clockIn, targetDate));

    if (punches.length === 0) return <span className="text-muted">Off</span>;

    return (
        <div className="punch-cell">
            {punches.map((p, i) => (
                <div key={i} className="punch-entry">
                    {formatTimePunchToString(p)}
                </div>
            ))}
        </div>
    );
};

const displayPunches = (employee: EmployeeView, date: Date) => {
    const punches = employee.timePunches.filter(punch => dateMatches(punch.clockIn, date));

    if (punches.length === 0) {
        return <span className="text-muted">Off</span>;
    }

    return (
        <>
            {punches.map((p, i) => (
                <span key={i} className="punch-entry">
                    {formatTimePunchToString(p)}
                </span>
            ))}
        </>
    );
}

const dateMatches = (date1: string, date2: Date) => {
    const d1 = new Date(ensureUTC(date1));

    return d1.toLocaleDateString() === date2.toLocaleDateString();
};

const formatTimePunchToString = (punch: TimePunch): string => {
    //const clockInString = formatTime(punch.clockIn);
    //const breakString = punch.breakStart ? (formatTime(punch.breakStart) + "-") : "" + (punch.breakEnd ? formatTime(punch.breakEnd) : "In Progress");
    //const clockOutString: string = punch.clockOut ? formatTime(punch.clockOut) : "not clocked out";

    //return clockInString + " " + breakString + " " + clockOutString;


    const cin = formatTime(punch.clockIn);
    const cout = punch.clockOut ? formatTime(punch.clockOut) : "??";

    // Only show break info if a break actually happened
    let breakInfo = "";
    if (punch.breakStart) {
        const bStart = formatTime(punch.breakStart);
        const bEnd = punch.breakEnd ? formatTime(punch.breakEnd) : "...";
        breakInfo = ` (b: ${bStart}-${bEnd})`;
    }

    return `${cin} - ${cout}${breakInfo}`;

}

export default AdminDashboard;