import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ChainDetailPage from './pages/ChainDetail/ChainDetailPage';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chains/:slug" element={<ChainDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </MotionConfig>
    </ThemeProvider>
  );
}

export default App;
