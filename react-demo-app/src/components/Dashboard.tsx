import './Dashboard.css';
import Devices from './Devices';
import Softphone from './Softphone';
import User from './User';
import NavToolbar from './NavToolbar';

export default function Dashboard() {
  return (
    <div className="dashboard-wrapper">
      <NavToolbar></NavToolbar>
      <div className="panels">
        <Softphone></Softphone>
      </div>
      {/* <User></User> */}
      {/* <div className="dashboard-user-wrapper">
        <div className="dashboard-user">
          <div>{personDetails.name}</div>
          <div>{personDetails.id}</div>
          <div>{personDetails.username}</div>
          <div>{personDetails.chat.jabberId}</div>
        </div>
      </div> */}
      {/* <Devices></Devices> */}
    </div>
  )
}
