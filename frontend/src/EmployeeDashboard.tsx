import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';



function EmployeeDashboard() {
    const { state } = useLocation();
    const userID = state?.id; // Get the userID from the navigation state
    const [authStatus, setAuthStatus] = useState<string>("Checking authorization...");

    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate(''); // Navigate to next page (placeholder for now))
    }

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem("token"); // Retrieve token stored during login
            console.log("Using Token:", token); // Verify this matches the token you decoded //TODO delete this line after verifying the token is correct

            try {
                const response = await fetch('/api/get-timepunches', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Send the JWT
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setAuthStatus(`Authorized: ${data}`); // Should show "Secure endpoint"
                } else {
                    setAuthStatus("Authorization failed: " + response.status);
                }
            } catch (error) {
                setAuthStatus("Network error verifying authorization.");
            }
        };

        verifyAuth();
    }, []);

    return (
        <div className="app-container">
            <header className="app-header">
                <Link to="/employee-login"> Employee Login </Link>
            </header>

            <main className="main-content">
                <div className="card" style={{ minWidth: '300px' }}>
                    <p>Hello Employee {userID}!</p>
                    <p>{authStatus}</p>
                </div>
            </main>
        </div>
    );
}

export default EmployeeDashboard;