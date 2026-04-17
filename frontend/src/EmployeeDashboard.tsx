import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import { type TimePunch, formatTime, getShiftStatus,  type ShiftStatus } from '../src/utils/TimePunchScripts';
import { apiService } from '../src/utils/apiService'; 
import { useNavigate } from 'react-router-dom'

function EmployeeDashboard() {
    const [authStatus, setAuthStatus] = useState(false);
    const [verifiedUserID, setVerifiedUserID] = useState<string | null>(null);
    const [punches, setPunches] = useState<TimePunch[]>([]);
    const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
    const mostRecentPunch = punches.length > 0 ? punches[punches.length - 1] : null;

    //Navigation logic
    const navigate = useNavigate(); 
    const handleNavigation = () => {
        navigate('/employee-login'); //Navigate to the employee dashboard
    }

    const handlePunchAction = async (actionType: string) => {
        console.log(`Performing action: ${actionType} for user ${verifiedUserID}`);
        
        //TODO: Implement the logic to perform the punch action based on the actionType parameter.
        // Here you will call your apiService.performPunch(actionType)
        // and then re-run loadDash() to refresh the UI!
    };

    useEffect(() => {
        const loadDash = async () => {
            try {
                //Call shared service
                const [id, punchData] = await Promise.all([
                    apiService.getVerifiedUserID(),
                    apiService.getTimePunches()
                ]);

                //Set states
                setVerifiedUserID(id.toString());
                setAuthStatus(true);

                //Determine shift status based on most recent punch
                if (punchData.length > 0) {
                    //Sort ascending so the last index is the latest
                    const sorted = [...punchData].sort((a, b) =>
                        new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime()
                    );
                    setPunches(sorted);
                    setShiftStatus(getShiftStatus(sorted[sorted.length - 1]));
                } else {
                    setShiftStatus("Clocked Out"); //Default state if brand new employee
                }
            } catch (error) {
                console.error("Auth failed:", error);
                setAuthStatus(false);
                handleNavigation(); //Redirect to login if auth fails
            }
        };

        loadDash();
    }, []);

    return (
        <div className="app-container">
            <header className="app-header">
                <nav className="nav-links">
                    <Link to="/employee-login" className="nav-link-item">
                        Logout
                    </Link>
                    <Link to="/employee-time-punch-history" className="nav-link-item">
                        Time Punch History
                    </Link>
                </nav>
            </header>

            <main className="main-content">
                <div className="card" style={{ minWidth: '300px' }}>
                    {!authStatus && <p>Checking authorization...</p>}
                    {/* authStatus ? <p>Authorized</p> : <p>Checking authorization...</p> */}
                    <h2>Employee {verifiedUserID}</h2>
                    <p>Status: <strong>{shiftStatus}</strong></p>

                    <ClockInOutStatus shiftStatus={shiftStatus} onAction={handlePunchAction} />

                    {mostRecentPunch && (
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
                            Last Activity: {new Date(mostRecentPunch.clockIn).toLocaleDateString() } at { formatTime(mostRecentPunch.clockIn)}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}

function ClockInOutStatus({ shiftStatus, onAction }: { shiftStatus: ShiftStatus | null, onAction: (actionType: string) => void }) {
    //Helper to keep the JSX clean
    const containerStyle = { display: 'flex', flexDirection: 'column' as const, gap: '10px', marginTop: '15px' };

    switch (shiftStatus) {
        case "Working":
            return (
                <div style={containerStyle}>
                    <button className="action-button" onClick={() => onAction('clock-out')}>Clock Out</button>
                    <button className="action-button" onClick={() => onAction('break-start')}>Start Break</button>
                </div>
            );
        case "Clocked Out":
            return (
                <div style={containerStyle}>
                    <button className="action-button" onClick={() => onAction('clock-in')}>Clock In</button>
                </div>
            );
        case "On Break":
            return (
                <div style={containerStyle}>
                    <button className="action-button" onClick={() => onAction('break-end')}>End Break</button>
                </div>
            );
        default:
            return <button className="action-button" onClick={() => onAction('clock-in')}>Clock In</button>;
    }
}

export default EmployeeDashboard;