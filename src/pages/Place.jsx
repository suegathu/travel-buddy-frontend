import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Define a better default image URL - using a reliable placeholder
const DEFAULT_PLACE_IMAGE = 'https://placehold.co/300x200?text=No+Image';

const Place = ({ setPlaces, setFilteredPlaces, setHoveredPlaceId, hoveredPlaceId, onDataFetched, userPosition }) => {
  const [localPlaces, setLocalPlaces] = useState([]);
  const [localFilteredPlaces, setLocalFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [quickViewPlace, setQuickViewPlace] = useState(null);
  
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
        // Add refresh=true to ensure all places have prices and images
        const response = await axios.get('/api/places/?refresh=true', getAuthHeaders());
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
  }, [activeSearch, selectedType, localPlaces, minRating]);

  const filterPlaces = () => {
    let results = [...localPlaces];

    if (selectedType === 'favorites') {
      results = results.filter((place) => favorites.includes(place.id));
    } else if (selectedType !== 'all') {
      results = results.filter((place) => place.place_type === selectedType);
    }

    // Add price filter
    results = results.filter((place) => {
      const price = typeof place.price === 'number' ? place.price : parseFloat(place.price || 0);
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Add rating filter
    results = results.filter((place) => {
      const rating = parseFloat(place.rating || 0);
      return rating >= minRating;
    });

    if (activeSearch.trim()) {
      const search = activeSearch.toLowerCase();
      results = results.filter((place) =>
        [place.name, place.location, place.address].some((field) =>
          field?.toLowerCase().includes(search)
        )
      );
    }

    // Apply sorting
    if (sortBy === 'price-low') {
      results.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === 'price-high') {
      results.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sortBy === 'rating') {
      results.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
    }

    setLocalFilteredPlaces(results);
    
    // For Dashboard component
    if (setFilteredPlaces) setFilteredPlaces(results);
  };

  const handleSearch = () => {
    setActiveSearch(searchInput);
    
    // Save search to recent searches if not empty and not already in list
    if (searchInput.trim() && !recentSearches.includes(searchInput.trim())) {
      const updated = [searchInput.trim(), ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const handleKeyPress = (e) => e.key === 'Enter' && handleSearch();

  const handleActionClick = (place) => {
    const routeMap = {
      hotel: `/bookings/hotel/${place.id}`,
      restaurant: `/reservations/restaurant/${place.id}`,
      attraction: `/tickets/attraction/${place.id}`,
    };

    navigate(routeMap[place.place_type], {
      state: {
        selectedPlace: place, // always pass full place object
        selectedPrice: place.price, // pass price separately too
      },
    });
  };

  const handleMouseEnter = (id) => {
    if (setHoveredPlaceId) setHoveredPlaceId(id);
  };

  const handleMouseLeave = () => {
    if (setHoveredPlaceId) setHoveredPlaceId(null);
  };

  const toggleFavorite = (placeId, e) => {
    e.stopPropagation();
    let newFavorites;
    if (favorites.includes(placeId)) {
      newFavorites = favorites.filter(id => id !== placeId);
    } else {
      newFavorites = [...favorites, placeId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleQuickView = (place, e) => {
    e.stopPropagation();
    setQuickViewPlace(place);
  };

  // Helper function to check if an image URL is valid
  const getValidImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl.includes('undefined') || imageUrl === '') {
      return DEFAULT_PLACE_IMAGE;
    }
    return imageUrl;
  };

  if (loading) return <div className="text-center mt-10">Loading places...</div>;

  return (
    <div className="p-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-grow flex relative">
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
          
          {searchInput && recentSearches.length > 0 && (
            <div className="absolute mt-12 w-full bg-white rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              <p className="px-4 py-2 text-sm text-gray-500">Recent Searches</p>
              {recentSearches.map((term, index) => (
                <div 
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => {
                    setSearchInput(term);
                    setActiveSearch(term);
                  }}
                >
                  <span className="text-gray-400 mr-2">🕒</span> {term}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Places</option>
            <option value="hotel">Hotels</option>
            <option value="restaurant">Restaurants</option>
            <option value="attraction">Attractions</option>
            <option value="favorites">Favorites</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              filterPlaces();
            }}
            className="min-w-[150px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition flex items-center"
          >
            <span>Filters</span>
            <span className="ml-1">{showFilters ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex items-center">
              <span className="mr-2">${priceRange[0]}</span>
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="w-full"
              />
              <span className="mx-2">to</span>
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
              <span className="ml-2">${priceRange[1]}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full mr-4"
              />
              <span>{minRating} ⭐</span>
            </div>
          </div>

          <button
            onClick={filterPlaces}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Results Info */}
      <div className="mb-4 text-gray-600">
        {localFilteredPlaces.length} {localFilteredPlaces.length === 1 ? 'place' : 'places'} found
        {activeSearch && <span> for "<strong>{activeSearch}</strong>"</span>}
        {selectedType !== 'all' && selectedType !== 'favorites' && <span> in <strong>{selectedType}s</strong></span>}
        {selectedType === 'favorites' && <span> in <strong>Favorites</strong></span>}
      </div>

      {/* Places List - Modified to display 2 columns instead of 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {localFilteredPlaces.length > 0 ? (
          localFilteredPlaces.map((place) => (
            <div
              key={place.id}
              className={`bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between transition relative ${
                hoveredPlaceId === place.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
              }`}
              onMouseEnter={() => handleMouseEnter(place.id)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={(e) => toggleFavorite(place.id, e)}
                className="absolute top-2 right-2 bg-white bg-opacity-70 p-2 rounded-full hover:bg-opacity-100 transition z-10"
                aria-label={favorites.includes(place.id) ? "Remove from favorites" : "Add to favorites"}
              >
                {favorites.includes(place.id) ? (
                  <span className="text-red-500">❤️</span>
                ) : (
                  <span className="text-gray-400">🤍</span>
                )}
              </button>
              
              <img
                src={getValidImageUrl(place.image_url)}
                alt={place.name}
                className="h-40 w-full object-cover rounded-xl mb-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PLACE_IMAGE;
                }}
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
                <p className="text-blue-600 font-semibold mb-3">
                  ${typeof place.price === 'number' ? place.price.toFixed(2) : place.price || '0.00'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => handleQuickView(place, e)}
                  className="text-gray-600 py-2 px-4 rounded-xl text-sm mt-2 bg-gray-100 hover:bg-gray-200 flex-grow"
                >
                  Quick View
                </button>
                <button
                  onClick={() => handleActionClick(place)}
                  className={`text-white py-2 px-4 rounded-xl text-sm mt-2 flex-grow ${
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
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-10">
            No places found matching your search criteria. Try adjusting your filters.
          </div>
        )}
      </div>
      
      {/* Quick View Modal */}
      {quickViewPlace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setQuickViewPlace(null)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{quickViewPlace.name}</h2>
              <button onClick={() => setQuickViewPlace(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <img
              src={getValidImageUrl(quickViewPlace.image_url)}
              alt={quickViewPlace.name}
              className="w-full h-64 object-cover rounded-lg mb-4"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_PLACE_IMAGE;
              }}
            />
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600 font-semibold">Location</p>
                <p>{quickViewPlace.location || quickViewPlace.address || 'No location'}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Type</p>
                <p className="capitalize">{quickViewPlace.place_type}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Rating</p>
                <p>⭐ {quickViewPlace.rating || '4.0'} / 5.0</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Price</p>
                <p className="text-blue-600 font-semibold">
                  ${typeof quickViewPlace.price === 'number' ? quickViewPlace.price.toFixed(2) : quickViewPlace.price || '0.00'}
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 font-semibold mb-1">Description</p>
            <p className="mb-4">{quickViewPlace.description || 'No description available for this place.'}</p>
            
            <div className="flex justify-between">
              <button
                onClick={(e) => {
                  toggleFavorite(quickViewPlace.id, e);
                }}
                className="flex items-center text-gray-700 py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                {favorites.includes(quickViewPlace.id) ? (
                  <>
                    <span className="text-red-500 mr-2">❤️</span> 
                    <span>Remove from favorites</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-400 mr-2">🤍</span>
                    <span>Add to favorites</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  handleActionClick(quickViewPlace);
                  setQuickViewPlace(null);
                }}
                className={`text-white py-2 px-6 rounded-xl ${
                  quickViewPlace.place_type === 'hotel'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : quickViewPlace.place_type === 'restaurant'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {quickViewPlace.place_type === 'hotel'
                  ? 'Book Now'
                  : quickViewPlace.place_type === 'restaurant'
                  ? 'Reserve'
                  : 'Get Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Place;