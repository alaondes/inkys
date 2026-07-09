const fs = require('fs');
let code = fs.readFileSync('src/storefront/ProductDetails.tsx', 'utf8');

const bannerComponent = `
const ProductBannerCarousel = () => {
  const banners = [
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop'
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <div className="w-full mt-8 mb-4 max-w-[1200px] mx-auto px-4">
      <div className="relative w-full h-[150px] md:h-[250px] rounded-2xl overflow-hidden group shadow-sm">
        {banners.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={\`Banner \${idx + 1}\`}
            className={\`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 \${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }\`}
          />
        ))}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={\`w-2.5 h-2.5 rounded-full transition-all \${
                idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
              }\`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
`;

// Insert the component before export function ProductDetails
code = code.replace('export function ProductDetails', bannerComponent + '\nexport function ProductDetails');

// Insert it in the render between shipping options and description
code = code.replace(
`      </div>
      
      {/* Description */}`,
`      </div>
      
      {/* Banner Carousel */}
      <ProductBannerCarousel />
      
      {/* Description */}`
);

fs.writeFileSync('src/storefront/ProductDetails.tsx', code);
