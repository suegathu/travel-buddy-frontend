import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const DEFAULT_RESTAURANT_IMAGE = 'https://via.placeholder.com/300/FFC107/000000?Text=Restaurant';

const Place = ({ setPlaces, setFilteredPlaces, setHoveredPlaceId, hoveredPlaceId, onDataFetched, userPosition }) => {
  const [localPlaces, setLocalPlaces] = useState([]);
  const [localFilteredPlaces, setLocalFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${authTokens?.access}`,
    },
  });

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!authTokens) {
        console.warn('No authentication tokens available');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/places/', getAuthHeaders());
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        
        // Add mock coordinates for testing if they don't exist
        const placesWithCoordinates = data.map((place, index) => ({
          ...place,
          latitude: place.latitude || (userPosition?.[0] + (Math.random() * 0.01 - 0.005)),
          longitude: place.longitude || (userPosition?.[1] + (Math.random() * 0.01 - 0.005)),
        }));
        
        setLocalPlaces(placesWithCoordinates);
        setLocalFilteredPlaces(placesWithCoordinates);
        
        // For Dashboard component
        if (setPlaces) setPlaces(placesWithCoordinates);
        if (setFilteredPlaces) setFilteredPlaces(placesWithCoordinates);
        if (onDataFetched) onDataFetched(placesWithCoordinates);
      } catch (error) {
        console.error('Error fetching places:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userPosition) {
      fetchPlaces();
    }
  }, [authTokens, userPosition, setPlaces, setFilteredPlaces, onDataFetched]);

  useEffect(() => {
    filterPlaces();
  }, [activeSearch, selectedType, localPlaces]);

  const filterPlaces = () => {
    let results = [...localPlaces];

    if (selectedType !== 'all') {
      results = results.filter((place) => place.place_type === selectedType);
    }

    if (activeSearch.trim()) {
      const search = activeSearch.toLowerCase();
      results = results.filter((place) =>
        [place.name, place.location, place.address].some((field) =>
          field?.toLowerCase().includes(search)
        )
      );
    }

    setLocalFilteredPlaces(results);
    
    // For Dashboard component
    if (setFilteredPlaces) setFilteredPlaces(results);
  };

  const handleSearch = () => setActiveSearch(searchInput);
  const handleKeyPress = (e) => e.key === 'Enter' && handleSearch();

  const handleActionClick = (place) => {
    const routeMap = {
      hotel: `/bookings/hotel/${place.id}`,
      restaurant: `/reservations/restaurant/${place.id}`,
      attraction: `/tickets/attraction/${place.id}`,
    };

    navigate(routeMap[place.place_type], {
      ...(place.place_type === 'restaurant' && { state: { selectedPlace: place } }),
    });
  };

  const handleMouseEnter = (id) => {
    if (setHoveredPlaceId) setHoveredPlaceId(id);
  };

  const handleMouseLeave = () => {
    if (setHoveredPlaceId) setHoveredPlaceId(null);
  };

  if (loading) return <div className="text-center mt-10">Loading places...</div>;

  return (
    <div className="p-6">
      {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow flex">
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search places"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition"
            >
              Search
            </button>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Places</option>
            <option value="hotel">Hotels</option>
            <option value="restaurant">Restaurants</option>
            <option value="attraction">Attractions</option>
          </select>
        
      </div>

      {/* Results Info */}
      <div className="mb-4 text-gray-600">
        {localFilteredPlaces.length} {localFilteredPlaces.length === 1 ? 'place' : 'places'} found
        {activeSearch && <span> for "<strong>{activeSearch}</strong>"</span>}
        {selectedType !== 'all' && <span> in <strong>{selectedType}s</strong></span>}
      </div>

      {/* Places List - Modified to display 2 columns instead of 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {localFilteredPlaces.length > 0 ? (
          localFilteredPlaces.map((place) => (
            <div
              key={place.id}
              className={`bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between transition ${
                hoveredPlaceId === place.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
              }`}
              onMouseEnter={() => handleMouseEnter(place.id)}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={place.image_url || DEFAULT_RESTAURANT_IMAGE}
                alt={place.name}
                className="h-40 w-full object-cover rounded-xl mb-4"
              />
              <div className="flex-grow">
                <h3 className="text-lg font-semibold mb-1">{place.name}</h3>
                <p className="text-gray-500 text-sm mb-2">
                  {place.location || place.address || 'No location'}
                </p>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-yellow-500 text-sm">⭐ {place.rating || '4.0'} / 5.0</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      place.place_type === 'hotel'
                        ? 'bg-blue-100 text-blue-800'
                        : place.place_type === 'restaurant'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {place.place_type?.charAt(0).toUpperCase() + place.place_type?.slice(1)}
                  </span>
                </div>
                <p className="text-blue-600 font-semibold mb-3">${place.price}</p>
              </div>
              <button
                onClick={() => handleActionClick(place)}
                className={`text-white py-2 px-4 rounded-xl text-sm mt-2 ${
                  place.place_type === 'hotel'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : place.place_type === 'restaurant'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {place.place_type === 'hotel'
                  ? 'Book Now'
                  : place.place_type === 'restaurant'
                  ? 'Reserve'
                  : 'Get Ticket'}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-10">
            No places found matching your search criteria. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default Place;