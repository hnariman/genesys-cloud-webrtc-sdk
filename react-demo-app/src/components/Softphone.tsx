import { useState } from "react";
import "./Softphone.css";
import { startSoftphoneSession, endSession } from "../services/sdk-service";
import { useSelector } from "react-redux";
// TODO: put this in an interfaces file.
import { ConversationsState } from "../features/conversationsSlice";
import useEventListners from "../hooks/useEventListeners";
import { GuxButton, GuxCard, GuxTable } from "genesys-spark-components-react";
import { IPendingSession } from "../../../dist/es/types/interfaces";
import StationDetails from "./StationDetails";

export default function Softphone() {
  const [phoneNumber, setPhoneNumber] = useState("");
  useEventListners();
  const conversations: ConversationsState = useSelector(
    (state) => state.conversations.activeConversations
  );
  const pendingSessions = useSelector((state) => state.conversations.pendingSessions);
  const sdk = (window as any).sdk

  function placeCall(): void {
    if (!phoneNumber) {
      alert("Please enter a phone number to place a call.");
    }
    // TODO: just bypass the service and go straight through sdk.
    startSoftphoneSession(phoneNumber);
  }

  function holdCall(held: boolean, conversationId: string): void {
    sdk.setConversationHeld({held, conversationId})
  }

  function handleMute(mute: boolean, conversationId: string): void {
    sdk.setAudioMute({mute, conversationId});
  }

  function handlePendingSession(accept: boolean, conversationId: string): void {
    if (accept) {
      sdk.acceptPendingSession({ conversationId });
    } else {
      sdk.rejectPendingSession({ conversationId });
    }

  }

  function createConversationsTable() {
    if (!conversations || !Object.entries(conversations).length) {
      return;
    }
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

  function createPendingSessionsTable() {
    if (!pendingSessions || !pendingSessions.length) {
      return;
    }
    return (
      <GuxCard className="gux-body-md-bold">
        <label>Pending Sessions</label>
        <GuxTable>
          <table slot="data">
            <thead>
              <tr>
                <th>Conversation ID</th>
                <th>Session ID</th>
                <th>Auto Answer</th>
                <th>Answer</th>
                <th>Decline</th>
              </tr>
            </thead>
            <tbody>
              {pendingSessions.map((pendingSession: IPendingSession, index: number) => (
                <tr key={index}>
                  <td>{pendingSession.conversationId}</td>
                  <td>{pendingSession.sessionId}</td>
                  <td>{pendingSession.autoAnswer?.toString()}</td>
                  <td>
                    <GuxButton accent="primary" onClick={()=> handlePendingSession(true ,pendingSession.conversationId)}>
                      Answer
                    </GuxButton>
                  </td>
                  <td>
                    <GuxButton accent="danger" onClick={()=> handlePendingSession(false, pendingSession.conversationId)}>
                      Decline
                    </GuxButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GuxTable>
      </GuxCard>
    )
  }

  return (
    <div className="softphone-wrapper">
      <div className="softphone-controls">
        <GuxCard id="softphone-card" accent="raised">
            <div className="softphone-call-content">
              <label className="gux-body-md-bold">Outbound Phone Call</label>
              <input type="text" onChange={(e) => setPhoneNumber(e.target.value)} />
              <GuxButton accent="primary" className="call-btn" onClick={placeCall}>Place Call</GuxButton>
              <GuxButton accent="danger" className="end-btn">End All</GuxButton>
            </div>
          </GuxCard>
          <GuxCard id="softphone-station" accent="raised">
            <div className="softphone-call-content">
              <StationDetails></StationDetails>
            </div>
          </GuxCard>
      </div>
      <div className="softphone-sessions">{createConversationsTable()}</div>
      <div className="softphone-sessions">{createPendingSessionsTable()}</div>
    </div>
  );
}
