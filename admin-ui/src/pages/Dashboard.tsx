import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApps, getRoutes, toggleMock } from '../services/api';
import type { App, Route } from '../types/app';

const Dashboard: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedApp) {
      fetchRoutes(selectedApp);
    }
  }, [selectedApp]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const data = await getApps();
      setApps(data);
      if (data.length > 0) {
        setSelectedApp(data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch apps');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async (appId: string) => {
    try {
      setLoading(true);
      const data = await getRoutes(appId);
      setRoutes(data);
    } catch (err) {
      setError('Failed to fetch routes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMock = async (routeId: string, environment: string, currentMock: boolean) => {
    try {
      await toggleMock(selectedApp, routeId, environment, !currentMock);
      fetchRoutes(selectedApp);
    } catch (err) {
      setError('Failed to toggle mock');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API Gateway Dashboard</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Application</label>
        <select
          value={selectedApp}
          onChange={(e) => setSelectedApp(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {apps.map(app => (
            <option key={app.id} value={app.id}>{app.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {routes.map(route => (
          <div key={route.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                {route.method} {route.path}
              </h2>
              <Link
                to={`/routes/${selectedApp}/${route.id}`}
                className="text-indigo-600 hover:text-indigo-900"
              >
                View Details
              </Link>
            </div>

            <div className="space-y-2">
              {Object.entries(route.environments).map(([env, config]) => (
                <div key={env} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{env}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      Backend: {config.backend_url}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleMock(route.id, env, config.mock)}
                    className={`px-3 py-1 text-sm rounded ${
                      config.mock
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  >
                    {config.mock ? 'Mock Enabled' : 'Mock Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 