import { useEffect, useState } from "react";
import { cachedGet, peekCached } from "../../../Utils/apiCache";

const Social = () => {
    const [social, setSocial] = useState(() => peekCached('/socialmedia') || []);

    useEffect(() => {
        cachedGet('/socialmedia')
            .then(data => setSocial(data))
            .catch(err => console.error("Error fetching social links:", err));
    }, []);

    if (!social.length) return null;

    return (
        <div className='flex flex-col md:w-12 w-10 gap-2 fixed p-1 border-red-100 border-r-[1px] mt-40 md:mt-80 rounded-r-3xl z-50'>
            {social.map((item) => (
                <a key={item._id} href={item.sociallink} target="_blank" rel="noopener noreferrer">
                    <img
                        src={item.sideimglink}
                        className="md:h-10 md:w-10 rounded-full transform transition-transform duration-500 hover:scale-125"
                        alt={`Social link for ${item.sociallink}`}
                    />
                </a>
            ))}
        </div>
    );
};

export default Social;