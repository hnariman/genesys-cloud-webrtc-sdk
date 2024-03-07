import { FormEvent, useEffect, useState } from 'react';
import './Softphone.css';
import { startSoftphoneSession, endSession } from '../services/sdk-service';
import { eventService } from '../services/event-service';
import { useDispatch, useSelector } from 'react-redux';
import { addConversation, addPendingSession } from '../features/conversationsSlice';
import useEventListners from '../hooks/useEventListeners';

export default function Softphone() {
  const [phoneNumber, setPhoneNumber] = useState('');
  useEventListners();
  const conversations = useSelector((state) => state.conversations.activeConversations);
  const pendingSessions = useSelector((state) => state.conversations.pendingSessions);

  console.warn('here are the convos in the component', conversations);


  function placeCall(event: FormEvent): void {
    event.preventDefault();
    startSoftphoneSession(phoneNumber);
  }

  function createConversationsTable() {
    console.warn(conversations)
    if (!conversations || !conversations.length) {
      return;
    }
    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Conversation ID</th>
              <th>Session ID</th>
              <th>Session Type</th>
              <th>Session State</th>
              <th>Connection State</th>
              <th>End Call</th>
              {/* <th>Session ID</th>
              <th>Active?</th>
              <th></th>
              <th>Header 6</th>
              <th>Header 7</th>
              <th>Header 8</th>
              <th>Header 9</th>
              <th>Header 10</th>
              <th>Header 11</th>
              <th>Header 12</th>
              <th>Header 13</th> */}
            </tr>
          </thead>
          <tbody>
            {conversations.map((conversation, index: number) => (
            <tr key={index}>
              <td>{conversation.activeConversationId}</td>
              <td>{conversation.current[0].session.id}</td>
              <td>{conversation.current[0].session.sessionType}</td>
              <td>{conversation.current[0].session.state}</td>
              <td>{conversation.current[0].session.connectionState}</td>
              <td><button onClick={() => endSession({ conversationId: conversation.activeConversationId })}>End call</button></td>
            </tr>
          ))}
            {/* <tr>
              <td>Data 1</td>
              <td>Data 2</td>
              <td>Data 3</td>
              <td>Data 4</td>
              <td>Data 5</td>
              <td>Data 6</td>
              <td>Data 7</td>
              <td>Data 8</td>
              <td>Data 9</td>
              <td>Data 10</td>
              <td>Data 11</td>
              <td>Data 12</td>
              <td>Data 13</td>
            </tr> */}
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
