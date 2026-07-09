const fs = require('fs');
let code = fs.readFileSync('src/storefront/ProductDetails.tsx', 'utf8');

const oldCarousel = `const ProductBannerCarousel = ({ banners }: { banners: string[] }) => {
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
              className={\`w-2 h-2 rounded-full transition-all \${
                idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
              }\`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};`;

const newCarousel = `const ProductBannerCarousel = ({ banners }: { banners: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || !banners.length) return null;

  return (
    <div className="w-full mt-8 mb-4 max-w-[1200px] mx-auto px-4">
      <div className="relative w-full h-[150px] md:h-[250px] rounded-2xl overflow-hidden group shadow-sm">
        {banners.map((item, idx) => {
          const img = typeof item === 'string' ? item : item.image;
          const link = typeof item === 'string' ? '' : (item.link || '');
          
          const ImageTag = (
            <img
              src={img}
              alt={\`Banner \${idx + 1}\`}
              className={\`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 \${
                idx === currentIndex ? 'opacity-100 z-10 cursor-pointer' : 'opacity-0 z-0'
              }\`}
            />
          );

          return (
            <React.Fragment key={idx}>
              {link && idx === currentIndex ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10">
                  {ImageTag}
                </a>
              ) : (
                ImageTag
              )}
            </React.Fragment>
          );
        })}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 pointer-events-none">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={\`w-2 h-2 rounded-full transition-all pointer-events-auto \${
                  idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                }\`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};`;

code = code.replace(oldCarousel, newCarousel);
fs.writeFileSync('src/storefront/ProductDetails.tsx', code);
