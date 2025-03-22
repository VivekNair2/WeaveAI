import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Playground from './pages/Playground';
import Templates from './pages/MarketPlace';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/marketplace" element={<Templates />} />
      </Routes>
    </Router>
  );
}

export default App;