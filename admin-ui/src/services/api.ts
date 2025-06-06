import axios from 'axios';
import type { Route } from '../types/route';

const API_URL = 'http://localhost:3001/api/admin';

export const getRoutes = async (): Promise<Route[]> => {
  const response = await axios.get(`${API_URL}/routes`);
  return response.data;
};

export const getRoute = async (id: string): Promise<Route> => {
  const response = await axios.get(`${API_URL}/routes/${id}`);
  return response.data;
};

export const updateRoute = async (id: string, data: Partial<Route>): Promise<Route> => {
  const response = await axios.patch(`${API_URL}/routes/${id}`, data);
  return response.data;
};

export const testRoute = async (id: string, data: any): Promise<any> => {
  const response = await axios.post(`${API_URL}/routes/${id}/test`, data);
  return response.data;
};

export const toggleMock = async (id: string): Promise<Route> => {
  const response = await axios.post(`${API_URL}/routes/${id}/toggle-mock`);
  return response.data;
};

export const updateMockResponse = async (id: string, mockResponse: any): Promise<Route> => {
  const response = await axios.post(`${API_URL}/routes/${id}/mock-response`, { mockResponse });
  return response.data;
};

export const importOpenAPI = async (openApiSpec: string): Promise<Route[]> => {
  const response = await axios.post(`${API_URL}/routes/import`, { openApiSpec });
  return response.data;
}; 