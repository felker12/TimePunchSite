import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import { type TimePunch, formatTime, getShiftStatus } from '../src/utils/TimePunchScripts'; 
import { apiService } from '../src/utils/apiService'; 
import { useNavigate } from 'react-router-dom'

function EmployeeTimePunchHistory() {
    const [punches, setPunches] = useState<TimePunch[]>([]);
    const [verifiedUserID, setVerifiedUserID] = useState<number | null>(null);

    //Navigation logic
    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate('/employee-login'); //Navigate to the employee dashboard
    }

    useEffect(() => {
        const loadData = async () => {
            try {
                //Call shared service
                const [id, punchData] = await Promise.all([
                    apiService.getVerifiedUserID(),
                    apiService.getTimePunches()
                ]);
                
                setVerifiedUserID(id);
                setPunches(punchData);
            } catch (err) {
                console.error("Auth failed, redirecting...");
                handleNavigation(); //Redirect to login if auth fails
            }
        };

        loadData();
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