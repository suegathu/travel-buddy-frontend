import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Constants
const API_BASE_URL = "https://travel-buddy-backend-8kf4.onrender.com/api";
const DEFAULT_PLACE_IMAGE = 'https://images.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg';
const PRICE_RANGE_MIN = 250;
const PRICE_RANGE_MAX = 50000;

const Place = ({ setPlaces, setFilteredPlaces, setHoveredPlaceId, hoveredPlaceId, onDataFetched, userPosition }) => {
  // State variables
  const [localPlaces, setLocalPlaces] = useState([]);
  const [localFilteredPlaces, setLocalFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [priceRange, setPriceRange] = useState([PRICE_RANGE_MIN, PRICE_RANGE_MAX]);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [quickViewPlace, setQuickViewPlace] = useState(null);
  const [placeTypeStats, setPlaceTypeStats] = useState({
    hotel: 0,
    restaurant: 0,
    attraction: 0
  });
  
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);

  // Helper functions
  const getAuthHeaders = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${authTokens?.access}`,
    },
  }), [authTokens]);

  const getValidImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl === '' || !imageUrl.startsWith('http')) {
      return DEFAULT_PLACE_IMAGE;
    }
    return imageUrl;
  };

  // Updated fetch function to match admin approach
  const fetchAllPlaces = useCallback(async () => {
    if (!authTokens) {
      console.warn('No authentication tokens available');
      setError('Authentication required');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use the same approach as AdminPlaces - high limit to get all records
      const queryParams = `limit=10000`; // Set very high limit to get all records
      
      const response = await axios.get(
        `${API_BASE_URL}/places/?${queryParams}`, 
        getAuthHeaders()
      );
      
      console.log('API Response:', response.data);
      
      // Handle different response structures
      let data = response.data;
      let allPlaces = Array.isArray(data) ? data : (data.results || data);
      
      console.log(`Fetched ${allPlaces.length} places from API`);
      
      // Normalize the data - ensure all required fields exist
      const placesWithCoordinates = allPlaces.map((place) => ({
        ...place,
        // Ensure coordinates exist (use user position + random offset if missing)
        latitude: place.latitude || (userPosition?.[0] ? userPosition[0] + (Math.random() * 0.01 - 0.005) : 0),
        longitude: place.longitude || (userPosition?.[1] ? userPosition[1] + (Math.random() * 0.01 - 0.005) : 0),
        // Normalize place_type field
        place_type: place.place_type || place.category || 'hotel',
        // Ensure numeric values
        price: parseFloat(place.price || 0),
        rating: parseFloat(place.rating || 0),
        // Ensure other fields exist
        name: place.name || 'Unnamed Place',
        city: place.city || 'Unknown City',
        image_url: place.image_url || DEFAULT_PLACE_IMAGE,
        description: place.description || ''
      }));

      // Calculate place type statistics
      const typeCount = {
        hotel: placesWithCoordinates.filter(p => p.place_type === 'hotel').length,
        restaurant: placesWithCoordinates.filter(p => p.place_type === 'restaurant').length,
        attraction: placesWithCoordinates.filter(p => p.place_type === 'attraction').length
      };
      
      console.log('Place type counts:', typeCount);
      console.log('Total places loaded:', placesWithCoordinates.length);
      
      setPlaceTypeStats(typeCount);
      setLocalPlaces(placesWithCoordinates);
      setLocalFilteredPlaces(placesWithCoordinates);
      setError(null);
      
      // For parent components
      if (setPlaces) setPlaces(placesWithCoordinates);
      if (setFilteredPlaces) setFilteredPlaces(placesWithCoordinates);
      if (onDataFetched) onDataFetched(placesWithCoordinates);

    } catch (error) {
      console.error('Error fetching places:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to load places: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [authTokens, userPosition, getAuthHeaders, setPlaces, setFilteredPlaces, onDataFetched]);

  // Alternative fetch method that tries multiple approaches
  const fetchPlacesWithFallback = useCallback(async () => {
    if (!authTokens) {
      console.warn('No authentication tokens available');
      setError('Authentication required');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First try: high limit (like AdminPlaces)
      try {
        const response = await axios.get(
          `${API_BASE_URL}/places/?limit=10000`, 
          getAuthHeaders()
        );
        console.log('High limit fetch successful:', response.data);
        await processPlacesData(response.data);
        return;
      } catch (error) {
        console.log('High limit fetch failed, trying pagination:', error.message);
      }

      // Fallback: pagination approach
      let allPlaces = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages && currentPage <= 20) { // Limit to 20 pages max
        try {
          const response = await axios.get(
            `${API_BASE_URL}/places/?page=${currentPage}&page_size=100`, 
            getAuthHeaders()
          );
          
          const data = response.data;
          const places = Array.isArray(data) ? data : data.results || [];
          
          if (places.length === 0) {
            hasMorePages = false;
          } else {
            allPlaces = [...allPlaces, ...places];
            
            // Check if there are more pages
            if (data.next) {
              currentPage++;
            } else {
              hasMorePages = false;
            }
          }
        } catch (pageError) {
          console.error(`Error fetching page ${currentPage}:`, pageError);
          hasMorePages = false;
        }
      }

      console.log(`Pagination fetch completed: ${allPlaces.length} places across ${currentPage} pages`);
      await processPlacesData(allPlaces);

    } catch (error) {
      console.error('All fetch attempts failed:', error);
      setError(`Failed to load places: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [authTokens, getAuthHeaders]);

  // Helper function to process places data
  const processPlacesData = (data) => {
    const allPlaces = Array.isArray(data) ? data : (data.results || data);
    
    // Normalize the data
    const placesWithCoordinates = allPlaces.map((place) => ({
      ...place,
      latitude: place.latitude || (userPosition?.[0] ? userPosition[0] + (Math.random() * 0.01 - 0.005) : 0),
      longitude: place.longitude || (userPosition?.[1] ? userPosition[1] + (Math.random() * 0.01 - 0.005) : 0),
      place_type: place.place_type || place.category || 'hotel',
      price: parseFloat(place.price || 0),
      rating: parseFloat(place.rating || 0),
      name: place.name || 'Unnamed Place',
      city: place.city || 'Unknown City',
      image_url: place.image_url || DEFAULT_PLACE_IMAGE,
      description: place.description || ''
    }));

    // Calculate statistics
    const typeCount = {
      hotel: placesWithCoordinates.filter(p => p.place_type === 'hotel').length,
      restaurant: placesWithCoordinates.filter(p => p.place_type === 'restaurant').length,
      attraction: placesWithCoordinates.filter(p => p.place_type === 'attraction').length
    };
    
    console.log('Final place type counts:', typeCount);
    console.log('Total places processed:', placesWithCoordinates.length);
    
    setPlaceTypeStats(typeCount);
    setLocalPlaces(placesWithCoordinates);
    setLocalFilteredPlaces(placesWithCoordinates);
    setError(null);
    
    // For parent components
    if (setPlaces) setPlaces(placesWithCoordinates);
    if (setFilteredPlaces) setFilteredPlaces(placesWithCoordinates);
    if (onDataFetched) onDataFetched(placesWithCoordinates);
  };

  useEffect(() => {
    fetchPlacesWithFallback();
  }, [fetchPlacesWithFallback]);

  // Apply filtering logic (simplified to avoid hiding places unnecessarily)
  const filterPlaces = useCallback(() => {
    if (!localPlaces || localPlaces.length === 0) return;
    
    let results = [...localPlaces];
    
    // Special case for favorites
    if (selectedType === 'favorites') {
      results = results.filter((place) => favorites.includes(place.id));
    } 
    // Filter by place type if not "all"
    else if (selectedType !== 'all') {
      results = results.filter((place) => place.place_type === selectedType);
    }

    // Add price filter (only if user has set specific price range)
    if (priceRange[0] > PRICE_RANGE_MIN || priceRange[1] < PRICE_RANGE_MAX) {
      results = results.filter((place) => {
        const price = place.price || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }
    
    // Add rating filter (only if user has set minimum rating)
    if (minRating > 0) {
      results = results.filter((place) => (place.rating || 0) >= minRating);
    }

    // Apply search text filter
    if (activeSearch.trim()) {
      const search = activeSearch.toLowerCase();
      results = results.filter((place) =>
        [place.name, place.location, place.address, place.city, place.description]
          .filter(Boolean) // Filter out undefined/null values
          .some((field) => field.toLowerCase().includes(search))
      );
    }

    // Apply sorting
    if (sortBy === 'price-low') {
      results.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      results.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating') {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name') {
      results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    console.log(`Filtering: ${localPlaces.length} total -> ${results.length} filtered`);
    setLocalFilteredPlaces(results);
    
    // For Dashboard component
    if (setFilteredPlaces) setFilteredPlaces(results);
  }, [localPlaces, selectedType, favorites, priceRange, minRating, activeSearch, sortBy, setFilteredPlaces]);

  useEffect(() => {
    filterPlaces();
  }, [filterPlaces]);

  // Event handlers
  const handleSearch = () => {
    setActiveSearch(searchInput);
    
    // Save search to recent searches if not empty and not already in list
    if (searchInput.trim() && !recentSearches.includes(searchInput.trim())) {
      const updated = [searchInput.trim(), ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleActionClick = (place) => {
    const placeType = place.place_type || place.category;
    const routeMap = {
      hotel: `/bookings/hotel/${place.id}`,
      restaurant: `/reservations/restaurant/${place.id}`,
      attraction: `/tickets/attraction/${place.id}`,
    };

    navigate(routeMap[placeType], {
      state: {
        selectedPlace: place,
        selectedPrice: place.price,
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

  const resetFilters = () => {
    setPriceRange([PRICE_RANGE_MIN, PRICE_RANGE_MAX]);
    setMinRating(0);
    setSortBy('recommended');
    setActiveSearch('');
    setSearchInput('');
  };

  const handleRefreshData = () => {
    fetchPlacesWithFallback();
  };

  // JSX rendering
  return (
    <div className="p-6">
      {import.meta.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-100 rounded text-sm">
          <strong>Debug:</strong> Total: {localPlaces.length}, Filtered: {localFilteredPlaces.length}, 
          Hotels: {placeTypeStats.hotel}, Restaurants: {placeTypeStats.restaurant}, 
          Attractions: {placeTypeStats.attraction}
        </div>
      )}

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
            <option value="all">All Places ({localPlaces.length})</option>
            <option value="hotel">Hotels ({placeTypeStats.hotel})</option>
            <option value="restaurant">Restaurants ({placeTypeStats.restaurant})</option>
            <option value="attraction">Attractions ({placeTypeStats.attraction})</option>
            <option value="favorites">Favorites ({favorites.length})</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="min-w-[150px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition flex items-center"
          >
            <span>Filters</span>
            <span className="ml-1">{showFilters ? '▲' : '▼'}</span>
          </button>

          <button
            onClick={handleRefreshData}
            className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition flex items-center"
            title="Refresh all data"
          >
            <span>🔄</span>
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex items-center">
              <span className="mr-2">Kes{priceRange[0]}</span>
              <input
                type="range"
                min={PRICE_RANGE_MIN}
                max={PRICE_RANGE_MAX}
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="w-full"
              />
              <input
                type="range"
                min={PRICE_RANGE_MIN}
                max={PRICE_RANGE_MAX}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
              <span className="ml-2">Kes{priceRange[1]}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="ml-2">{minRating} ★</span>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg mr-2 transition"
            >
              Reset Filters
            </button>
            <button
              onClick={() => {
                setShowFilters(false);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {localFilteredPlaces.length} of {localPlaces.length} places
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={handleRefreshData} 
            className="mt-2 text-blue-600 underline hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading all places...</p>
        </div>
      ) : localFilteredPlaces.length === 0 ? (
        <div className="text-center mt-10 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">No places found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          {(selectedType !== 'all' || activeSearch || priceRange[0] > PRICE_RANGE_MIN || priceRange[1] < PRICE_RANGE_MAX || minRating > 0) && (
            <button 
              onClick={resetFilters}
              className="mt-3 text-blue-500 cursor-pointer hover:text-blue-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {localFilteredPlaces.map((place) => (
            <div
              key={place.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer ${
                hoveredPlaceId === place.id ? 'transform scale-[1.02]' : ''
              }`}
              onClick={() => handleActionClick(place)}
              onMouseEnter={() => handleMouseEnter(place.id)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="relative h-48">
                <img
                  src={getValidImageUrl(place.image_url)}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_PLACE_IMAGE;
                  }}
                />
                <button
                  onClick={(e) => toggleFavorite(place.id, e)}
                  className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow hover:bg-opacity-100 transition"
                  aria-label={favorites.includes(place.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  {favorites.includes(place.id) ? (
                    <span className="text-red-500">❤️</span>
                  ) : (
                    <span className="text-gray-400">🤍</span>
                  )}
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 text-white p-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold capitalize">{place.place_type}</span>
                    <span className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                      {place.rating > 0 ? `${place.rating.toFixed(1)} ★` : 'No rating'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{place.name}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  {place.address || place.city || "No address available"}
                </p>
                <div className="flex flex-col mt-4">
                  <span className="font-bold text-lg text-blue-600 mb-2">
                    Kes{place.price.toFixed(2)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleQuickView(place, e)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm transition"
                    >
                      Quick View
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
                    >
                      {place.place_type === 'hotel' ? 'Book' : 
                       place.place_type === 'restaurant' ? 'Reserve' : 'Get Tickets'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewPlace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setQuickViewPlace(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64">
              <img
                src={getValidImageUrl(quickViewPlace.image_url)}
                alt={quickViewPlace.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PLACE_IMAGE;
                }}
              />
              <button
                onClick={() => setQuickViewPlace(null)}
                className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow hover:bg-opacity-100 transition"
                aria-label="Close quick view"
              >
                <span className="text-gray-600">✕</span>
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{quickViewPlace.name}</h2>
                  <p className="text-gray-600">{quickViewPlace.address || quickViewPlace.city || "Location unknown"}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold">
                    {quickViewPlace.rating > 0 ? `${quickViewPlace.rating.toFixed(1)} ★` : 'No rating'}
                  </span>
                  <span className="font-bold text-blue-600 text-xl mt-2">
                    Kes{quickViewPlace.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">Type:</div>
                  <div className="font-semibold capitalize">{quickViewPlace.place_type}</div>
                  <div className="text-gray-600">City:</div>
                  <div className="font-semibold">{quickViewPlace.city || 'Not specified'}</div>
                  {quickViewPlace.latitude && quickViewPlace.longitude && (
                    <>
                      <div className="text-gray-600">Coordinates:</div>
                      <div className="font-semibold">
                        {quickViewPlace.latitude.toFixed(4)}, {quickViewPlace.longitude.toFixed(4)}
                      </div>
                    </>
                  )}
                </div>
                
                {quickViewPlace.description && (
                  <div className="mt-4">
                    <h4 className="text-gray-600 mb-1">Description:</h4>
                    <p>{quickViewPlace.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(quickViewPlace.id, { stopPropagation: () => {} });
                    setQuickViewPlace({
                      ...quickViewPlace,
                      isFavorite: !favorites.includes(quickViewPlace.id)
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  {favorites.includes(quickViewPlace.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
                <button
                  onClick={() => {
                    handleActionClick(quickViewPlace);
                    setQuickViewPlace(null);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                  {quickViewPlace.place_type === 'hotel' ? 'Book Now' : 
                   quickViewPlace.place_type === 'restaurant' ? 'Make Reservation' : 'Buy Tickets'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Place;