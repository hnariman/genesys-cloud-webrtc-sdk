import { useEffect, useState } from 'react';
import './NavToolbar.css';
import { GuxIcon, GuxSegmentedControlBeta, GuxSegmentedControlItem } from 'genesys-spark-components-react';

import { useNavigate, useSearchParams } from 'react-router-dom';


export default function NavToolbar() {
  const [ activePanel, setActivePanel ] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check URL for panel and set accordingly.
    if (searchParams.size) {
      setActivePanel(searchParams.get('panel')!);
    }
  }, [searchParams])

  function handlePanelChange(panel: string) {
    setActivePanel(panel);
    navigate(`/dashboard?panel=${panel}`);
  }

  return (
    <div className="nav-toolbar-wrapper">
      <div className="nav-title">
        <GuxIcon id='genesys-icon' iconName='product-logo-g' decorative></GuxIcon>
        <p className='gux-heading-lg-bold'>Genesys Cloud WebRTC SDK</p>
      </div>
      <GuxSegmentedControlBeta className="nav-buttons" value={activePanel} onInput={(event)=>handlePanelChange((event.target as HTMLInputElement).value)}>
        <GuxSegmentedControlItem id='softphone-button' value="softphone">
          <GuxIcon slot='icon' size="medium" iconName="phone" decorative={true}></GuxIcon>
          <span slot='text'>Softphone</span>
        </GuxSegmentedControlItem>
        <GuxSegmentedControlItem value="video">
          <GuxIcon slot='icon' size="medium" iconName="video" decorative={true}></GuxIcon>
          <span slot='text'>Video</span>
        </GuxSegmentedControlItem>
        <GuxSegmentedControlItem value="devices">
          <GuxIcon slot='icon' size="small" iconName="device-headphones" decorative={true}></GuxIcon>
          <span slot='text'>Devices</span>
        </GuxSegmentedControlItem>
        <GuxSegmentedControlItem value="user">
          <GuxIcon slot='icon' size="medium" iconName="user" decorative={true}></GuxIcon>
          <span slot='text'>User</span>
        </GuxSegmentedControlItem>
      </GuxSegmentedControlBeta>
    </div>
  )
}
