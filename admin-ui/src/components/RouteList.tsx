import React, { useEffect, useState } from 'react';
import type { LoadedRoute } from '../../../src/modules/route-loader/interfaces/loaded-route.interface';

interface RouteListProps {
  appId: string;
}

export const RouteList: React.FC<RouteListProps> = ({ appId }) => {
  const [routes, setRoutes] = useState<LoadedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  useEffect(() => {
    if (appId) {
      fetchRoutes();
    }
  }, [appId]);

  const fetchRoutes = async () => {
    try {
      const response = await fetch(`/admin/api/apps/${appId}/routes`);
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const toggleMock = async (routeId: string, environment: string, mock: boolean) => {
    try {
      await fetch(`/admin/api/apps/${appId}/routes/${routeId}/environments/${environment}/mock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mock }),
      });
      fetchRoutes(); // Recharger les routes après la mise à jour
    } catch (error) {
      console.error('Error toggling mock:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Routes</h2>
      <div className="space-y-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className={`p-4 border rounded-lg ${
              selectedRoute === route.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{route.id}</h3>
                <p className="text-sm text-gray-600">
                  {route.method} {route.path}
                </p>
              </div>
              <div className="flex space-x-2">
                {Object.entries(route.environments).map(([env, config]) => (
                  <button
                    key={env}
                    className={`px-3 py-1 rounded ${
                      config.mock ? 'bg-green-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => toggleMock(route.id, env, !config.mock)}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 