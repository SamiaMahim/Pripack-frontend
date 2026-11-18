import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import 'animate.css';
const Banner = () => {
    return (
        <div className="h-fit">
               <Carousel className='flex flex-col justify-center items-center align-middle'  showStatus={false} showThumbs={true} autoPlay={true} infiniteLoop={true} interval={5000} showArrows={false}>
        <section className='bg-red-300  lg:h-[400px] h-[200px] flex flex-col lg:flex-row items-center justify-center  '>
        </section>
        <section className='bg-green-400 h-[200px] lg:h-[400px] flex flex-col lg:flex-row items-center justify-center '>
        </section>
        </Carousel>
        </div>
  );
};
export default Banner;
