import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Playground from './pages/Playground';
import Templates from './pages/MarketPlace';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/playground" element={<Playground />} />
        <Route path="/marketplace" element={<Templates />} />
        <Route path="/" element={<Navigate to="/playground" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
