import { useLocation, useNavigate, Link } from 'react-router-dom';
import './App.css';

function EmployeeDashboard() {
    const { state } = useLocation();
    const userID = state?.id; // Get the userID from the navigation state

    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate(''); // Navigate to next page (placeholder for now))
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <Link to="/employee-login"> Employee Login </Link>
            </header>

            <main className="main-content">
                <div className="card" style={{ minWidth: '300px' }}>
                    <p>Hello {userID}!</p>
                </div>
            </main>
        </div>
    );
}

export default EmployeeDashboard;