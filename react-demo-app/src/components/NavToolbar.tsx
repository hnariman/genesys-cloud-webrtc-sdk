import { useEffect, useState } from 'react';
import './NavToolbar.css';
import { GuxButton, GuxIcon } from 'genesys-spark-components-react';
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
    console.warn('here we are: ', panel);
    setActivePanel(panel);
    navigate(`/dashboard?panel=${panel}`);
  }

  return (
    <div className="nav-toolbar-wrapper">
      <div className="nav-title">
        <GuxIcon id='genesys-icon' iconName='product-logo-g' decorative></GuxIcon>
        <p className='gux-heading-lg-bold'>Genesys Cloud WebRTC SDK</p>
      </div>
      <div className="nav-buttons">
        <GuxButton id='softphone-button' accent={activePanel === 'softphone' ? 'tertiary' : 'ghost'} onClick={()=>handlePanelChange('softphone')}>
          <GuxIcon size="medium" iconName="phone" decorative={true}></GuxIcon>
          <span>Softphone</span>
        </GuxButton>
        <GuxButton className="" accent={activePanel === 'video' ? 'tertiary' : 'ghost'} onClick={()=>handlePanelChange('video')}>
          <GuxIcon size="medium" iconName="video" decorative={true}></GuxIcon>
          <span>Video</span>
        </GuxButton>
        <GuxButton className="" accent={activePanel === 'devices' ? 'tertiary' : 'ghost'} onClick={()=>handlePanelChange('devices')}>
          <GuxIcon size="small" iconName="device-headphones" decorative={true}></GuxIcon>
          <span>Devices</span>
        </GuxButton>
        <GuxButton className="" accent={activePanel === 'user' ? 'tertiary' : 'ghost'} onClick={()=>handlePanelChange('user')}>
          <GuxIcon size="medium" iconName="user" decorative={true}></GuxIcon>
          <span>User</span>
        </GuxButton>
      </div>
    </div>
  )
}
