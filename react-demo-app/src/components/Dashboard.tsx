import './Dashboard.css';
import Devices from './Devices';
import Softphone from './Softphone';
import User from './User';
import NavToolbar from './NavToolbar';
import Video from './Video';

export default function Dashboard() {
  return (
    <div className="dashboard-wrapper">
      <NavToolbar></NavToolbar>
      <div className="panels">
        {/* <Softphone></Softphone> */}
        <Video></Video>
      </div>
    </div>
  )
}
