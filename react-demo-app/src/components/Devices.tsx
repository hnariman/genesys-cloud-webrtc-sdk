import React, { useEffect, useState } from 'react'
import './Devices.css';
import { enumerateDevices } from '../services/sdk-service';

export default function Devices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>();
  const deviceRow = devices?.map((device) => {
    return (
      <tr>
        <td>{device.label}</td>
        <td>{device.deviceId}</td>
        <td>{device.groupId}</td>
        <td>{device.kind}</td>
      </tr>
    );
  })
  useEffect(() => {
    enumerateDevices().then(devices => {
      console.warn(devices);
      setDevices(devices)
    })
  },[])
  return (
    <div className="devices-wrapper">
      <div>
        <h1>Devices</h1>
      </div>
      <table>
        <tr>
          <th>Label</th>
          <th>Device ID</th>
          <th>Group ID</th>
          <th>Kind</th>
        </tr>
        {deviceRow}
      </table>
    </div>
  )
}
