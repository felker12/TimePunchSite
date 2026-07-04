import type { EmployeeRole, TimePunch, EmployeeView } from '../utils/TimePunchScripts';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem("token")}`
});

export const apiService = {
    async getTimePunches(punchLimit: number): Promise<TimePunch[]> {
        const response = await fetch('/api/get-timepunches-data', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ punchLimit })
        });
        if (!response.ok) throw new Error("Failed to fetch punches");
        return response.json();
    },

    async getTimePunchesForWeek(date: Date): Promise<EmployeeView[]> {
        const response = await fetch('/api/get-timepunches-for-week', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ day: date })
        });
        if (!response.ok) throw new Error("Failed to fetch punches");
        return response.json();
    },

    async getVerifiedUserID(): Promise<number> {
        const response = await fetch('/api/get-user-id', {
            method: 'POST',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Failed to verify ID");
        const data = await response.json();
        return data.id;
    },

    async getUserRole(): Promise<EmployeeRole> {
        const response = await fetch('/api/get-user-role', {
            method: 'POST',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch user role");
        const data = await response.json();
        return data.role as EmployeeRole;
    },

    async performPunch(actionType: string): Promise<void> {
        const response = await fetch('/api/perform-punch', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ actionType })
        });
        if (!response.ok) throw new Error("Failed to perform punch");
    },

    async login(userID: number, password: string): Promise<{ success: boolean; role?: EmployeeRole }> {
        const response = await fetch('/api/check-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: userID,
                password: password
            }),
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem("token", result.token);
            localStorage.setItem("userRole", result.role);
        }

        return { success: result.success, role: result.role as EmployeeRole};
    },

    //Admin function to update a time punch
    async updatePunch(punch: TimePunch): Promise<void> {
        const response = await fetch('/api/update-timepunch', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ punch })
        });
        if (!response.ok) throw new Error("Failed to update punch");
    },

    async deletePunch(timePunchID: number): Promise<void> {
        const response = await fetch('/api/delete-timepunch', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ timePunchID }) 
        });
        if (!response.ok) throw new Error("Failed to delete punch");
    }
}