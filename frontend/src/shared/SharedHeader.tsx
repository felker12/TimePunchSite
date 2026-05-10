import { Link, useLocation } from 'react-router-dom';
import { type EmployeeRole } from '../utils/TimePunchScripts';

export default function SharedHeader() {
    const location = useLocation();
    const userRole = localStorage.getItem("userRole") as EmployeeRole | null;

    // Check if the user has elevated permissions
    const isManagement = userRole === "Admin" || userRole === "Manager";

    const handleLogout = () => {
        localStorage.clear(); // Wipe token and role
    };

    return (
        <nav className="nav-links">
            {/* Always show Logout */}
            <Link to="/employee-login" className="nav-link-item" onClick={handleLogout}>
                Logout
            </Link>

            {/* Only show Dashboard if we aren't currently on it */}
            {location.pathname !== '/employee-dashboard' && (
                <Link to="/employee-dashboard" className="nav-link-item">
                    Employee Dashboard
                </Link>
            )}

            {/* Only show History if we aren't currently on it */}
            {location.pathname !== '/employee-time-punch-history' && (
                <Link to="/employee-time-punch-history" className="nav-link-item">
                    Time Punch History
                </Link>
            )}

            {/* Only show Admin Dashboard if we aren't currently on it and the user has the appropriate role */}
            {location.pathname !== '/admin-dashboard' && isManagement && (
                <Link to="/admin-dashboard" className="nav-link-item">
                    Admin Dashboard
                </Link>
            )}

        </nav>
    );
}