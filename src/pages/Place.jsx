import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Define a simple default image URL for fallbacks
const DEFAULT_PLACE_IMAGE = 'https://images.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg';

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
        const response = await axios.get('https://travel-buddy-7g6f.onrender.com/api/places/?refresh=true', getAuthHeaders());
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

  // Simple function to check if image URL is valid
  const getValidImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl === '' || !imageUrl.startsWith('http')) {
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
              onClick={() => {
                setPriceRange([0, 500]);
                setMinRating(0);
                setSortBy('recommended');
                filterPlaces();
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg mr-2 transition"
            >
              Reset Filters
            </button>
            <button
              onClick={() => {
                setShowFilters(false);
                filterPlaces();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Place Cards - Changed to display in 2 columns instead of 3 */}
      {localFilteredPlaces.length === 0 ? (
        <div className="text-center mt-10 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">No places found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
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
                />
                <button
                  onClick={(e) => toggleFavorite(place.id, e)}
                  className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow hover:bg-opacity-100 transition"
                >
                  {favorites.includes(place.id) ? (
                    <span className="text-red-500">❤️</span>
                  ) : (
                    <span className="text-gray-400">🤍</span>
                  )}
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 text-white p-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{place.place_type}</span>
                    <span className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                      {place.rating ? `${place.rating} ★` : 'No rating'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{place.name}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  {place.address || "No address available"}
                </p>
                <div className="flex flex-col mt-4">
                  <span className="font-bold text-lg text-blue-600 mb-2">
                    ${parseFloat(place.price).toFixed(2)}
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
                      {place.place_type === 'hotel' ? 'Book' : place.place_type === 'restaurant' ? 'Reserve' : 'Get Tickets'}
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
              />
              <button
                onClick={() => setQuickViewPlace(null)}
                className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow hover:bg-opacity-100 transition"
              >
                <span className="text-gray-600">✕</span>
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{quickViewPlace.name}</h2>
                  <p className="text-gray-600">{quickViewPlace.address}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold">
                    {quickViewPlace.rating ? `${quickViewPlace.rating} ★` : 'No rating'}
                  </span>
                  <span className="font-bold text-blue-600 text-xl mt-2">
                    ${parseFloat(quickViewPlace.price).toFixed(2)}
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
                  <div className="text-gray-600">Coordinates:</div>
                  <div className="font-semibold">
                    {quickViewPlace.latitude?.toFixed(4)}, {quickViewPlace.longitude?.toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
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
                  {quickViewPlace.place_type === 'hotel' ? 'Book Now' : quickViewPlace.place_type === 'restaurant' ? 'Make Reservation' : 'Buy Tickets'}
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