import React from "react";

const PlaceCard = ({ place, onBook, onFavorite, isFavorite }) => {
  // Default image fallback
  const DEFAULT_PLACE_IMAGE = 'https://images.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg';
  
  const getValidImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl === '' || !imageUrl.startsWith('http')) {
      return DEFAULT_PLACE_IMAGE;
    }
    return imageUrl;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return null;
    }
  };

  return (
    <div className="border rounded-lg shadow-md p-4 bg-white w-full max-w-sm hover:shadow-lg transition-shadow">
      {/* Image with fallback */}
      <div className="relative">
        <img 
          src={getValidImageUrl(place.image_url)} 
          alt={place.name} 
          className="w-full h-40 object-cover mb-3 rounded"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_PLACE_IMAGE;
          }}
        />
        
        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(place.id);
            }}
            className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow hover:bg-opacity-100 transition"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? (
              <span className="text-red-500">❤️</span>
            ) : (
              <span className="text-gray-400">🤍</span>
            )}
          </button>
        )}
        
        {/* Place type badge */}
        <div className="absolute bottom-2 left-2">
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold capitalize">
            {place.place_type || place.category || 'Place'}
          </span>
        </div>
        
        {/* Local badge */}
        {!place.osm_id && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Local
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Title and Rating */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-800 leading-tight">{place.name}</h3>
          {place.rating && (
            <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
              <span className="text-yellow-600 font-semibold text-sm">
                ⭐ {parseFloat(place.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Location/Address */}
        <div className="text-gray-600 text-sm">
          {place.address && (
            <p className="mb-1">📍 {place.address}</p>
          )}
          {place.city && (
            <p className="mb-1">🏙️ {place.city}</p>
          )}
          {place.location && place.location !== place.address && place.location !== place.city && (
            <p className="mb-1">📍 {place.location}</p>
          )}
        </div>

        {/* Description */}
        {place.description && (
          <p className="text-sm text-gray-700 line-clamp-2">
            {place.description}
          </p>
        )}

        {/* Additional details */}
        <div className="text-sm text-gray-600 space-y-1">
          {place.cuisine && (
            <p>🍽️ Cuisine: {place.cuisine}</p>
          )}
          
          {/* Coordinates (if available) */}
          {place.latitude && place.longitude && (
            <p className="text-xs">
              📐 {parseFloat(place.latitude).toFixed(4)}, {parseFloat(place.longitude).toFixed(4)}
            </p>
          )}
          
          {/* Last updated */}
          {place.last_updated && (
            <p className="text-xs text-gray-500">
              🕒 Updated: {formatDate(place.last_updated)}
            </p>
          )}
          
          {/* Created date */}
          {place.created_at && (
            <p className="text-xs text-gray-500">
              📅 Added: {formatDate(place.created_at)}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="mt-3">
          <p className="text-xl font-bold text-blue-600">
            Kes{parseFloat(place.price || 0).toFixed(2)}
            {place.place_type === 'hotel' && <span className="text-sm text-gray-500">/night</span>}
            {place.place_type === 'restaurant' && <span className="text-sm text-gray-500">/person</span>}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onBook(place)}
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {place.place_type === "hotel" ? "Book Hotel" : 
           place.place_type === "restaurant" ? "Reserve Table" : 
           place.place_type === "attraction" ? "Get Tickets" : "Book Now"}
        </button>
      </div>
    </div>
  );
};

export default PlaceCard;