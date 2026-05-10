import { useEffect, useState } from 'react';
import { type EmployeeRole } from './utils/TimePunchScripts';
import { apiService } from '../src/utils/apiService';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const userRole = localStorage.getItem("userRole") as EmployeeRole | null; //temp

    const [verifiedId, setVerifiedId] = useState<number | null>(null);
    const [verifiedRole, setVerifiedRole] = useState<EmployeeRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    //Navigation logic
    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate('/employee-dashboard'); //Navigate to the employee log in page
    }

    const loadDash = async () => {
        try {
            const [id, role] = await Promise.all([
                apiService.getVerifiedUserID(),
                apiService.getUserRole()
            ]);

            //If the user not an admin or manager, we don't want them to access the admin dashboard, 
            //so we redirect them to the employee dashboard instead
            if(role !== 'Admin' && role !== 'Manager') {
                handleNavigation();
                return;
            }

            setVerifiedId(id);
            setVerifiedRole(role);
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
            <p>Hello user number: {verifiedId}, role: {userRole}, verified role: {verifiedRole}!</p>
        </div>
    );
}

export default AdminDashboard;