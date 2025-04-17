import React, { useEffect, useState } from "react";
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

  // Get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);
        generateNearbySuggestions(latitude, longitude);
      },
      (err) => console.error("Error getting location:", err),
      { enableHighAccuracy: true }
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

  // Handle hovering on suggestion items
  const handleSuggestionHover = (id) => {
    setHoveredPlaceId(id);
  };

  // Toggle between map and list view on mobile
  const toggleView = () => {
    setShowMap(!showMap);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Mobile View Toggle Button */}
      {isMobileView && (
        <div className="sticky top-0 z-10 bg-white shadow-md p-2">
          <button
            onClick={toggleView}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium"
          >
            {showMap ? "Show List" : "Show Map"}
          </button>
        </div>
      )}

      {/* Left Panel - Places List */}
      <div 
        className={`${
          isMobileView && showMap ? 'hidden' : 'block'
        } w-full md:w-1/2 h-full md:h-screen overflow-y-auto`}
      >
        <div className="p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Discover Places</h1>
          <p className="mb-4 md:mb-6 text-sm md:text-base">Find hotels, restaurants, and attractions near you</p>

          {/* Places Component - Pass a gridCols prop to control the grid layout */}
          <Place 
            setPlaces={setPlaces}
            setFilteredPlaces={setFilteredPlaces} 
            hoveredPlaceId={hoveredPlaceId}
            setHoveredPlaceId={setHoveredPlaceId}
            userPosition={userPosition}
            gridCols={2} // Add this prop to control grid columns
          />

          {/* Nearby Suggestions (only show if we're not filtering) */}
          {filteredPlaces.length === places.length && nearbySuggestions.length > 0 && (
            <div className="mt-6 md:mt-8">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Suggested Nearby Places</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {nearbySuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`bg-gray-50 rounded-xl p-3 border border-gray-200 ${
                      hoveredPlaceId === suggestion.id ? 'ring-2 ring-blue-400' : 'hover:bg-gray-100'
                    }`}
                    onMouseEnter={() => handleSuggestionHover(suggestion.id)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
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
                        <p className="text-xs md:text-sm text-gray-500">
                          ⭐ {suggestion.rating} · {suggestion.place_type.charAt(0).toUpperCase() + suggestion.place_type.slice(1)}
                        </p>
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
        } w-full md:w-1/2 h-screen`}
      >
        <Map
          userPosition={userPosition}
          places={filteredPlaces}
          suggestions={nearbySuggestions}
          hoveredPlaceId={hoveredPlaceId}
        />
      </div>
    </div>
  );
};

export default Dashboard;