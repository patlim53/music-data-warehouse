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

export default function SongRankings({ apiBaseUrl }) {
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${apiBaseUrl}/song-rankings?platform=${selectedPlatform}`)
      .then(res => res.json())
      .then(data => {
        const formattedData = {
          labels: data.map(d => d.track_name),
          datasets: [{
            label: 'Weeks on Chart',
            data: data.map(d => d.total_metric),
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          }]
        };
        setChartData(formattedData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching song rankings:', error);
        setIsLoading(false);
      });
  }, [selectedPlatform, apiBaseUrl]);

  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Song Rankings</h2>
        <p className="text-gray-500 mt-1">Top 10 songs by weeks on chart.</p>
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
          <ChartCard title={`Top 10 Songs by Weeks on Chart (${selectedPlatform === 'spotify' ? 'Spotify' : 'YouTube'})`}>
            {chartData && <Bar data={chartData} options={chartOptions} />}
          </ChartCard>
        </section>
      )}
    </main>
  );
}