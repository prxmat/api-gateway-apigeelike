import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Route } from '../types/route';
import { getRoute, updateRoute, toggleMock, testRoute } from '../services/api';
import Editor from '@monaco-editor/react';

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testData, setTestData] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!id) return;
      try {
        const data = await getRoute(id);
        setRoute(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch route details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [id]);

  const handleToggleMock = async () => {
    if (!id) return;
    try {
      const updatedRoute = await toggleMock(id);
      setRoute(updatedRoute);
    } catch (err) {
      setError('Failed to toggle mock mode');
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!id || !route) return;
    try {
      const updatedRoute = await updateRoute(id, route);
      setRoute(updatedRoute);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update route');
      console.error(err);
    }
  };

  const handleTest = async () => {
    if (!id) return;
    setIsTesting(true);
    try {
      const data = JSON.parse(testData);
      const result = await testRoute(id, data);
      setTestResult(result);
    } catch (err) {
      setError('Failed to test route');
      console.error(err);
    } finally {
      setIsTesting(false);
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

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {route.path}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {route.method} - {route.backend_url}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleMock}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              route.mock
                ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {route.mock ? 'Disable Mock' : 'Enable Mock'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="path" className="block text-sm font-medium text-gray-700">
                Path
              </label>
              <input
                type="text"
                id="path"
                value={route.path}
                onChange={(e) => setRoute({ ...route, path: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                Method
              </label>
              <select
                id="method"
                value={route.method}
                onChange={(e) => setRoute({ ...route, method: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label htmlFor="backend_url" className="block text-sm font-medium text-gray-700">
                Backend URL
              </label>
              <input
                type="text"
                id="backend_url"
                value={route.backend_url}
                onChange={(e) => setRoute({ ...route, backend_url: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="input_transform" className="block text-sm font-medium text-gray-700">
                Input Transform
              </label>
              <Editor
                height="200px"
                defaultLanguage="javascript"
                value={route.input_transform || ''}
                onChange={(value) => setRoute({ ...route, input_transform: value || '' })}
                options={{
                  minimap: { enabled: false },
                  readOnly: !isEditing,
                }}
              />
            </div>

            <div>
              <label htmlFor="output_transform" className="block text-sm font-medium text-gray-700">
                Output Transform
              </label>
              <Editor
                height="200px"
                defaultLanguage="javascript"
                value={route.output_transform || ''}
                onChange={(value) => setRoute({ ...route, output_transform: value || '' })}
                options={{
                  minimap: { enabled: false },
                  readOnly: !isEditing,
                }}
              />
            </div>

            {route.mock && (
              <div>
                <label htmlFor="mock_response" className="block text-sm font-medium text-gray-700">
                  Mock Response
                </label>
                <Editor
                  height="200px"
                  defaultLanguage="json"
                  value={route.mock_response ? JSON.stringify(route.mock_response, null, 2) : '{}'}
                  onChange={(value) => {
                    try {
                      const parsed = value ? JSON.parse(value) : {};
                      setRoute({ ...route, mock_response: parsed });
                    } catch (e) {
                      // Ignorer les erreurs de parsing JSON pendant la saisie
                    }
                  }}
                  options={{
                    minimap: { enabled: false },
                    readOnly: !isEditing,
                  }}
                />
              </div>
            )}

            <div>
              <label htmlFor="test_data" className="block text-sm font-medium text-gray-700">
                Test Data
              </label>
              <Editor
                height="200px"
                defaultLanguage="json"
                value={testData}
                onChange={(value) => setTestData(value || '{}')}
                options={{
                  minimap: { enabled: false },
                }}
              />
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isTesting ? 'Testing...' : 'Test Route'}
                </button>
              </div>
              {testResult && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Test Result</label>
                  <pre className="mt-1 p-4 bg-gray-50 rounded-md overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 