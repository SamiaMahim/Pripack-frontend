import Rating from '../../pages/Rating/Rating';
import { useEffect, useState } from "react";
import { base_url } from '../../config/config';
const Reviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    const res = await fetch(
      `${base_url}/reviews/${productId}`
    );
    const data = await res.json();
    setReviews(data);
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        ).toFixed(1)
      : 0;

  const starCounts = [1, 2, 3, 4, 5].reduce((acc, star) => {
    acc[star] = reviews.filter((r) => r.rating === star).length;
    return acc;
  }, {});

  return (
    <div className="w-full ">
      <h2 className="text-xl font-bold text-teal-500  mb-2">
        Customer Reviews
      </h2>

      <div className="bg-white rounded-lg p-4 mb-4 border">
        <div className="flex gap-6 items-center">

          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {averageRating}
            </div>
            <Rating rating={Math.round(averageRating)} size="lg" />
            <p className="text-xs text-gray-500 mt-1">
              {totalReviews} reviews
            </p>
          </div>

          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-10">{star} ★</span>

                <div className="flex-1 bg-gray-200 rounded h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded"
                    style={{
                      width: `${
                        totalReviews
                          ? (starCounts[star] / totalReviews) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <span className="w-6 text-right">
                  {starCounts[star]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

     


      {reviews.map((review) => (
        <div
          key={review._id}
          className="bg-white p-4 rounded-lg mb-3 border hover:shadow-sm transition"
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full text-sm font-semibold">
              {review.customerName?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-900">
                  {review.customerName}
                </h2>
                <p className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>

              <Rating rating={review.rating} />

              <p className="text-sm text-gray-700 mt-2">
                {review.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reviews;
