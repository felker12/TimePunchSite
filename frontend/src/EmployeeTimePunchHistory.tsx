import { useEffect, useState } from 'react';
import './App.css';
import { type TimePunch, formatTime, getShiftStatus } from '../src/utils/TimePunchScripts'; 
import { apiService } from '../src/utils/apiService'; 
import { useNavigate } from 'react-router-dom';

function EmployeeTimePunchHistory() {
    const [punches, setPunches] = useState<TimePunch[]>([]);
    const [verifiedUserID, setVerifiedUserID] = useState<number | null>(null);
    const [displayLimit, setDisplayLimit] = useState<number>(10); //show 10 time punches by default or 2 weeks worth
    const [isLoading, setIsLoading] = useState(false);

    //Navigation logic
    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate('/employee-login'); //Navigate to the employee dashboard
    }

    const loadData = async (limit: number) => {
        setIsLoading(true);
        try {
            //Call shared service
            const [id, punchData] = await Promise.all([
                apiService.getVerifiedUserID(),
                apiService.getTimePunches(limit) //Reqeust the input number of punches, the backend will handle limiting it to the actual number of punches available for that user
            ]);

            setVerifiedUserID(id);
            setPunches(punchData);
        } catch (err) {
            console.error("Auth failed, redirecting...");
            handleNavigation(); //Redirect to login if auth fails
        } finally {
            setIsLoading(false)
        }
    };

    //This effect will run whenever the display limit changes
    useEffect(() => {
        loadData(displayLimit);
    }, [displayLimit]); 

  return (
      <div className="card" style={{ minWidth: '400px', width: '70%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Employee {verifiedUserID}'s Time History</h2>

              <div className="limit-selector">
                    <label htmlFor="limit-select" style={{ marginRight: '8px', fontSize: '14px' }}>Show: </label>
                    <select 
                        id="limit-select"
                        value={displayLimit} 
                        onChange={(e) => setDisplayLimit(Number(e.target.value))}
                        disabled={isLoading}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={9999}>All</option>
                    </select>
                </div>
          </div>

          {/** if loading display loading message, else if punches exist display them, else display no records message **/}
          {isLoading ? (<p>Loading records...</p>) : punches.length > 0 ? (
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
  );
}

export default EmployeeTimePunchHistory;