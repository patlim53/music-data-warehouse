import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './tabs/Dashboard';
import ArtistRankings from './tabs/ArtistRankings';
import SongRankings from './tabs/SongRankings';
import SearchForArtist from './tabs/SearchForArtist';

const API_BASE_URL = 'http://localhost:3001/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard apiBaseUrl={API_BASE_URL} />;
      case 'artist-rankings':
        return <ArtistRankings apiBaseUrl={API_BASE_URL} />;
      case 'song-rankings':
        return <SongRankings apiBaseUrl={API_BASE_URL} />;
      case 'search-artist':
        return <SearchForArtist apiBaseUrl={API_BASE_URL} />;
      default:
        return <Dashboard apiBaseUrl={API_BASE_URL} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        {renderTab()}
      </div>
    </div>
  );
}