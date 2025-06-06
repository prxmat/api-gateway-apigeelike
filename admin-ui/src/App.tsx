import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RouteDetail from './pages/RouteDetail';
import TestRoute from './pages/TestRoute';
import ImportOpenAPI from './pages/ImportOpenAPI';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/routes/:id" element={<RouteDetail />} />
          <Route path="/routes/:id/test" element={<TestRoute />} />
          <Route path="/import" element={<ImportOpenAPI />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
