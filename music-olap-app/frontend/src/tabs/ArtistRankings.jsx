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
import ChartCard from '../components/ChartCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  indexAxis: 'y', // This makes it horizontal
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { color: '#6b7280' },
      grid: { color: '#e5e7eb' }
    },
    y: {
      ticks: { color: '#6b7280' },
      grid: { display: false }
    }
  }
};

export default function ArtistRankings({ apiBaseUrl }) {
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${apiBaseUrl}/artist-rankings?platform=${selectedPlatform}`)
      .then(res => res.json())
      .then(data => {
        const formattedData = {
          labels: data.map(d => d.artist_name),
          datasets: [{
            label: selectedPlatform === 'spotify' ? 'Total Streams' : 'Total Views',
            data: data.map(d => d.total_metric),
            backgroundColor: selectedPlatform === 'spotify' 
              ? 'rgba(34, 197, 94, 0.6)' 
              : 'rgba(239, 68, 68, 0.6)',
            borderColor: selectedPlatform === 'spotify'
              ? 'rgba(34, 197, 94, 1)'
              : 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          }]
        };
        setChartData(formattedData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching artist rankings:', error);
        setIsLoading(false);
      });
  }, [selectedPlatform, apiBaseUrl]);

  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Artist Rankings</h2>
        <p className="text-gray-500 mt-1">Top 10 artists by streams or views.</p>
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
          <option value="youtube">YouTube Charts Only</option>
          <option value="spotify">Spotify Charts Only</option>
        </select>
      </div>

      {/* Chart Section */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <section className="max-w-4xl">
          <ChartCard title={`Top 10 Artists by ${selectedPlatform === 'spotify' ? 'Spotify Streams' : 'YouTube Views'}`}>
            {chartData && <Bar data={chartData} options={chartOptions} />}
          </ChartCard>
        </section>
      )}
    </main>
  );
}