import { useState } from 'react';

function Sidebar({ isOpen, onClose, airport, showToast }) {
  const [activeGroups, setActiveGroups] = useState({ sfa: true, sma: false, srna: false });
  const [selectedSubItem, setSelectedSubItem] = useState('');

  if (!airport) return null;

  const toggleGroup = (group) => {
    setActiveGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleSelectItem = (name) => {
    setSelectedSubItem(name);
    showToast(`📂 Section sélectionnée : ${name}`);
  };

  return (
    <aside id="sidebar" className={isOpen ? 'open' : ''} role="complementary">
      <div className="sidebar-header">
        <div>
          <div className="sidebar-airport-name">{airport.name}</div>
          <div className="sidebar-subtitle">{airport.iata}</div>
        </div>
        <button id="btn-close-sidebar" onClick={onClose} aria-label="Fermer le panneau">✕</button>
      </div>

      <div className="sidebar-body">
        <div className="status-badge">
          <span className="status-dot"></span>
          Opérationnel
        </div>

        <div className="nav-sections">
          {/* SFA */}
          <div className="nav-group">
            <button className={`nav-group-toggle ${activeGroups.sfa ? 'active' : ''}`} onClick={() => toggleGroup('sfa')}>
              <span className="nav-group-left">
                <span className="nav-group-dot dot-sfa"></span>SFA
              </span>
              <span className="nav-group-caret" style={{ transform: activeGroups.sfa ? 'rotate(90deg)' : 'none' }}>▶</span>
            </button>
            <div className={`nav-sub-list ${activeGroups.sfa ? 'open' : ''}`}>
              {['AMHS/RSTA (aero)', 'SMT (meteo)', 'AIDC', 'ATS-DS'].map(item => (
                <button 
                  key={item}
                  className={`nav-sub-item ${selectedSubItem === item ? 'selected' : ''}`} 
                  onClick={() => handleSelectItem(item)}
                >
                  <span className="nav-sub-dot"></span>{item}
                </button>
              ))}
            </div>
          </div>

          {/* SMA */}
          <div className="nav-group">
            <button className={`nav-group-toggle ${activeGroups.sma ? 'active' : ''}`} onClick={() => toggleGroup('sma')}>
              <span className="nav-group-left">
                <span className="nav-group-dot dot-sma"></span>SMA
              </span>
              <span className="nav-group-caret" style={{ transform: activeGroups.sma ? 'rotate(90deg)' : 'none' }}>▶</span>
            </button>
            <div className={`nav-sub-list ${activeGroups.sma ? 'open' : ''}`}>
              {['VHF', 'HF', 'CPDLC'].map(item => (
                <button 
                  key={item}
                  className={`nav-sub-item ${selectedSubItem === item ? 'selected' : ''}`} 
                  onClick={() => handleSelectItem(item)}
                >
                  <span className="nav-sub-dot"></span>{item}
                </button>
              ))}
            </div>
          </div>

          {/* SRNA */}
          <div className="nav-group">
            <button className={`nav-group-toggle ${activeGroups.srna ? 'active' : ''}`} onClick={() => toggleGroup('srna')}>
              <span className="nav-group-left">
                <span className="nav-group-dot dot-srna"></span>SRNA
              </span>
              <span className="nav-group-caret" style={{ transform: activeGroups.srna ? 'rotate(90deg)' : 'none' }}>▶</span>
            </button>
            <div className={`nav-sub-list ${activeGroups.srna ? 'open' : ''}`}>
              {['Réseau', 'Antenne'].map(item => (
                <button 
                  key={item}
                  className={`nav-sub-item ${selectedSubItem === item ? 'selected' : ''}`} 
                  onClick={() => handleSelectItem(item)}
                >
                  <span className="nav-sub-dot"></span>{item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;