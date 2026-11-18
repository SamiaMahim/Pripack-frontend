const Featured = () => {
    const productData = [
        { id: 1, name: "Classic White T-shirt", description: "A timeless classic for any wardrobe.", price: "$19.99", imageUrl: "https://shop.adarbepari.com/wp-content/uploads/2021/04/bangladesh-flag71-map-tshirt.jpg" },
        { id: 2, name: "Graphic T-shirt", description: "Show off your style with this bold graphic.", price: "$25.99", imageUrl: "https://brownliving.in/cdn/shop/products/sustainable-t-shirt-recycled-plastic-recycled-cotton-blend-authentic-design-a13786-1-m-mens-tshirt-brown-living-540735.jpg?v=1682968317&width=800" },
        { id: 3, name: "Premium Black T-shirt", description: "Comfort and style in one premium design.", price: "$29.99", imageUrl: "https://brownliving.in/cdn/shop/products/sustainable-t-shirt-recycled-plastic-recycled-cotton-blend-authentic-design-a13786-1-m-mens-tshirt-brown-living-540735.jpg?v=1682968317&width=800" },
        { id: 4, name: "Premium Black T-shirt", description: "Comfort and style in one premium design.", price: "$29.99", imageUrl: "https://brownliving.in/cdn/shop/products/sustainable-t-shirt-recycled-plastic-recycled-cotton-blend-authentic-design-a13786-1-m-mens-tshirt-brown-living-540735.jpg?v=1682968317&width=800" },

    ];

    return (
        <div>
            <div className="font-bold text-xl mb-2">Related Products</div>
            <div className="flex flex-row lg:flex-col overflow-x-scroll w-screen lg:overflow-y-scroll lg:max-h-[700px]">
                {productData.map((product) => (
                    <div key={product.id} className="w-[300px]  m-2">
                        <img
                            className="w-20 h-20 object-cover rounded-md"
                            src={product.imageUrl}
                            alt={product.name}
                        />
                        <div className="flex flex-row justify-between mt-2">
                            <p className="font-bold text-sm">{product.name}</p>
                            <p className="text-sm font-semibold">{product.price}</p>
                        </div>
                        <p className="text-sm mt-1">{product.description}</p>
                        <p className="mt-4 text-sm text-center text-green-800 cursor-pointer">View product</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Featured;
