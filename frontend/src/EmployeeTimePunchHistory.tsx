import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';


function EmployeeTimePunchHistory() {
    const [authStatus, setAuthStatus] = useState(false);
    const [verifiedUserID, setVerifiedUserID] = useState<string | null>(null);
    const [punches, setPunches] = useState<string[]>([]);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem("token"); // Retrieve token stored during login
            console.log("Using Token:", token); // Verify this matches the token you decoded //TODO delete this line after verifying the token is correct

            try {
                const response = await fetch('/api/get-timepunches', {
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
              <div className="card" style={{ minWidth: '300px' }}>
                  {authStatus ?? <p>Checking authorization...</p>}
                  {/* authStatus ? <p>Authorized</p> : <p>Checking authorization...</p> */}
                  <h2>Employee {verifiedUserID}'s Time History</h2>
                  {punches.length > 0 ? (
                      <div style={{ textAlign: 'left', marginTop: '10px' }}>
                          {punches.map((punchStr, index) => (
                              <div key={index} style={{
                                  padding: '8px',
                                  borderBottom: '1px solid #eee',
                                  fontSize: '14px'
                              }}>
                                  {punchStr}
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p>No punch history found.</p>
                  )}
              </div>
          </main>
      </div>
  );
}

export default EmployeeTimePunchHistory;