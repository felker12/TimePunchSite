# Time Clock System

A full-stack, secure **Time Tracking Application** designed for employees to manage their work shifts and breaks. This system utilizes a reactive state machine to determine employee status in real-time.

## 🚀 Features

*   **Secure Authentication**: Implements JWT-based login where user identities are verified via server-side claims to prevent ID spoofing.
*   **Dynamic Dashboard**: A state-aware interface that interprets raw database timestamps to determine if a user is "Working," "On Break," or "Clocked Out."
*   **Business Logic Enforcement**: 
    *   Ensures valid punch sequences (e.g., cannot Clock Out without Clocking In).
    *   **Single Break Rule**: Automatically hides the "Start Break" option once a break has been completed for the current shift.
*   **Shared Layout Architecture**: Uses a centralized `Layout` and `SharedHeader` with React Router `Outlet` to provide a consistent UI across all pages while reducing code duplication.
*   **Detailed History**: A sortable table view of all historical clock-in, clock-out, and break timestamps.

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, React Router 6, Vite |
| **Backend** | ASP.NET Core 8+ Minimal APIs, C# 12 |
| **Database** | SQL Server (ADO.NET / Microsoft.Data.SqlClient) |
| **Security** | JSON Web Tokens (JWT), Password Hashing & Salting |

## 📁 Key Project Components

### Frontend (`/src`)
*   **EmployeeDashboard.tsx**: Manages active shift state and conditional rendering of action buttons.
*   **EmployeeTimePunchHistory.tsx**: Displays a clean, tabular view of past employee performance.
*   **SharedHeader.tsx**: Context-aware navigation that intelligently hides the link to the current page.
*   **Layout.tsx**: The primary wrapper for authenticated pages, managing the `app-container` shell.
*   **TimePunchScripts.ts**: Centralized business logic for status calculation and time formatting.

### Backend (`/Data`)
*   **EmployeeRepository.cs**: Data access layer utilizing **Primary Constructors**, **File-Scoped Namespaces**, and **Switch Expressions**.
*   **Program.cs**: Secured API routes with attribute-based authorization.

## ⚙️ Logic Flow

The application functions as a **State Machine**. The UI dynamically updates based on the current database state of the employee's most recent record:

| Database State | UI Status | Available Actions |
| :--- | :--- | :--- |
| No active row (or `ClockOut` set) | **Clocked Out** | Clock In |
| `ClockIn` exists; `ClockOut` is NULL | **Working** | Clock Out, Start Break (if not taken) |
| `BreakStart` exists; `BreakEnd` is NULL | **On Break** | End Break |

## 🛠️ Setup

1.  **Database**: Run the SQL schema scripts to initialize `Employees` and `TimePunches` tables.
2.  **Configuration**: Add your SQL connection string to `appsettings.json`.
3.  **Run Backend**: 
    ```bash
    dotnet run
    ```
4.  **Run Frontend**:
    ```bash
    npm install
    npm run dev
    ```
