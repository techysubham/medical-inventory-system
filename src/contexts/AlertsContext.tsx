import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface AlertItem {
  _id: string;
  title: string;
  message: string;
  severity: string;
  type: string;
  status: 'unread' | 'read' | string;
  createdAt?: string;
}

interface AlertsContextType {
  alerts: AlertItem[];
  unreadCount: number;
  fetchAlerts: () => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const normalizedBase = rawApi.replace(/\/+$/g, '');
  const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

  const fetchAlerts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/alerts`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/alerts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setAlerts((s) => s.filter((a) => a._id !== id));
    } catch (err) {
      console.error('Failed to delete alert', err);
      throw err;
    }
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/alerts/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Mark read failed');
      const updated = await res.json();
      setAlerts((s) => s.map((a) => (a._id === id ? updated : a)));
    } catch (err) {
      console.error('Failed to mark alert read', err);
      throw err;
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (token) {
      fetchAlerts();
      interval = setInterval(fetchAlerts, 30000);
    }
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = alerts.length;

  return (
    <AlertsContext.Provider value={{ alerts, unreadCount, fetchAlerts, deleteAlert, markAsRead }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertsProvider');
  return ctx;
}

export default AlertsContext;
