import React, { useState } from 'react'
import './User.css';

export default function User() {
  const [personDetails] = useState((window as any).sdk._personDetails);
  const [stationDetails] = useState((window as any).sdk.station);
  const [configDetails] = useState((window as any).sdk._config);
  const [orgDetails] = useState((window as any).sdk._orgDetails);

  const userTable = () => {
    return (
      <div className="person-details">
        <h3>User Info</h3>
        <table>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Jabber ID</th>
            <th>Username/Email</th>
            <th>Self URI</th>
          </tr>
          <tr>
            <td>{personDetails.name}</td>
            <td>{personDetails.id}</td>
            <td>{personDetails.chat.jabberId}</td>
            <td>{personDetails.username}</td>
            <td>{personDetails.selfUri}</td>
          </tr>
        </table>
      </div>)
  }

  const stationTable = () => {
    return (
      <div className="station-details">
        <h3>Station Info</h3>
        <table>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Status</th>
            <th>Type</th>
            <th>Line Appearance</th>
            <th>Persistent Connection</th>
            <th>FORCE TURN</th>
          </tr>
          <tr>
            <td>{stationDetails.name}</td>
            <td>{stationDetails.id}</td>
            <td>{stationDetails.status}</td>
            <td>{stationDetails.type}</td>
            <td>{stationDetails.webRtcCallAppearances.toString()}</td>
            <td>{stationDetails.webRtcPersistentEnabled.toString()}</td>
            <td>{stationDetails.webRtcForceTurn.toString()}</td>
          </tr>
        </table>
      </div>
    )
  }

  const orgTable = () => {
    return (
      <div className="org-details">
        <h3>Organization Info</h3>
        <table>
          <tr>
            <th>ID</th>
            <th>Name</th>
          </tr>
          <tr>
            <td>{orgDetails.id}</td>
            <td>{orgDetails.name}</td>
          </tr>
        </table>
      </div>
    )
  }

  const configTable = () => {
    return (
      <div className="config-details">
        <h3>SDK Config Info</h3>
        <table>
          <tr>
            <th>ID</th>
            <th>Name</th>
          </tr>
          <tr>
            <td>{orgDetails.id}</td>
            <td>{orgDetails.name}</td>
          </tr>
        </table>
      </div>
    )
  }

  console.warn(window.sdk);
  return (
    <div className="user-wrapper">
      <div>
        <h1>User Details</h1>
        <p>Contains all details about your user for debugging purposes.</p>
      </div>
      <div className="table-wrapper">
        {userTable()}
        {stationTable()}
        {orgTable()}
        {configTable()}
      </div>
      <div className="config-details"></div>
    </div>
  )
}

{/* <div className="flex-container">
<div className="container">
  <h2>Container 1</h2>
  <p>This is the content of Container 1</p>
</div>
<div className="container">
  <h2>Container 2</h2>
  <p>This is the content of Container 2</p>
</div>
<div className="container">
  <h2>Container 3</h2>
  <p>This is the content of Container 3</p>
</div>
<div className="container">
  <h2>Container 4</h2>
  <p>This is the content of Container 4</p>
</div>
</div> */}
