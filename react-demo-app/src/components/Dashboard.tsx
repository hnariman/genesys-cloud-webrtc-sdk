import './Dashboard.css';
import Devices from './Devices';
import Softphone from './Softphone';

export default function Dashboard() {

  return (
    <div className="dashboard-wrapper">
      <Softphone></Softphone>
      {/* <Devices></Devices> */}
    </div>
  )
}
