/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import star from "assets/star.svg";

const Allrating = () => {
  const reviews = [ {
      name: "John Doe",
      date: "23rd Jan, 2024",
      rating: 4,
      feedback:
        "This is the review added by me. This is a very important thing for any website!das asd ewq qwe asd zxc rwe asf dsfa asd aewer sdf zfs",
      like: "123",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=3",
    },
    {
      name: "Jane Smith",
      date: "20th Jan, 2024",
      rating: 5,
      feedback: "Absolutely loved this website! Everything is so easy to use.",
      like: "256",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=4",
    },
    {
      name: "Mark Johnson",
      date: "18th Jan, 2024",
      rating: 3,
      feedback: "Good experience, but could be improved in certain areas.",
      like: "89",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "Mark Johnson",
      date: "18th Jan, 2024",
      rating: 3,
      feedback: "Good experience, but could be improved in certain areas.",
      like: "89",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "Mark Johnson",
      date: "18th Jan, 2024",
      rating: 3,
      feedback: "Good experience, but could be improved in certain areas.",
      like: "89",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "Mark Johnson",
      date: "18th Jan, 2024",
      rating: 3,
      feedback: "Good experience, but could be improved in certain areas.",
      like: "89",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "Mark Johnson",
      date: "18th Jan, 2024",
      rating: 3,
      feedback: "Good experience, but could be improved in certain areas.",
      like: "89",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "Mark Johnson",
      date: "18th Jan, 2024",
      rating: 3,
      feedback: "Good experience, but could be improved in certain areas.",
      like: "89",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "Mark Johnson",
      date: "18th Jan, 2024",
      rating: 3,
      feedback: "Good experience, but could be improved in certain areas.",
      like: "89",
      status: "show",
      cn: "c123321",
      profilePic: "https://i.pravatar.cc/150?img=5",
    },
   ]; 

  const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    const distribution = [0, 0, 0, 0, 0];
    
    // Count the number of each rating
    reviews.forEach((review) => {
      distribution[review.rating - 1] += 1; 
    });

    setRatingDistribution(distribution);
  }, [reviews]);

  const totalReviews = reviews.length;

  return (
    <div className="w-full  flex flex-row  px-2 ">
    <div className="flex flex-col lg:h-32 lg:w-32 h-16 w-16 items-center lg:text-lg text-sm">
      <p className=" font-semibold">Rating</p>
      <img src={star} className="h-16 w-16" alt="star" />
      <p>total: {totalReviews}</p>
    </div>

    <div className="rating rating-sm flex  flex-col h-32 items-center px-3">
      {ratingDistribution.map((count, index) => {
        const ratingValue = index + 1;
        const progressValue = (count / totalReviews) * 100; 
        return (
          <div
            key={ratingValue}
            className="flex flex-row justify-center items-center gap-1"
          >
            <img src={star} className="h-4 w-4" alt={`${ratingValue} star`} />
            <progress
              className="progress w-[200px] lg:w-[600px]"
              value={progressValue}
              max="100"
            ></progress>
            <p>({count})</p>
          </div>
        );
      })}
    </div>
  </div>
  );
};

export default Allrating;