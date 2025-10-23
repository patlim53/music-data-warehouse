import React, { useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

export default function Dashboard({ apiBaseUrl }) {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [kpis, setKpis] = useState({
    total_artists: 0,
    total_songs: 0,
    total_streams_views: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${apiBaseUrl}/kpis?platform=${selectedPlatform}`)
      .then(res => res.json())
      .then(data => {
        setKpis(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching KPIs:', error);
        setIsLoading(false);
      });
  }, [selectedPlatform, apiBaseUrl]);

  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 mt-1">An overview of music performance metrics.</p>
      </header>

      {/* Platform Filter Dropdown */}
      <div className="mb-8">
        <label htmlFor="platform-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Platform
        </label>
        <select
          id="platform-filter"
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Available Platforms</option>
          <option value="youtube">YouTube Charts Only</option>
          <option value="spotify">Spotify Charts Only</option>
          <option value="grammy">Grammy Awards Only</option>
        </select>
      </div>

      {/* KPI Cards - Stacked Vertically */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <section className="space-y-6 max-w-2xl">
          <KpiCard
            title="Total Unique Artists"
            value={formatNumber(kpis.total_artists)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <KpiCard
            title="Total Unique Songs"
            value={formatNumber(kpis.total_songs)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
            }
          />

          {selectedPlatform !== 'grammy' && (
            <KpiCard
              title={
                selectedPlatform === 'spotify' ? 'Total Spotify Streams' :
                selectedPlatform === 'youtube' ? 'Total YouTube Views' :
                'Total Streams/Views'
              }
              value={formatNumber(kpis.total_streams_views)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m-9 4h12M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
            />
          )}

          {selectedPlatform === 'grammy' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Total Streams/Views data is unavailable for Grammy Awards.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}