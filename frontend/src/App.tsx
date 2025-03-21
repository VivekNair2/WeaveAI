import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Playground from './pages/Playground'


function App() {
  return (
    <BrowserRouter>
      <div className="">
        <Routes>
          <Route path="/" element={<Playground />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
