import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- Helper Functions & Constants ---
const API_BASE_URL = 'http://localhost:3001/api';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#6b7280' }
    },
    title: {
      display: true,
      font: { size: 16 },
      color: '#111827'
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#6b7280' },
      grid: { color: '#e5e7eb' }
    },
    x: {
      ticks: { color: '#6b7280' },
      grid: { display: false }
    }
  }
};


// --- React Components ---
const KpiCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <div className="h-80 relative">
      {children}
    </div>
  </div>
);

export default function App() {
  const [kpis, setKpis] = useState({ total_artists: 0, total_songs: 0, total_spotify_streams: 0, total_youtube_views: 0 });
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Fetch KPI data
    fetch(`${API_BASE_URL}/kpis`)
      .then(res => res.json())
      .then(data => setKpis(data))
      .catch(error => console.error("Error fetching KPIs:", error));

    // Fetch Chart data
    fetch(`${API_BASE_URL}/chart-data`)
      .then(res => res.json())
      .then(data => {
        const formattedChartData = {
          topArtistsSpotify: {
            labels: data.topArtistsSpotify.map(d => d.artist_name),
            datasets: [{
              label: 'Total Spotify Streams',
              data: data.topArtistsSpotify.map(d => d.total_metric),
              backgroundColor: 'rgba(34, 197, 94, 0.6)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 1,
            }]
          },
          topArtistsYouTube: {
            labels: data.topArtistsYouTube.map(d => d.artist_name),
            datasets: [{
              label: 'Total YouTube Views',
              data: data.topArtistsYouTube.map(d => d.total_metric),
              backgroundColor: 'rgba(239, 68, 68, 0.6)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 1,
            }]
          },
          songsLongestOnChart: {
             labels: data.songsLongestOnChart.map(d => d.track_name),
            datasets: [{
              label: 'Weeks on Chart',
              data: data.songsLongestOnChart.map(d => d.total_metric),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            }]
          }
        };
        setChartData(formattedChartData);
      })
      .catch(error => console.error("Error fetching chart data:", error));
  }, []);


  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-lg p-5 hidden md:block">
            <div className="flex items-center mb-10">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.1.895 2 2 2s2-.9 2-2M9 19c0-1.1.895-2 2-2s2 .9 2 2m-3-5V3m6 6V3"></path></svg>
                <h1 className="text-2xl font-bold text-gray-800 ml-2">Music OLAP</h1>
            </div>
            <ul>
                <li className="mb-4">
                    <a href="#" className="flex items-center p-3 text-white bg-blue-600 rounded-lg shadow-md">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>
                        <span className="ml-3 font-semibold">Dashboard</span>
                    </a>
                </li>
            </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <header>
            <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-gray-500 mt-1">An overview of music performance metrics.</p>
          </header>

          {/* KPI Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
            <KpiCard title="Total Unique Artists" value={formatNumber(kpis.total_artists)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>} />
            <KpiCard title="Total Unique Songs" value={formatNumber(kpis.total_songs)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"></path></svg>} />
            <KpiCard title="Total Spotify Streams" value={formatNumber(kpis.total_spotify_streams)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m-9 4h12M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>} />
            <KpiCard title="Total YouTube Views" value={formatNumber(kpis.total_youtube_views)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>} />
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {!chartData ? (
              <p>Loading chart data...</p>
            ) : (
              <>
                <ChartCard>
                   <Bar options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Top 10 Artists by Spotify Streams'}}}} data={chartData.topArtistsSpotify} />
                </ChartCard>
                <ChartCard>
                   <Bar options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Top 10 Artists by YouTube Views'}}}} data={chartData.topArtistsYouTube} />
                </ChartCard>
                 <ChartCard>
                   <Bar options={{...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Top 10 Songs by Weeks on Chart'}}}} data={chartData.songsLongestOnChart} />
                </ChartCard>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

