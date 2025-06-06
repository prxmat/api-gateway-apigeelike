import axios from 'axios';
import type { App, Route } from '../types/app';

type EnvironmentKey = 'integration' | 'staging' | 'production';

const API_BASE_URL = 'http://localhost:3001/api/admin';

// Configuration globale d'axios pour gérer les CORS
axios.defaults.withCredentials = true;

export const getApps = async (): Promise<App[]> => {
  const response = await fetch(`${API_BASE_URL}/apps`);
  if (!response.ok) {
    throw new Error('Failed to fetch apps');
  }
  return response.json();
};

export const getApp = async (id: string): Promise<App> => {
  const response = await fetch(`${API_BASE_URL}/apps/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch app');
  }
  return response.json();
};

export const getRoutes = async (appId: string): Promise<Route[]> => {
  const response = await fetch(`${API_BASE_URL}/apps/${appId}/routes`);
  if (!response.ok) {
    throw new Error('Failed to fetch routes');
  }
  return response.json();
};

export const getRoute = async (appId: string, routeId: string): Promise<Route> => {
  const response = await fetch(`${API_BASE_URL}/apps/${appId}/routes/${routeId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch route');
  }
  return response.json();
};

export const updateRoute = async (appId: string, routeId: string, data: Partial<Route>): Promise<Route> => {
  const response = await axios.patch<Route>(`${API_BASE_URL}/apps/${appId}/routes/${routeId}`, data);
  return response.data;
};

export const testRoute = async (appId: string, routeId: string, body: any, environment: string): Promise<any> => {
  const response = await axios.post(`${API_BASE_URL}/apps/${appId}/routes/${routeId}/test`, body, {
    headers: {
      'Content-Type': 'application/json',
      'X-Environment': environment
    }
  });
  return response.data;
};

export const toggleMock = async (appId: string, routeId: string, environment: EnvironmentKey, mock: boolean): Promise<void> => {
  if (!appId || !routeId) {
    throw new Error('Missing appId or routeId');
  }
  const response = await fetch(`${API_BASE_URL}/apps/${appId}/routes/${routeId}/environments/${environment}/mock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mock }),
  });
  if (!response.ok) {
    throw new Error('Failed to toggle mock');
  }
};

export const updateMockResponse = async (appId: string, routeId: string, environment: EnvironmentKey, mockResponse: any): Promise<Route> => {
  if (!appId || !routeId) {
    throw new Error('Missing appId or routeId');
  }
  const response = await axios.post<Route>(`${API_BASE_URL}/apps/${appId}/routes/${routeId}/environments/${environment}/mock-response`, { mockResponse });
  return response.data;
};

export const importOpenAPI = async (appId: string, openApiSpec: string): Promise<Route[]> => {
  const response = await axios.post<Route[]>(`${API_BASE_URL}/apps/${appId}/routes/import`, { openApiSpec });
  return response.data;
}; 