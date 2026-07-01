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
    name: 'Caneca Personalizada do seu Jeito Alça e Interior Branco',
    category: 'Canecas',
    description: 'Personalize com a sua foto favorita.',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Caneca Personalizada do seu Jeito (100% Preta)',
    category: 'Canecas',
    description: 'Caneca toda preta personalizada com sua estampa.',
    price: 44.90,
    image: 'https://images.unsplash.com/photo-1506456001222-19e07fb884b2?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Caneca com Foto e Música Spotify 100% Preta (Mod.1)',
    category: 'Música',
    description: 'Adicione sua música e foto preferidas.',
    price: 44.90,
    image: 'https://images.unsplash.com/photo-1628148967954-4734ea073df2?q=80&w=2127&auto=format&fit=crop',
  },
  {
    id: '4',
    name: 'Caneca Personalizada Com 2 Fotos (Mod.1)',
    category: 'Canecas',
    description: 'Espaço para duas fotos.',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1577085799982-f5c71b69f64c?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: '5',
    name: 'Caneca Chocólatra Assumida',
    category: 'Divertidas',
    description: 'Para as chocólatras de plantão.',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: '6',
    name: 'Caneca Seleção Canarinho (Mod.3)',
    category: 'Copa',
    description: 'Torça para o Brasil com estilo.',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1629835706422-55db5a1e2f75?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: '7',
    name: 'Caneca Não Tenho 1 Minuto de Paz',
    category: 'Divertidas',
    description: 'Para quem vive na correria.',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1577085799982-f5c71b69f64c?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: '8',
    name: 'Caneca Muito Cedo para Cerveja',
    category: 'Divertidas',
    description: 'Café ou cerveja?',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2070&auto=format&fit=crop',
  }
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};
