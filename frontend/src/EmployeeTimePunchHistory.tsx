import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';

interface TimePunch {
    employeeID: number;
    clockIn: string;     // Dates come across as ISO strings in JSON
    clockOut: string | null;
    breakStart: string | null;
    breakEnd: string | null;
}

type ShiftStatus = "Working" | "On Break" | "Shift Ended";

const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getShiftStatus = (punch: TimePunch): ShiftStatus => {
    if (punch.clockIn && !punch.clockOut) {
        return punch.breakStart && !punch.breakEnd ? "On Break" : "Working";
    }
    return "Shift Ended";
};

function EmployeeTimePunchHistory() {
    const [authStatus, setAuthStatus] = useState(false);
    const [verifiedUserID, setVerifiedUserID] = useState<string | null>(null);
    const [punches, setPunches] = useState<TimePunch[]>([]);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem("token"); // Retrieve token stored during login
            console.log("Using Token:", token); // Verify this matches the token you decoded //TODO delete this line after verifying the token is correct

            try {
                const response = await fetch('/api/get-timepunches-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` //Send the JWT
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setPunches(data);
                    setAuthStatus(true); //Should show "Secure endpoint"
                } else {
                    setAuthStatus(false);
                }
            } catch (error) {
                setAuthStatus(false);
            }
        };

        verifyAuth();

        const getUserIDFromStorage = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch('/api/get-user-id', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` //Send the JWT
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setVerifiedUserID(data.id);
                } else {
                    console.log("Failed to get user ID:", response.status);
                }
            } catch (error) {
                console.log("Network error getting user ID.");
            }
        }

        getUserIDFromStorage();
    }, []);

  return (
      <div className="app-container">
          <header className="app-header">
              <nav className="nav-links">
                  <Link to="/employee-login" className="nav-link-item">
                      Logout
                  </Link>
                  <Link to="/employee-dashboard" className="nav-link-item">
                      Employee Dashboard
                  </Link>
              </nav>
          </header>

          <main className="main-content">
              <div className="card" style={{ minWidth: '400px', width: '70%' }}>
                  {!authStatus && <p>Checking authorization...</p>}
                  {/* authStatus ? <p>Authorized</p> : <p>Checking authorization...</p> */}
                  <h2>Employee {verifiedUserID}'s Time History</h2>
                  {punches.length > 0 ? (
                      <table className="time-table">
                          <thead>
                              <tr>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th>Clock In</th>
                                  <th>Break</th>
                                  <th>Clock Out</th>
                              </tr>
                          </thead>
                          <tbody>
                              {punches.map((p, index) => (
                                  <tr key={index}>
                                      <td>{new Date(p.clockIn).toLocaleDateString()}</td>
                                      <td>
                                          <span className={`status-badge ${getShiftStatus(p).toLowerCase().replace(' ', '-')}`}>
                                              {getShiftStatus(p)}
                                          </span>
                                      </td>
                                      <td>{formatTime(p.clockIn)}</td>
                                      <td>
                                          {p.breakStart ? `${formatTime(p.breakStart)} - ${formatTime(p.breakEnd)}` : "No Break"}
                                      </td>
                                      <td>{formatTime(p.clockOut)}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : (
                      <p>No punch history found.</p>
                  )}
              </div>
          </main>
      </div>
  );
}

export default EmployeeTimePunchHistory;