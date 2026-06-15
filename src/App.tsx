import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import RecipePage from '@/pages/RecipePage';
import CalculatePage from '@/pages/CalculatePage';
import NotesPage from '@/pages/NotesPage';
import HistoryPage from '@/pages/HistoryPage';
import ExportPage from '@/pages/ExportPage';
import { useSoapStore } from '@/store/soapStore';
import { useEffect } from 'react';

export default function App() {
  const loadFromStorage = useSoapStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RecipePage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/calculate" element={<CalculatePage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="*" element={<RecipePage />} />
        </Route>
      </Routes>
    </Router>
  );
}
