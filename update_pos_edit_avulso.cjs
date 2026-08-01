const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

// Add state
content = content.replace(
  "const [showCustomModal, setShowCustomModal] = useState(false);",
  "const [showCustomModal, setShowCustomModal] = useState(false);\n  const [showEditAvulsoModal, setShowEditAvulsoModal] = useState<any>(null);"
);

// Add update function
content = content.replace(
  /const handleAddCustomItem = async \(\) => \{/,
  `const handleUpdateAvulso = async () => {
    if (!showEditAvulsoModal || !showEditAvulsoModal.name) return;
    try {
      await updateDoc(doc(db, 'avulso_products', showEditAvulsoModal.id), {
        name: showEditAvulsoModal.name,
        price: showEditAvulsoModal.price,
        image: showEditAvulsoModal.image || ''
      });
      toast.success('Produto avulso atualizado com sucesso!');
      setShowEditAvulsoModal(null);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar produto avulso');
    }
  };

  const handleAddCustomItem = async () => {`
);

// Add Edit icon to avulso card
content = content.replace(
  /<span className="absolute top-2 left-2 bg-purple-600 text-white text-\[9px\] font-bold px-1\.5 py-0\.5 rounded uppercase shadow-sm">Avulso<\/span>\s*\)\}/g,
  `<span className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">Avulso</span>
                  )}
                  {product.isAvulso && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowEditAvulsoModal(product); }}
                      className="absolute top-2 right-2 bg-white/90 text-gray-700 p-1.5 rounded shadow-sm hover:bg-white hover:text-purple-600 transition-colors"
                      title="Editar Avulso"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}`
);

// Add Modal in JSX
const editModalStr = `{/* Edit Avulso Modal */}
      {showEditAvulsoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Editar Produto Avulso</h2>
              <button onClick={() => setShowEditAvulsoModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Nome do Produto *</label>
                <input
                  type="text"
                  value={showEditAvulsoModal.name}
                  onChange={e => setShowEditAvulsoModal({...showEditAvulsoModal, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Preço (R$) *</label>
                <input
                  type="text"
                  value={showEditAvulsoModal.price ? showEditAvulsoModal.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\\D/g, '');
                    setShowEditAvulsoModal({...showEditAvulsoModal, price: val ? parseInt(val, 10) / 100 : 0});
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">URL da Imagem (Opcional)</label>
                <input
                  type="text"
                  value={showEditAvulsoModal.image || ''}
                  onChange={e => setShowEditAvulsoModal({...showEditAvulsoModal, image: convertGoogleDriveUrl(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <button
                onClick={handleUpdateAvulso}
                className="w-full mt-4 bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 transition-colors shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(
  /\{\/\* Receipt Preview Modal \*\/\}/,
  editModalStr + '\n\n      {/* Receipt Preview Modal */}'
);

content = content.replace(
  "import { Search, Plus, Trash2, ShoppingCart, Save, User, FileText, XCircle, Printer, X, Image as ImageIcon, Truck, Store } from 'lucide-react';",
  "import { Search, Plus, Trash2, ShoppingCart, Save, User, FileText, XCircle, Printer, X, Image as ImageIcon, Truck, Store, Edit2 } from 'lucide-react';"
);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
