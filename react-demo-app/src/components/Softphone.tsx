import { useState } from "react";
import "./Softphone.css";
import { startSoftphoneSession, endSession } from "../services/sdk-service";
import { useSelector } from "react-redux";
// TODO: put this in an interfaces file.
import { ConversationsState } from "../features/conversationsSlice";
import useEventListners from "../hooks/useEventListeners";
import { GuxButton, GuxCard, GuxTable } from "genesys-spark-components-react";

export default function Softphone() {
  const [phoneNumber, setPhoneNumber] = useState("");
  useEventListners();
  const conversations: ConversationsState = useSelector(
    (state) => state.conversations.activeConversations
  );
  const sdk = (window as any).sdk

  function placeCall(): void {
    if (!phoneNumber) {
      alert("Please enter a phone number to place a call.");
    }
    // TODO: just bypass the service and go straight through sdk.
    startSoftphoneSession(phoneNumber);
  }

  function holdCall(held: boolean, conversationId: string): void {
    console.warn('conversation id: ', conversationId, held);
    sdk.setConversationHeld({held, conversationId})
  }

  function handleMute(mute: boolean, conversationId: string): void {
    sdk.setAudioMute({mute, conversationId});
  }

  function createConversationsTable() {
    if (!conversations || !Object.entries(conversations).length) {
      return;
    }
    Object.entries(conversations).map(([key, value]) =>
      console.warn(key, value)
    );
    return (
      <GuxCard className="gux-body-md-bold">
        <label>Active Conversations</label>
        <GuxTable>
          <table slot="data">
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
                  <td>{value.mostRecentCallState.direction}</td>
                  <td>{value.session.sessionType}</td>
                  <td>{value.session.state}</td>
                  <td>{value.session.connectionState}</td>
                  <td>
                    <GuxButton onClick={()=> handleMute(!value.mostRecentCallState.muted, value.conversationId)}>
                      {value.mostRecentCallState.muted ? 'Unmute' : 'Mute'}
                    </GuxButton>
                  </td>
                  <td>
                    <GuxButton onClick={()=> holdCall(!value.mostRecentCallState, value.conversationId)}>
                      {value.mostRecentCallState.held ? 'Unhold' : 'Hold'}
                    </GuxButton>
                  </td>
                  <td>
                    <GuxButton
                      accent="danger"
                      onClick={() =>
                        endSession({ conversationId: value.conversationId })
                      }
                    >
                      End call
                    </GuxButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GuxTable>
      </GuxCard>
    );
  }

  return (
    <div className="softphone-wrapper">
        <GuxCard id="softphone-card" accent="raised">
          <div className="softphone-call-content">
            <label className="gux-body-md-bold">Outbound Phone Call</label>
            <input type="text" onChange={(e) => setPhoneNumber(e.target.value)} />
            <GuxButton accent="primary" className="call-btn" onClick={placeCall}>Place Call</GuxButton>
            <GuxButton accent="danger" className="end-btn">End All</GuxButton>
          </div>
        </GuxCard>
      <div className="softphone-sessions">{createConversationsTable()}</div>
    </div>
  );
}
