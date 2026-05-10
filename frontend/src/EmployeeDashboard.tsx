import { useEffect, useState } from 'react';
import './App.css';
import { type TimePunch, formatTime, getShiftStatus, getBreakCompleted,  type ShiftStatus, formatDate } from '../src/utils/TimePunchScripts';
import { apiService } from '../src/utils/apiService'; 
import { useNavigate } from 'react-router-dom';

function EmployeeDashboard() {
    const [authStatus, setAuthStatus] = useState(false);
    const [verifiedUserID, setVerifiedUserID] = useState<string | null>(null);
    const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
    const [breakCompleted, setBreakCompleted] = useState<boolean>(false);
    const [mostRecentPunch, setMostRecentPunch] = useState<TimePunch | null>(null);

    //Navigation logic
    const navigate = useNavigate(); 
    const handleNavigation = () => {
        navigate('/employee-login'); //Navigate to the employee dashboard
    }

    const handlePunchAction = async (actionType: string) => {
        try {
            await apiService.performPunch(actionType); //Call shared service to perform the punch action

            await loadDash(); //Refresh the dashboard data after performing the punch action
        } catch (error) {
            alert("Failed to record time punch. Please try again.");
        }

        console.log(`Action ${actionType} performed successfully. Refreshing dashboard...`);
    };

    const loadDash = async () => {
        try {
            //Call shared service
            const [id, punchData] = await Promise.all([
                apiService.getVerifiedUserID(),
                apiService.getTimePunches(1)
            ]);

            //Set states
            setVerifiedUserID(id.toString());
            setAuthStatus(true);

            //Determine shift status based on most recent punch
            if (punchData.length > 0) {
                const latestPunch = punchData[0]; //Get the most recent punch (should be the only one since we requested 1 punch)

                setMostRecentPunch(latestPunch);
                setShiftStatus(getShiftStatus(latestPunch));
                setBreakCompleted(getBreakCompleted(latestPunch));
            } else {
                setShiftStatus("Clocked Out"); //Default state if brand new employee
                setBreakCompleted(false);
                setMostRecentPunch(null);
            }
        } catch (error) {
            console.error("Auth failed:", error);
            setAuthStatus(false);
            handleNavigation(); //Redirect to login if auth fails
        }
    };

    useEffect(() => {
        loadDash();
    }, []);

    return (
        <div className="card" style={{ minWidth: '300px' }}>
            {!authStatus && <p>Checking authorization...</p>}
            <h2>Employee {verifiedUserID}</h2>
            <p>Status: <strong>{shiftStatus}</strong></p>

            <ClockInOutStatus shiftStatus={shiftStatus} breakOver={breakCompleted} onAction={handlePunchAction} />

            {mostRecentPunch && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
                    Last Activity: {formatDate(mostRecentPunch.clockIn)} at {formatTime(mostRecentPunch.clockIn)}
                </p>
            )}
        </div>
    );
}

function ClockInOutStatus({ shiftStatus, breakOver, onAction }: { shiftStatus: ShiftStatus | null, breakOver: boolean, onAction: (actionType: string) => void }) {
    //Helper to keep the JSX clean
    const containerStyle = { display: 'flex', flexDirection: 'column' as const, gap: '10px', marginTop: '15px' };

    switch (shiftStatus) {
        case "Working":
            return (
                <div style={containerStyle}>
                    <button className="action-button" onClick={() => onAction('clock-out')}>Clock Out</button>
                    {!breakOver && <button className="action-button" onClick={() => onAction('break-start')}>Start Break</button>}
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