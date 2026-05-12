import { useEffect, useState } from 'react';
import { type EmployeeRole, type EmployeeView, type TimePunch, formatTime, getEmployeeFullName, getWorkWeek, formatDateToDayOfWeek} from './utils/TimePunchScripts';
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
        setWeekDates(getWorkWeek(date)); //Calculate the dates for the current week to display in the table header

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
    }, [navigate]);

    if (isLoading) return <p>Verifying credentials...</p>;

    return (
        <div className="card">
            <p>Hello user number: {verifiedId}, verified role: {verifiedRole}!</p>
            <h3>Employee Data</h3>

            <table className="time-table">
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
                            <td>{displayPunches(employee, weekDates[0])}</td>
                            <td>{displayPunches(employee, weekDates[1])}</td>
                            <td>{displayPunches(employee, weekDates[2])}</td>
                            <td>{displayPunches(employee, weekDates[3])}</td>
                            <td>{displayPunches(employee, weekDates[4])}</td>
                            <td>{displayPunches(employee, weekDates[5])}</td>
                            <td>{displayPunches(employee, weekDates[6])}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}

const displayPunches = (employee: EmployeeView, date: Date): string[] | string => {
    const punches = employee.timePunches.filter(punch => dateMatches(punch.clockIn, date));

    if (punches.length === 0) {
        return "off";
    }

    if (punches.length === 1) {
        return formatTimePunchToString(punches[0]);
    }

    //const returnStrings: string[] = [];

    for (let i = 0; i < punches.length; i++) {
        //returnStrings.push("test string" + i + " ");
    }

    //return returnStrings;

    return "multiple shifts"
}

const dateMatches = (date1: Date | string, date2: Date | string) => {
    const d1 = new Date(typeof date1 === 'string' ? new Date(date1) : date1);
    const d2 = new Date(typeof date2 === 'string' ? new Date(date2) : date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.toLocaleDateString() === d2.toLocaleDateString();
};

const employeeHasPunchForDate = (employee: EmployeeView, date: Date): boolean => {
    return employee.timePunches.some(punch => dateMatches(punch.clockIn, date));
};

const formatTimePunchToString = (punch: TimePunch): string => {
    const clockInString = formatTime(punch.clockIn);
    const breakString = punch.breakStart ? (formatTime(punch.breakStart) + "-") : "" + (punch.breakEnd ? formatTime(punch.breakEnd) : "In Progress");
    const clockOutString: string = punch.clockOut ? formatTime(punch.clockOut) : "not clocked out";

    return clockInString + " " + breakString + " " + clockOutString;
}

export default AdminDashboard;