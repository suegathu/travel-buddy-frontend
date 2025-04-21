import React, { useEffect, useState, useCallback } from "react";
import Map from "../components/Map";
import Place from "../pages/Place";

const Dashboard = () => {
  const [userPosition, setUserPosition] = useState(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [nearbySuggestions, setNearbySuggestions] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user's location
  useEffect(() => {
    setIsLoading(true);
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);
        generateNearbySuggestions(latitude, longitude);
        setIsLoading(false);
        setLocationError(null);
      },
      (err) => {
        console.error("Error getting location:", err);
        setLocationError(
          err.code === 1 
            ? "Location access denied. Please enable location services."
            : "Unable to retrieve your location. Please try again later."
        );
        setIsLoading(false);
        
        // Fallback to a default location (New York City)
        setUserPosition([40.7128, -74.0060]);
        generateNearbySuggestions(40.7128, -74.0060);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Set initial view based on screen size
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      setShowMap(window.innerWidth >= 768);
    };

    // Initial check
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);
    
    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Generate mock nearby suggestions
  const generateNearbySuggestions = (lat, lng) => {
    // Create some random points near the user's location
    const suggestions = [
      {
        id: 'suggestion-1',
        name: 'Popular Restaurant',
        place_type: 'restaurant',
        latitude: lat + 0.005,
        longitude: lng - 0.003,
        rating: 4.7,
      },
      {
        id: 'suggestion-2',
        name: 'Luxury Hotel',
        place_type: 'hotel',
        latitude: lat - 0.002,
        longitude: lng + 0.004,
        rating: 4.9,
      },
      {
        id: 'suggestion-3',
        name: 'Historic Attraction',
        place_type: 'attraction',
        latitude: lat + 0.001,
        longitude: lng + 0.002,
        rating: 4.5,
      }
    ];
    setNearbySuggestions(suggestions);
  };

  // Handle hovering on place and suggestion items
  const handlePlaceHover = useCallback((id) => {
    setHoveredPlaceId(id);
    
    // In mobile view, automatically switch to map when hovering on a place card
    if (isMobileView && !showMap) {
      setShowMap(true);
    }
  }, [isMobileView, showMap]);
  
  // Handle when hover ends
  const handlePlaceHoverEnd = useCallback(() => {
    setHoveredPlaceId(null);
  }, []);

  // Toggle between map and list view on mobile
  const toggleView = () => {
    setShowMap(!showMap);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Mobile View Toggle Button */}
      {isMobileView && (
        <div className="sticky top-0 z-10 bg-white shadow-md p-3">
          <button
            onClick={toggleView}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200 flex items-center justify-center"
          >
            {showMap ? (
              <>
                <span className="mr-2">📋</span> Show List
              </>
            ) : (
              <>
                <span className="mr-2">🗺️</span> Show Map
              </>
            )}
          </button>
          
          {/* Show a tip about hovering over places when in list view on mobile */}
          {!showMap && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Tip: Tap and hold on a place to see it on the map
            </p>
          )}
        </div>
      )}

      {/* Location Error Alert */}
      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 absolute top-0 left-0 right-0 z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {locationError}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button 
                className="text-yellow-700"
                onClick={() => setLocationError(null)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Panel - Places List */}
      <div 
        className={`${
          isMobileView && showMap ? 'hidden' : 'block'
        } w-full md:w-1/2 h-full md:h-screen overflow-y-auto bg-white shadow-lg`}
      >
        <div className="p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-gray-800">Discover Places</h1>
          <p className="mb-4 md:mb-6 text-sm md:text-base text-gray-600">
            Find hotels, restaurants, and attractions near you
            <span className="hidden md:inline"> - Hover over a place to highlight it on the map</span>
          </p>

          {/* Loading indicator when fetching places */}
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Places Component with hover handlers */}
          {!isLoading && (
            <Place 
              setPlaces={setPlaces}
              setFilteredPlaces={setFilteredPlaces} 
              hoveredPlaceId={hoveredPlaceId}
              setHoveredPlaceId={handlePlaceHover}
              clearHoveredPlaceId={handlePlaceHoverEnd}
              userPosition={userPosition}
              gridCols={isMobileView ? 1 : 2} // Adjust grid columns based on device
            />
          )}

          {/* Nearby Suggestions with enhanced hover effect */}
          {!isLoading && filteredPlaces.length === places.length && nearbySuggestions.length > 0 && (
            <div className="mt-6 md:mt-8 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-700">Suggested Nearby Places</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {nearbySuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`bg-white rounded-xl p-3 border transition-all duration-200 cursor-pointer ${
                      hoveredPlaceId === suggestion.id ? 'ring-2 ring-blue-400 shadow-md transform scale-105' : 'border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onMouseEnter={() => handlePlaceHover(suggestion.id)}
                    onMouseLeave={handlePlaceHoverEnd}
                    // Add touch support for mobile
                    onTouchStart={() => handlePlaceHover(suggestion.id)}
                    onTouchEnd={handlePlaceHoverEnd}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mr-3 ${
                        suggestion.place_type === 'hotel' ? 'bg-blue-100' : 
                        suggestion.place_type === 'restaurant' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {suggestion.place_type === 'hotel' ? '🏨' : 
                         suggestion.place_type === 'restaurant' ? '🍽️' : '🏛️'}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm md:text-base">{suggestion.name}</h4>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">⭐</span>
                          <span className="text-xs md:text-sm text-gray-700">{suggestion.rating}</span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span className="text-xs md:text-sm text-gray-500 capitalize">{suggestion.place_type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map */}
      <div 
        className={`${
          isMobileView && !showMap ? 'hidden' : 'block'
        } w-full md:w-1/2 h-screen relative`}
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <Map
            userPosition={userPosition}
            places={filteredPlaces}
            suggestions={nearbySuggestions}
            hoveredPlaceId={hoveredPlaceId}
          />
        )}
        
        {/* Show a toast when hovering over a place in mobile view */}
        {isMobileView && showMap && hoveredPlaceId && (
          <div className="absolute bottom-16 left-0 right-0 mx-auto w-4/5 bg-white rounded-lg shadow-lg p-3 z-50 text-center">
            <p className="text-sm font-medium">
              {(() => {
                const place = [...filteredPlaces, ...nearbySuggestions].find(p => p.id === hoveredPlaceId);
                return place ? place.name : 'Place highlighted on map';
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;