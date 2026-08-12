const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Avulsos.tsx', 'utf8');

code = code.replace(
  `interface Avulso {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  image: string;
  category?: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
}`,
  `interface Avulso {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  image: string;
  category?: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  sku?: string;
  packagingCost?: number;
  compareAtPrice?: number;
  gallery?: string[];
  rating?: number;
  reviews?: number;
  pixDiscount?: number;
  installments?: number;
  hidden?: boolean;
  stock?: number;
  description?: string;
}`
);

// We need to update the initial form state too.
// Let's find the current form state
const formStateRegex = /const \[formData, setFormData\] = useState<\{[\s\S]*?\}>\((\{[\s\S]*?\})\);/;
const match = code.match(formStateRegex);
if (match) {
  const newType = `Partial<Avulso> & { name: string; price: number; image: string; category: string }`;
  const newState = `{
    name: '',
    price: 0,
    costPrice: undefined,
    image: '',
    category: '',
    sizes: [],
    colors: [],
    sku: '',
    packagingCost: undefined,
    compareAtPrice: undefined,
    gallery: [],
    rating: undefined,
    reviews: undefined,
    pixDiscount: undefined,
    installments: undefined,
    hidden: false,
    stock: undefined,
    description: ''
  }`;
  
  code = code.replace(
    formStateRegex, 
    `const [formData, setFormData] = useState<${newType}>(${newState});`
  );
}

fs.writeFileSync('src/admin/views/Avulsos.tsx', code);
