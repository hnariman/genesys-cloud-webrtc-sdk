import { useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
// import Home from './components/Home';
import { authenticateFromUrlToken } from './controllers/auth-utils';
import { BrowserRouter, Routes, Route } from 'react-router-dom';


function App() {

  useEffect(() => {
    authenticateFromUrlToken();
  }, []);

  return (
    <div className='App'>
      <div className='App-header'>
        <BrowserRouter>
        <Routes>
          <Route path='/' element={<Auth />}></Route>
          {/* <Route path='home' element={<Home />}></Route> */}
        </Routes>
      </BrowserRouter>
      </div>
    </div>

  );
}

export default App;
