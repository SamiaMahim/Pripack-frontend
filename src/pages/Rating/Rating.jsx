/* eslint-disable react/prop-types */
import { useState } from 'react';

const Rating = ({ rating , onChange, totalRatings  }) => {
  const [selectedRating, setSelectedRating] = useState(rating);

  const handleRatingChange = (newRating) => {
    setSelectedRating(newRating);
    if (onChange) {
      onChange(newRating);
    }
  };

  return (
    <div className="rating rating-xs flex  items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <input
          key={star}
          type="radio"
          name="rating-5"
          className={`mask mask-star-2 bg-orange-300 ${selectedRating >= star ? 'checked' : ''}`}
          checked={selectedRating === star}
          onChange={() => handleRatingChange(star)}
        />
      ))}
      <p className="ml-2">{totalRatings}</p>
    </div>
  );
};

export default Rating;
