import React from "react";

const PlaceCard = ({ place, onBook }) => (
  <div className="border rounded shadow p-4 bg-white w-full max-w-sm">
    <img src={place.image_url} alt={place.name} className="w-full h-40 object-cover mb-2" />
    <h3 className="text-lg font-bold">{place.name}</h3>
    <p>{place.location}</p>
    <p className="text-sm">{place.description}</p>
    <p className="mt-1 text-blue-600 font-semibold">${place.price}</p>
    {place.cuisine && <p>Cuisine: {place.cuisine}</p>}
    <p>Rating: ⭐{place.rating}</p>
    <button
      onClick={() => onBook(place)}
      className="mt-3 bg-blue-500 text-white px-4 py-2 rounded"
    >
      {place.place_type === "hotel" ? "Book Hotel" : place.place_type === "restaurant" ? "Reserve Table" : "Get Ticket"}
    </button>
  </div>
);

export default PlaceCard;
