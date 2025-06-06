import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Route, Environments } from '../types/app';
import { getRoute, testRoute } from '../services/api';
import Editor from '@monaco-editor/react';

const TestRoute: React.FC = () => {
  const { appId, routeId } = useParams<{ appId: string; routeId: string }>();
  const [route, setRoute] = useState<Route | null>(null);
  const [testData, setTestData] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<keyof Environments>('integration');

  useEffect(() => {
    fetchRoute();
  }, [appId, routeId]);

  const fetchRoute = async () => {
    try {
      setLoading(true);
      if (!appId || !routeId) {
        throw new Error('Missing appId or routeId');
      }
      const data = await getRoute(appId, routeId);
      setRoute(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching route:', error);
      setError('Failed to load route details');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!appId || !routeId) return;
    setIsTesting(true);
    try {
      const data = JSON.parse(testData);
      const result = await testRoute(appId, routeId, data, selectedEnvironment);
      setTestResult(result);
    } catch (err) {
      console.error('Error testing route:', err);
      setError('Failed to test route');
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
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Test Route: {route.id}</h1>
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Method:</span> {route.method}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">Path:</span> {route.path}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-2">
              Environment
            </label>
            <select
              id="environment"
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value as keyof Environments)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {(Object.keys(route.environments) as Array<keyof Environments>).map((env) => (
                <option key={env} value={env}>
                  {env} {route.environments[env].mock ? '(Mock)' : ''}
                </option>
              ))}
            </select>
          </div>

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
          </div>

          <div>
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isTesting ? 'Testing...' : 'Test Route'}
            </button>
          </div>

          {testResult && (
            <div>
              <h2 className="text-lg font-medium mb-2">Test Result</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestRoute; 