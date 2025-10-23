import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import KpiCard from '../components/KpiCard';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

export default function SearchForArtist({ apiBaseUrl }) {
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistData, setArtistData] = useState(null);
  const [grammyHistory, setGrammyHistory] = useState([]);
  const [producerCredits, setProducerCredits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination state
  const [grammyPage, setGrammyPage] = useState(1);
  const [grammyTotalPages, setGrammyTotalPages] = useState(1);
  const [producerPage, setProducerPage] = useState(1);
  const [producerTotalPages, setProducerTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const handleSelectArtist = (artist) => {
    setSelectedArtist(artist);
    setIsLoading(true);
    
    // Reset pagination
    setGrammyPage(1);
    setProducerPage(1);

    // Fetch artist details and paginated data
    Promise.all([
      fetch(`${apiBaseUrl}/artist/${artist.artist_id}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/artist/${artist.artist_id}/grammys?page=1&limit=${ITEMS_PER_PAGE}`).then(res => res.json()),
      fetch(`${apiBaseUrl}/artist/${artist.artist_id}/producers?page=1&limit=${ITEMS_PER_PAGE}`).then(res => res.json())
    ])
      .then(([details, grammys, producers]) => {
        setArtistData(details);
        setGrammyHistory(grammys.data || []);
        setGrammyTotalPages(grammys.totalPages || 1);
        setProducerCredits(producers.data || []);
        setProducerTotalPages(producers.totalPages || 1);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching artist data:', error);
        setIsLoading(false);
      });
  };

  // Fetch Grammy history for a specific page
  const fetchGrammyPage = (page) => {
    fetch(`${apiBaseUrl}/artist/${selectedArtist.artist_id}/grammys?page=${page}&limit=${ITEMS_PER_PAGE}`)
      .then(res => res.json())
      .then(grammys => {
        setGrammyHistory(grammys.data || []);
        setGrammyPage(page);
      })
      .catch(error => console.error('Error fetching Grammy page:', error));
  };

  // Fetch Producer credits for a specific page
  const fetchProducerPage = (page) => {
    fetch(`${apiBaseUrl}/artist/${selectedArtist.artist_id}/producers?page=${page}&limit=${ITEMS_PER_PAGE}`)
      .then(res => res.json())
      .then(producers => {
        setProducerCredits(producers.data || []);
        setProducerPage(page);
      })
      .catch(error => console.error('Error fetching Producer page:', error));
  };

  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Search for Artist</h2>
        <p className="text-gray-500 mt-1">Search for an artist to view their detailed information.</p>
      </header>

      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar apiBaseUrl={apiBaseUrl} onSelectArtist={handleSelectArtist} />
      </div>

      {/* Artist Information */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {!isLoading && artistData && (
        <div>
          {/* Artist Name */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800">{selectedArtist.artist_name}</h3>
          </div>

          {/* Streaming Stats - Vertically Stacked */}
          <section className="space-y-6 max-w-2xl mb-12">
            <KpiCard
              title="Total Spotify Streams"
              value={formatNumber(artistData.total_spotify_streams)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              }
            />

            <KpiCard
              title="Total YouTube Views"
              value={formatNumber(artistData.total_youtube_views)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />
          </section>

          {/* Tables Side by Side */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Producer Credits Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800">Producer Credits</h4>
              </div>
              <div className="overflow-x-auto">
                {producerCredits.length > 0 ? (
                  <>
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producer Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {producerCredits.map((producer, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {producer.producer_name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {producerTotalPages > 1 && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => fetchProducerPage(producerPage - 1)}
                          disabled={producerPage === 1}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            producerPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-700">
                          Page {producerPage} of {producerTotalPages}
                        </span>
                        <button
                          onClick={() => fetchProducerPage(producerPage + 1)}
                          disabled={producerPage === producerTotalPages}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            producerPage === producerTotalPages
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No producer credits available
                  </div>
                )}
              </div>
            </div>

            {/* Grammy History Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800">Grammy History</h4>
              </div>
              <div className="overflow-x-auto">
                {grammyHistory.length > 0 ? (
                  <>
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Song/Album
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Result
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grammyHistory.map((grammy, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {grammy.song_album_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {grammy.year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                grammy.result === 'Won' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {grammy.result}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {grammyTotalPages > 1 && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => fetchGrammyPage(grammyPage - 1)}
                          disabled={grammyPage === 1}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            grammyPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-700">
                          Page {grammyPage} of {grammyTotalPages}
                        </span>
                        <button
                          onClick={() => fetchGrammyPage(grammyPage + 1)}
                          disabled={grammyPage === grammyTotalPages}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            grammyPage === grammyTotalPages
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No Grammy history available
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* No Artist Selected */}
      {!isLoading && !artistData && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 text-lg">Search for an artist to view their information</p>
        </div>
      )}
    </main>
  );
}