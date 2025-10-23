import React from 'react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z' },
    { id: 'artist-rankings', name: 'Artist Rankings', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'song-rankings', name: 'Song Rankings', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z' },
    { id: 'search-artist', name: 'Search for Artist', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
  ];

  return (
    <nav className="w-64 bg-white shadow-lg p-5 hidden md:block">
      {/* Logo/Title Section */}
      <div className="flex items-center mb-10">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.1.895 2 2 2s2-.9 2-2M9 19c0-1.1.895-2 2-2s2 .9 2 2m-3-5V3m6 6V3"></path>
        </svg>
        <h1 className="text-2xl font-bold text-gray-800 ml-2">Music OLAP</h1>
      </div>

      {/* Navigation Tabs */}
      <ul>
        {tabs.map((tab) => (
          <li key={tab.id} className="mb-4">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center p-3 rounded-lg shadow-md transition-colors ${
                activeTab === tab.id
                  ? 'text-white bg-blue-600'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d={tab.icon} />
              </svg>
              <span className="ml-3 font-semibold">{tab.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}