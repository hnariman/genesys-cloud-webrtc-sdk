import { useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { authenticateFromUrlToken, authenticateImplicitly } from './services/auth-service';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { eventService } from './services/event-service';
import Softphone from './components/Softphone';


function App() {
  const navigate = useNavigate();

  useEffect(() => {
    eventService.addEventListener('ready', () => {
      navigate('/softphone');
    });
    // authenticateFromUrlToken();
    authenticateImplicitly('dca');

  }, []);

  return (
    <div className='App'>
      <div className='App-header'>
        <Routes>
          <Route path='/' element={<Auth />}></Route>
          <Route path='home' element={<Dashboard />}></Route>
          <Route path='softphone' element={<Softphone />}></Route>
        </Routes>
      </div>
    </div>

  );
}

export default App;
