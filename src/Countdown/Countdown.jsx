import { useState, useEffect } from 'react';

const CountDown = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
  
    const targetDate = new Date("2025-03-01T00:00:00");

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timerInterval); 
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

   
    const timerInterval = setInterval(updateCountdown, 1000);

  
    return () => clearInterval(timerInterval);
  }, []);

  return (
    <div className="hero min-h-screen" style={{ backgroundImage: "url('https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="hero-content flex-col lg:flex-row-reverse text-white">
        <div className="text-center lg:text-left flex flex-col justify-center items-center">
          <h1 className="text-5xl font-bold mb-4">Countdown to March 1st</h1>
          <p className="py-6">
         
          </p>
          <div className="flex flex-row w-[600px] justify-between items-center">
            <div className="flex flex-col p-1  bg-white text-black rounded-lg justify-center items-center">
              <span className="countdown font-mono text-[100px]">
                <span style={{ "--value": timeLeft.days }}></span>
              </span>
             <span>days</span> 
            </div>
            <div className="flex flex-col p-1  bg-white text-black rounded-lg justify-center items-center">
              <span className="countdown font-mono text-[100px]">
                <span style={{ "--value": timeLeft.hours }}></span>
              </span>
              <span>hours</span>
            </div>
            <div className="flex flex-col p-1  bg-white text-black rounded-lg justify-center items-center">
              <span className="countdown font-mono text-[100px]">
                <span style={{ "--value": timeLeft.minutes }}></span>
              </span>
              <span>min</span>
            </div>
            <div className="flex flex-col p-1 justify-center items-center bg-white text-black rounded-lg">
              <span className="countdown font-mono text-[100px]">
                <span style={{ "--value": timeLeft.seconds }}></span>
              </span>
              <span>sec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountDown;
