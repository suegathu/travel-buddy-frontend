import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

// Fix for default icon path issues in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom icons for places using their own images
const getIconForPlace = (place, isHovered = false) => {
  // Make the icon significantly larger when hovered
  const size = isHovered ? [50, 50] : [40, 40];
  const shadowSize = isHovered ? [60, 60] : [50, 50];
  
  // Use the place's image if available, otherwise use a default based on type
  let iconUrl;
  
  if (place.image) {
    iconUrl = place.image;
  } else {
    // Fallback icons if no image is provided
    switch (place.place_type) {
      case "restaurant":
        iconUrl = "https://cdn-icons-png.flaticon.com/512/4080/4080032.png";
        break;
      case "hotel":
        iconUrl = "https://cdn-icons-png.flaticon.com/512/3448/3448517.png";
        break;
      case "attraction":
        iconUrl = "https://cdn-icons-png.flaticon.com/512/2784/2784389.png";
        break;
      default:
        return new L.Icon.Default();
    }
  }

  try {
    return new L.Icon({
      iconUrl,
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]], // Center the icon horizontally and place at bottom vertically
      popupAnchor: [0, -size[1] / 2], // Position popup above the icon
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      shadowSize: shadowSize,
      shadowAnchor: [shadowSize[0] / 2, shadowSize[1]],
      className: `rounded-full border-2 ${isHovered ? 'border-blue-500 highlighted-marker' : 'border-white'}`, // Make icons circular with border
    });
  } catch (error) {
    console.error("Error creating custom icon:", error);
    return new L.Icon.Default(); // Fallback to default icon if there's an error
  }
};

const Map = ({ userPosition, places = [], suggestions = [], hoveredPlaceId }) => {
  const mapRef = useRef(null);
  const markersRef = useRef({});

  // Center map on user position when it changes
  useEffect(() => {
    if (mapRef.current && userPosition) {
      mapRef.current.setView(userPosition, 13);
    }
  }, [userPosition]);

  // Effect for handling marker highlighting and map panning when hovering
  useEffect(() => {
    if (hoveredPlaceId && mapRef.current) {
      // Find the hovered place coordinates
      const hoveredPlace = [...places, ...suggestions].find(p => p.id === hoveredPlaceId);
      
      if (hoveredPlace) {
        // Pan the map to center on the hovered marker
        mapRef.current.panTo([hoveredPlace.latitude, hoveredPlace.longitude], {
          animate: true,
          duration: 0.5
        });
        
        // If we have a reference to the marker, we could add additional effects here
        if (markersRef.current[hoveredPlaceId]) {
          // Additional marker effects could be applied here
          // For example: markersRef.current[hoveredPlaceId].openPopup();
        }
      }
    }
  }, [hoveredPlaceId, places, suggestions]);

  if (!userPosition) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Fetching your location...</p>
          <p className="text-xs mt-2">Please enable location services in your browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={userPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        whenCreated={(map) => {
          mapRef.current = map;
        }}
        zoomControl={false} // Custom position for zoom controls
      >
        {/* Add zoom controls in a better position */}
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location with distinctive marker */}
        <Marker 
          position={userPosition}
          icon={new L.Icon({
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
            shadowSize: [41, 41],
            className: "pulse-marker" // Add custom class for animation
          })}
        >
          <Popup>
            <div className="text-center py-1">
              <p className="font-medium">📍 Your Current Location</p>
            </div>
          </Popup>
        </Marker>

        {/* Places Markers with clustering */}
        <MarkerClusterGroup 
          spiderfyOnMaxZoom={true}
          chunkedLoading={true}
          zoomToBoundsOnClick={true}
          disableClusteringAtZoom={14} // Disable clustering at higher zoom levels for better visibility
          spiderfyDistanceMultiplier={2} // Spread out markers more when expanding a cluster
        >
          {/* Regular places */}
          {places.map((place) => {
            const isHovered = hoveredPlaceId === place.id;
            return (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={getIconForPlace(place, isHovered)}
                ref={(markerRef) => {
                  if (markerRef) {
                    markersRef.current[place.id] = markerRef;
                  }
                }}
                zIndexOffset={isHovered ? 1000 : 0} // Bring hovered marker to front
              >
                <Popup>
                  <div className="text-center p-1">
                    <h3 className="font-semibold">{place.name}</h3>
                    <p className="text-sm capitalize">{place.place_type}</p>
                    {place.rating && (
                      <p className="text-yellow-500">
                        {"⭐".repeat(Math.floor(place.rating))}
                        {place.rating % 1 >= 0.5 ? "⭐" : ""}
                        <span className="text-xs text-gray-600 ml-1">({place.rating})</span>
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Suggested places */}
          {suggestions.map((suggestion) => {
            const isHovered = hoveredPlaceId === suggestion.id;
            return (
              <Marker
                key={suggestion.id}
                position={[suggestion.latitude, suggestion.longitude]}
                icon={getIconForPlace(suggestion, isHovered)}
                ref={(markerRef) => {
                  if (markerRef) {
                    markersRef.current[suggestion.id] = markerRef;
                  }
                }}
                zIndexOffset={isHovered ? 1000 : 0} // Bring hovered marker to front
              >
                <Popup>
                  <div className="text-center p-1">
                    <h3 className="font-semibold">{suggestion.name}</h3>
                    <p className="text-sm capitalize">{suggestion.place_type}</p>
                    <p className="text-yellow-500">
                      {"⭐".repeat(Math.floor(suggestion.rating))}
                      {suggestion.rating % 1 >= 0.5 ? "⭐" : ""}
                      <span className="text-xs text-gray-600 ml-1">({suggestion.rating})</span>
                    </p>
                    <p className="text-xs italic text-blue-600 mt-1">Suggested Place</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {/* Legend is updated to indicate real place images are being used */}
        <div className="leaflet-bottom leaflet-left">
          <div className="leaflet-control leaflet-bar bg-white p-2 rounded-lg shadow-md m-2">
            <h4 className="font-medium text-sm mb-2">Map Legend</h4>
            <div className="flex items-center mb-1">
              <div className="w-4 h-4 mr-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs">Your Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 bg-gray-300 rounded-full overflow-hidden border border-gray-400"></div>
              <span className="text-xs">Place Images</span>
            </div>
          </div>
        </div>
      </MapContainer>

      {/* Add CSS for marker effects */}
      <style jsx>{`
        .pulse-marker {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .highlighted-marker {
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
          z-index: 1000 !important;
          transition: all 0.3s ease;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default Map;