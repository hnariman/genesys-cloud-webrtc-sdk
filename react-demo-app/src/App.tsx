import { useEffect } from 'react'
import './App.css'
import Auth from './components/Auth';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { authenticateImplicitly } from './services/auth-service';
import useEventListners from './hooks/useEventListeners';

function App() {
  useEventListners();

  useEffect(() => {
    // authenticateFromUrlToken();
    // if (window.localStorage.getItem('sdk_test_auth_data')) {
    //   authenticateImplicitly('dca');
    // }

  }, []);

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
