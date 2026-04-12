import type { TimePunch } from '../utils/TimePunchScripts';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem("token")}`
});

export const apiService = {
    async getTimePunches(): Promise<TimePunch[]> {
        const response = await fetch('/api/get-timepunches-data', {
            method: 'POST',
            headers: getHeaders()
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
    }
};