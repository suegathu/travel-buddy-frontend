import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

// Default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom icons for different place types
const getIconForPlace = (type, isHovered = false) => {
  const size = isHovered ? [40, 40] : [25, 25];
  let iconUrl;

  switch (type) {
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
      iconUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
  }

  return new L.Icon({
    iconUrl,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1] / 2],
  });
};

const Map = ({ userPosition, places = [], suggestions = [], hoveredPlaceId }) => {
  if (!userPosition) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p>Fetching your location...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={userPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location */}
        <Marker position={userPosition}>
          <Popup>You are here</Popup>
        </Marker>
        
        {/* Places Markers */}
        <MarkerClusterGroup>
  {places.map((place) => (
    <Marker
      key={place.id}
      position={[place.latitude, place.longitude]}
      icon={getIconForPlace(place.place_type, hoveredPlaceId === place.id)}
    >
      <Popup>
        <div className="text-center">
          <h3 className="font-semibold">{place.name}</h3>
          <p className="text-sm capitalize">{place.place_type}</p>
          {place.rating && <p className="text-yellow-500">⭐ {place.rating}</p>}
        </div>
      </Popup>
    </Marker>
  ))}

  {suggestions.map((suggestion) => (
    <Marker
      key={suggestion.id}
      position={[suggestion.latitude, suggestion.longitude]}
      icon={getIconForPlace(suggestion.place_type, hoveredPlaceId === suggestion.id)}
    >
      <Popup>
        <div className="text-center">
          <h3 className="font-semibold">{suggestion.name}</h3>
          <p className="text-sm capitalize">{suggestion.place_type}</p>
          <p className="text-yellow-500">⭐ {suggestion.rating}</p>
          <p className="text-xs font-italic">Suggested Place</p>
        </div>
      </Popup>
    </Marker>
  ))}
</MarkerClusterGroup>

      </MapContainer>
    </div>
  );
};

export default Map;