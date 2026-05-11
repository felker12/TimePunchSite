import { useEffect, useState } from 'react';
import { type EmployeeRole, type EmployeeView, formatDate, formatTime, getShiftStatus, dayOfWeek, getEmployeeFullName, getWorkWeek, formatDateToDayOfWeek} from './utils/TimePunchScripts';
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
        setDate(new Date("2026-05-07")); //Set the date to today, this will trigger a reload of the punches for the current week
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
                <tr>
                    <th scope="employeeName"></th>
                    {weekDates.map((d, i) => (
                        <th key={i}>{formatDateToDayOfWeek(d)}</th>
                    ))}
                </tr>

                <tbody>
                    {employeeData.map((employee) => (
                        <tr key={employee.id}>
                            <td scope={getEmployeeFullName(employee)}>{getEmployeeFullName(employee)}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}

export default AdminDashboard;