import { FormEvent, useState } from 'react'
import './Softphone.css';
import { Card, Form, Button } from 'react-bootstrap';
import { startSoftphoneSession } from '../services/sdk-service';

export default function Softphone() {
  const [phoneNumber, setPhoneNumber] = useState('');

  function handleInput(event: FormEvent): void {
    setPhoneNumber((event.target as HTMLFormElement).value);
  }

  function placeCall(event: FormEvent) {
    event.preventDefault();
    startSoftphoneSession(phoneNumber);
  }


  return (
    <div className='softphone-wrapper'>
      <Card className='softphone-card'>
        <h3>Softphone Demo</h3>
        <Form className='softphone-form'>
          <Form.Group onSubmit={placeCall}>
            <Form.Control type='text' placeholder='Enter phone number' onChange={handleInput}></Form.Control>
            <Button variant='primary' type='submit' onClick={placeCall}>Place Call</Button>
          </Form.Group>
        </Form>
      </Card>
    </div>
  )
}
