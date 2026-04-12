import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import EmployeeLogIn from './EmployeeLogIn.tsx'
import EmployeeDashboard from './EmployeeDashboard.tsx'
import EmployeeTimePunchHistory from './EmployeeTimePunchHistory.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/employee-login" element={<EmployeeLogIn />} />
                <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                <Route path="/employee-time-punch-history" element={<EmployeeTimePunchHistory />} />
            </Routes>
        </Router>
  </StrictMode>,
)
