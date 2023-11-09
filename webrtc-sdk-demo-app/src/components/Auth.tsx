import { useState } from 'react'
import './Auth.css';
import Card from 'react-bootstrap/Card';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { Button, Dropdown, Form } from 'react-bootstrap';
import { checkAuthToken, authenticateImplicitly } from '../controllers/auth-utils';


export default function Auth() {
  const [token, setToken] = useState('');
  const [env, setEnv] = useState('dca');

  function handleChange(event: any): void {
    setToken(event.target.value);
  }

  function handleAuthSubmit(event: any) {
    event.preventDefault();
    const auth = {
      token,
      env
    }
    checkAuthToken(auth);
  }

  function handleImplicitAuth() {
    authenticateImplicitly(env);
  }

  return (
    <div className='auth-wrapper'>
      <Card className='auth-card'>
        <Form onSubmit={handleAuthSubmit}>
          <h3>Authentication</h3>
          <Form.Group className='auth-form-row'>
            <DropdownButton id='env-selector' title={env}>
              <Dropdown.Item onClick={() => setEnv('dca')}>dca</Dropdown.Item>
              <Dropdown.Item onClick={() => setEnv('pca-us')}>pca-us</Dropdown.Item>
            </DropdownButton>
            <Form.Control id='manual-auth-input' type='text' placeholder='Enter auth token' onChange={handleChange}></Form.Control>
          </Form.Group>
          <div className='auth-button-wrapper'>
            <Button id='implicit-auth-btn' variant='primary' onClick={handleImplicitAuth}>Implicit Authentication</Button>
            <Button id='manual-auth-btn' variant='primary' type='submit'>Submit Manual Token</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
