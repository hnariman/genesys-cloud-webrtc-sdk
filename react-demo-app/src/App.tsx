import { useEffect } from 'react'
import './App.css'
import Auth from './components/Auth';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { eventService } from './services/event-service';
import Dashboard from './components/Dashboard';
import { authenticateFromUrlToken, authenticateImplicitly } from './services/auth-service';
import useEventListners from './hooks/useEventListeners';

function App() {
  const navigate = useNavigate();
  useEventListners();

  // useEffect(() => {
  //   eventService.addEventListener('ready', () => {
  //     navigate('/dashboard');
  //   });
  //   // authenticateFromUrlToken();
  //   // authenticateImplicitly('dca');

  // }, []);

  return (
    <>
        <Routes>
          <Route path='/' element={<Auth />}></Route>
          <Route path='dashboard' element={<Dashboard />}></Route>
          {/* <Route path='softphone' element={<Softphone />}></Route> */}
        </Routes>
    </>
  )
}

export default App
