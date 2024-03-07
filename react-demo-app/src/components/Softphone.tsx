import { FormEvent, useState } from 'react';
import './Softphone.css';
import { startSoftphoneSession, endSession } from '../services/sdk-service';
import { useSelector } from 'react-redux';
// TODO: put this in an interfaces file.
import { ConversationsState } from '../features/conversationsSlice';
import useEventListners from '../hooks/useEventListeners';

export default function Softphone() {
  const [phoneNumber, setPhoneNumber] = useState('');
  useEventListners();
  const conversations: ConversationsState = useSelector((state) => state.conversations.activeConversations);

  console.warn('here are the convos in the component', conversations);


  function placeCall(event: FormEvent): void {
    event.preventDefault();
    startSoftphoneSession(phoneNumber);
  }

  function createConversationsTable() {
    if (!conversations || !Object.entries(conversations).length) {
      return;
    }
    Object.entries(conversations).map(([key, value]) => console.warn(key, value));
    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Conversation ID</th>
              <th>Session ID</th>
              <th>Session Type</th>
              <th>Direction</th>
              <th>Session State</th>
              <th>Connection State</th>
              <th>Muted</th>
              <th>Held</th>
              <th>End Call</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(conversations).map(([key, value]) => (
              <tr key={key}>
                <td>{value.conversationId}</td>
                <td>{value.session.id}</td>
                <td>{value.mostRecentCallState?.direction}</td>
                <td>{value.session.sessionType}</td>
                <td>{value.session.state}</td>
                <td>{value.session.connectionState}</td>
                <td>{value.mostRecentCallState.muted}</td>
                <td>{value.mostRecentCallState.held}</td>
                <td><button onClick={() => endSession({ conversationId: value.conversationId })}>End call</button></td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="softphone-wrapper">
      <form onSubmit={placeCall}>
        <label>Phone Number: </label>
        <input type="text" name="softphone-input" onChange={(e) => setPhoneNumber(e.target.value)}></input>
        <button type="submit">Place call</button>
      </form>
      <div className="softphone-sessions">
        {createConversationsTable()}
      </div>
    </div>
  )
}
