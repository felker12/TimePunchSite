import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import EmployeeLogIn from './EmployeeLogIn.tsx'
import EmployeeDashboard from './EmployeeDashboard.tsx'
import EmployeeTimePunchHistory from './EmployeeTimePunchHistory.tsx'
import AdminDashboard from './AdminDashboard.tsx'
import Layout from './shared/Layout.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <Router>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<App />} />

              {/* Login - No Header/Footer needed here */}
              <Route path="/employee-login" element={<EmployeeLogIn />} />

              {/* Internal Pages - Wrapped in the Layout */}
              <Route element={<Layout />}>
                  <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                  <Route path="/employee-time-punch-history" element={<EmployeeTimePunchHistory />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
              </Route>
            </Routes>
        </Router>
  </StrictMode>,
)
