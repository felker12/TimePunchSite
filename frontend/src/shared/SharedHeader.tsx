import { Link, useLocation } from 'react-router-dom';

export default function SharedHeader() {
    const location = useLocation();

    return (
        <nav className="nav-links">
            {/* Always show Logout */}
            <Link to="/employee-login" className="nav-link-item">
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
        </nav>
    );
}