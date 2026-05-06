import { Outlet } from 'react-router-dom';
import SharedHeader from './SharedHeader';

export default function Layout() {
    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-content">
                    <SharedHeader />
                </div>
            </header>

            <main className="main-content">
                {/* The Outlet is where the specific page content (Dashboard, History, etc.) will render */}
                <Outlet />
            </main>

            <footer className="app-footer">
                <p>© 2026 Aspire Time Clock System</p>
            </footer>
        </div>
    );
}