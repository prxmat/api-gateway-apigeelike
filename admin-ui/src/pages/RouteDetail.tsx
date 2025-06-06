import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Route, Environment, Environments } from '../types/app';
import { getRoute, updateRoute, toggleMock, testRoute, updateMockResponse, getRoutes } from '../services/api';
import Editor from '@monaco-editor/react';

type EnvironmentKey = 'integration' | 'staging' | 'production';

const RouteDetail: React.FC = () => {
  const { appId, routeId } = useParams<{ appId: string; routeId: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testData, setTestData] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentKey>('integration');
  const [mockResponse, setMockResponse] = useState<string>('');
  const [testError, setTestError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testBody, setTestBody] = useState<string>('{}');

  useEffect(() => {
    if (appId && routeId) {
      fetchRoute();
    }
  }, [appId, routeId]);

  const fetchRoute = async () => {
    if (!appId || !routeId) return;
    
    try {
      setLoading(true);
      const data = await getRoute(appId, routeId);
      setRoute(data);
      if (data.environments[selectedEnvironment]?.mock_response) {
        setMockResponse(JSON.stringify(data.environments[selectedEnvironment].mock_response, null, 2));
      }
    } catch (err) {
      setError('Failed to fetch route details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMockToggle = async (environment: keyof Environments) => {
    if (!route || !appId || !routeId) return;
    
    try {
      const newMockEnabled = !route.environments[environment]?.mock;
      await toggleMock(appId, routeId, environment, newMockEnabled);
      
      // Mettre à jour l'état local
      setRoute(prev => {
        if (!prev) return null;
        const updatedEnvironments = {
          ...prev.environments,
          [environment]: {
            ...prev.environments[environment],
            mock: newMockEnabled
          }
        };
        return {
          ...prev,
          environments: updatedEnvironments
        };
      });

      // Rafraîchir les routes pour avoir les données à jour
      const updatedRoutes = await getRoutes(appId);
      const updatedRoute = updatedRoutes.find(r => r.id === routeId);
      if (updatedRoute) {
        setRoute(updatedRoute);
      }
    } catch (error) {
      console.error('Error toggling mock:', error);
      // Afficher une notification d'erreur si nécessaire
    }
  };

  const handleSave = async () => {
    if (!appId || !routeId || !route) return;
    try {
      const updatedRoute = await updateRoute(appId, routeId, route);
      setRoute(updatedRoute);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update route');
      console.error(err);
    }
  };

  const handleTestRoute = async () => {
    if (!appId || !routeId) return;
    try {
      setTestLoading(true);
      setTestError(null);
      const body = JSON.parse(testBody);
      const result = await testRoute(appId, routeId, body, selectedEnvironment);
      setTestResult(result);
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Failed to test route');
      console.error('Error testing route:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleUpdateMockResponse = async () => {
    if (!route || !appId || !routeId) return;

    try {
      const parsedMockResponse = JSON.parse(mockResponse);
      await updateMockResponse(appId, routeId, selectedEnvironment, parsedMockResponse);
      await fetchRoute();
    } catch (err) {
      setError('Failed to update mock response');
      console.error(err);
    }
  };

  const handleEnvironmentChange = (env: EnvironmentKey) => {
    setSelectedEnvironment(env);
    if (route?.environments[env]?.mock_response) {
      setMockResponse(JSON.stringify(route.environments[env].mock_response, null, 2));
    } else {
      setMockResponse('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error || 'Route not found'}</h3>
          </div>
        </div>
      </div>
    );
  }

  const currentEnv = route.environments[selectedEnvironment] as Environment;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {route.method} {route.path}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
          <div className="flex space-x-2">
            {(Object.keys(route.environments) as EnvironmentKey[]).map((env) => (
              <button
                key={env}
                onClick={() => handleEnvironmentChange(env)}
                className={`px-4 py-2 rounded ${
                  selectedEnvironment === env
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Backend URL</label>
                <input
                  type="text"
                  value={currentEnv.backend_url}
                  onChange={(e) => {
                    const updatedRoute = {
                      ...route,
                      environments: {
                        ...route.environments,
                        [selectedEnvironment]: {
                          ...currentEnv,
                          backend_url: e.target.value
                        }
                      }
                    };
                    setRoute(updatedRoute);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="block text-sm font-medium text-gray-700">Mock Response</label>
                <button
                  onClick={() => handleMockToggle(selectedEnvironment as keyof Environments)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
                    currentEnv.mock
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-500 hover:bg-gray-600'
                  } text-white text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={currentEnv.mock ? 'Click to disable mock' : 'Click to enable mock'}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{currentEnv.mock ? 'Mock Enabled' : 'Mock Disabled'}</span>
                      <div className={`w-3 h-3 rounded-full ${currentEnv.mock ? 'bg-white' : 'bg-gray-300'} transition-colors duration-200`}></div>
                    </>
                  )}
                </button>
                {currentEnv.mock && !loading && (
                  <span className="text-sm text-gray-500">
                    Using mock response for {selectedEnvironment}
                  </span>
                )}
                {error && !loading && (
                  <span className="text-sm text-red-500">
                    {error}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Input Transform</label>
                <textarea
                  value={route.input_transform || ''}
                  onChange={(e) => {
                    setRoute({
                      ...route,
                      input_transform: e.target.value
                    });
                  }}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Output Transform</label>
                <textarea
                  value={route.output_transform || ''}
                  onChange={(e) => {
                    setRoute({
                      ...route,
                      output_transform: e.target.value
                    });
                  }}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Mock Response</h2>
            <div className="space-y-4">
              <textarea
                value={mockResponse}
                onChange={(e) => setMockResponse(e.target.value)}
                rows={10}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
                placeholder="Enter mock response JSON..."
              />
              <button
                onClick={handleUpdateMockResponse}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update Mock Response
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Test Route</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Request Body</label>
              <Editor
                height="200px"
                defaultLanguage="json"
                value={testBody}
                onChange={(value: string | undefined) => {
                  if (typeof value === 'string') {
                    setTestBody(value);
                  } else {
                    setTestBody('{}');
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            <button
              onClick={handleTestRoute}
              disabled={testLoading}
              className={`px-4 py-2 rounded ${
                testLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {testLoading ? 'Testing...' : 'Test Route'}
            </button>

            {testError && (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{testError}</h3>
                  </div>
                </div>
              </div>
            )}

            {testResult && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Test Result</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm text-gray-800 overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetail; 