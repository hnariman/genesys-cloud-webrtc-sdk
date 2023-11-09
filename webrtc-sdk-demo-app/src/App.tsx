import { useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { authenticateFromUrlToken } from './services/auth-service';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { eventService } from './services/event-service';


function App() {
  const navigate = useNavigate();

  useEffect(() => {
    eventService.addEventListener('ready', () => {
      navigate('/home');
    });
    authenticateFromUrlToken();
  }, []);

  return (
    <div className='App'>
      <div className='App-header'>
        <Routes>
          <Route path='/' element={<Auth />}></Route>
          <Route path='home' element={<Dashboard />}></Route>
        </Routes>
      </div>
    </div>

  );
}

export default App;
