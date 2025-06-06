import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Route } from '../types/route';
import { getRoute, testRoute } from '../services/api';
import Editor from '@monaco-editor/react';

export default function TestRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState({});
  const [response, setResponse] = useState<any>(null);
  const [testing, setTesting] = useState(false);

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

  const handleTest = async () => {
    if (!id) return;
    setTesting(true);
    try {
      const data = JSON.parse(requestData);
      const result = await testRoute(id, data);
      setResponse(result);
      setError(null);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON in request data');
      } else {
        setError('Failed to test route');
        console.error(err);
      }
    } finally {
      setTesting(false);
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
            Test Route
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {route.method} {route.path}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => navigate(`/routes/${id}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Route
          </button>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="request" className="block text-sm font-medium text-gray-700">
                Request Data
              </label>
              <Editor
                height="200px"
                defaultLanguage="json"
                value={requestData}
                onChange={(value) => setRequestData(value || '{}')}
                options={{
                  minimap: { enabled: false },
                }}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Route'}
              </button>
            </div>

            {response && (
              <div>
                <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                  Response
                </label>
                <Editor
                  height="200px"
                  defaultLanguage="json"
                  value={JSON.stringify(response, null, 2)}
                  options={{
                    minimap: { enabled: false },
                    readOnly: true,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 