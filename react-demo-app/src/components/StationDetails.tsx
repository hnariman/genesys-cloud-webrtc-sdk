import { GuxCard, GuxTable } from "genesys-spark-components-react";
import { useState } from "react";
import './StationDetails.css';

export default function StationDetails() {
  const [stationDetails] = useState((window as any)?.sdk?.station);

  // if (!stationDetails) {
  //   return null;
  // }

  return (
    <GuxCard className="station-details-wrapper">
      <p className="gux-body-md-bold">Station Details</p>
      <GuxTable>
        <table className="station-details-table" slot="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Status</th>
                <th>Type</th>
                <th>Line Appearance</th>
                <th>Persistent Connection</th>
                <th>FORCE TURN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
              <td>{stationDetails?.name}</td>
              <td>{stationDetails?.id}</td>
              <td>{stationDetails?.status}</td>
              <td>{stationDetails?.type}</td>
              <td>{stationDetails?.webRtcCallAppearances.toString()}</td>
              <td>{stationDetails?.webRtcPersistentEnabled.toString()}</td>
              <td>{stationDetails?.webRtcForceTurn.toString()}</td>
              </tr>
            </tbody>
        </table>
      </GuxTable>
    </GuxCard>
  );
}
