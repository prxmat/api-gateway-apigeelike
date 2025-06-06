import React, { useEffect, useState } from 'react';
import type { App } from '../../../src/modules/route-loader/interfaces/app.interface';

interface AppListProps {
  onSelectApp: (appId: string) => void;
  selectedApp: string | null;
}

export const AppList: React.FC<AppListProps> = ({ onSelectApp, selectedApp }) => {
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch('/admin/api/apps');
      const data = await response.json();
      setApps(data);
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Applications</h2>
      <div className="space-y-2">
        {apps.map((app) => (
          <div
            key={app.id}
            className={`p-3 rounded-lg cursor-pointer ${
              selectedApp === app.id ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'
            } border`}
            onClick={() => onSelectApp(app.id)}
          >
            <h3 className="font-semibold">{app.name}</h3>
            <p className="text-sm text-gray-600">{app.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}; 