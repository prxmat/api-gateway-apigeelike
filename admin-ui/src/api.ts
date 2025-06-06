import axios from 'axios';

const API_URL = 'http://localhost:3001';

export const getApps = async () => {
  const response = await axios.get(`${API_URL}/api/admin/apps`);
  return response.data;
};

export const getRoutes = async (appId: string) => {
  const response = await axios.get(`${API_URL}/api/admin/apps/${appId}/routes`);
  return response.data;
};

export const getRoute = async (appId: string, routeId: string) => {
  const response = await axios.get(`${API_URL}/api/admin/apps/${appId}/routes/${routeId}`);
  return response.data;
};

export const updateRoute = async (appId: string, routeId: string, route: any) => {
  const response = await axios.put(`${API_URL}/api/admin/apps/${appId}/routes/${routeId}`, route);
  return response.data;
};

export const toggleMock = async (appId: string, routeId: string, environment: string, mock: boolean) => {
  const response = await axios.put(`${API_URL}/api/admin/apps/${appId}/routes/${routeId}/mock`, {
    environment,
    mock
  });
  return response.data;
};

export const testRoute = async (appId: string, routeId: string, data: any, environment: string) => {
  const response = await axios.post(`${API_URL}/api/admin/apps/${appId}/routes/${routeId}/test`, {
    data,
    environment
  });
  return response.data;
};

export const updateMockResponse = async (appId: string, routeId: string, environment: string, mockResponse: any) => {
  const response = await axios.put(`${API_URL}/api/admin/apps/${appId}/routes/${routeId}/mock-response`, {
    environment,
    mockResponse
  });
  return response.data;
};

export const updateEnvironmentMock = async (appId: string, environment: string, enabled: boolean) => {
  const response = await axios.put(`${API_URL}/api/admin/apps/${appId}/environments/${environment}/mock`, {
    enabled
  });
  return response.data;
}; 