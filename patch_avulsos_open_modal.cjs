const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Avulsos.tsx', 'utf8');

code = code.replace(
  `  const handleOpenModal = (avulso?: Avulso) => {
    if (avulso) {
      setEditingAvulso(avulso);
      setFormData({
        name: avulso.name,
        price: avulso.price,
        costPrice: avulso.costPrice !== undefined ? avulso.costPrice : undefined,
        image: avulso.image || '',
        category: avulso.category || '',
        sizes: avulso.sizes || [],
        colors: avulso.colors || []
      });
    } else {
      setEditingAvulso(null);
      setFormData({ name: '', price: 0, costPrice: undefined, image: '', category: '', sizes: [], colors: [] });
    }
    setIsModalOpen(true);
  };`,
  `  const emptyAvulsoForm = {
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
  };

  const handleOpenModal = (avulso?: Avulso) => {
    if (avulso) {
      setEditingAvulso(avulso);
      setFormData({
        name: avulso.name || '',
        price: avulso.price || 0,
        costPrice: avulso.costPrice !== undefined ? avulso.costPrice : undefined,
        image: avulso.image || '',
        category: avulso.category || '',
        sizes: avulso.sizes || [],
        colors: avulso.colors || [],
        sku: avulso.sku || '',
        packagingCost: avulso.packagingCost !== undefined ? avulso.packagingCost : undefined,
        compareAtPrice: avulso.compareAtPrice !== undefined ? avulso.compareAtPrice : undefined,
        gallery: avulso.gallery || [],
        rating: avulso.rating !== undefined ? avulso.rating : undefined,
        reviews: avulso.reviews !== undefined ? avulso.reviews : undefined,
        pixDiscount: avulso.pixDiscount !== undefined ? avulso.pixDiscount : undefined,
        installments: avulso.installments !== undefined ? avulso.installments : undefined,
        hidden: avulso.hidden || false,
        stock: avulso.stock !== undefined ? avulso.stock : undefined,
        description: avulso.description || ''
      });
    } else {
      setEditingAvulso(null);
      setFormData(emptyAvulsoForm);
    }
    setIsModalOpen(true);
  };`
);

fs.writeFileSync('src/admin/views/Avulsos.tsx', code);
