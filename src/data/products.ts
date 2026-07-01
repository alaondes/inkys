export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  gallery?: string[];
  colors?: { name: string; hex: string }[];
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Caneca de Vidro Jatiado',
    category: 'Canecas',
    description: 'Caneca de vidro com acabamento jateado premium. Perfeita para personalização.',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2070&auto=format&fit=crop',
    colors: [
      { name: 'Transparente Jateado', hex: '#e2e8f0' }
    ]
  },
  {
    id: '2',
    name: 'Caneca em Porcelana Branca',
    category: 'Canecas',
    description: 'Caneca clássica de porcelana branca, ideal para o dia a dia e para sublimação.',
    price: 33.90,
    image: 'https://images.unsplash.com/photo-1577085799982-f5c71b69f64c?q=80&w=2070&auto=format&fit=crop',
    colors: [
      { name: 'Branco', hex: '#ffffff' }
    ]
  },
  {
    id: '3',
    name: 'Caneca Fosca Premium',
    category: 'Canecas',
    description: 'Design elegante com acabamento fosco. Um toque moderno para seu café.',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1506456001222-19e07fb884b2?q=80&w=2000&auto=format&fit=crop',
    colors: [
      { name: 'Preto', hex: '#1a1a1a' },
      { name: 'Rosa Neon', hex: '#ff007f' },
      { name: 'Ciano', hex: '#00f0ff' }
    ]
  },
  {
    id: '4',
    name: 'Copo Térmico Inkys',
    category: 'Copos Térmicos',
    description: 'Copo térmico com parede dupla, mantém sua bebida quente ou fria por horas.',
    price: 89.90,
    image: 'https://images.unsplash.com/photo-1628148967954-4734ea073df2?q=80&w=2127&auto=format&fit=crop',
    colors: [
      { name: 'Preto Metálico', hex: '#2d3748' },
      { name: 'Prata Metálico', hex: '#cbd5e1' }
    ]
  },
  {
    id: '5',
    name: 'Caneca Mágica',
    category: 'Canecas',
    description: 'Caneca termossensível, revela a arte quando em contato com líquidos quentes.',
    price: 49.90,
    image: 'https://images.unsplash.com/photo-1610444391216-5e5d3fc35122?q=80&w=1964&auto=format&fit=crop',
    colors: [
      { name: 'Mágica Preta', hex: '#000000' }
    ]
  },
  {
    id: '6',
    name: 'Kit 2 Copos Neon',
    category: 'Kits',
    description: 'Dois copos de acrílico com cores neon vibrantes. Ideal para festas.',
    price: 59.90,
    image: 'https://images.unsplash.com/photo-1629835706422-55db5a1e2f75?q=80&w=1974&auto=format&fit=crop',
    colors: [
      { name: 'Rosa/Ciano', hex: 'linear-gradient(to right, #ff007f, #00f0ff)' },
      { name: 'Amarelo/Verde', hex: 'linear-gradient(to right, #ffff00, #00ff00)' }
    ]
  }
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};
