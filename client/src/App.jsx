import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Background from './components/background.jsx'
import HomePage from './pages/home-page.jsx'
import LobbyPage from './pages/lobby-page.jsx'
import GamePage from './pages/game-page.jsx'
import ResultsPage from './pages/results-page.jsx'

export default function App() {
  const location = useLocation()

  return (
    <>
      <Background />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/lobby/:code" element={<LobbyPage />} />
          <Route path="/game/:code" element={<GamePage />} />
          <Route path="/results/:code" element={<ResultsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
