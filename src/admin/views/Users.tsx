import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { Shield, Plus, Trash2, Edit2, Check, X, Mail, User, Info, AlertTriangle, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import firebaseConfig from '../../../firebase-applet-config.json';

export interface UserPermissions {
  overview: boolean;
  products: boolean;
  customProducts: boolean;
  orders: boolean;
  pos: boolean;
  avulsos: boolean;
  customers: boolean;
  coupons: boolean;
  financial: boolean;
  hr: boolean;
  accounting: boolean;
  documents: boolean;
  settings: boolean;
  users: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendedor';
  permissions: UserPermissions;
  createdAt?: any;
}

const defaultPermissions: UserPermissions = {
  overview: false,
  products: false,
  customProducts: false,
  orders: true, // Orders and POS/Quote default true for sellers
  pos: true,
  avulsos: false,
  customers: false,
  coupons: false,
  financial: false,
  hr: false,
  accounting: false,
  documents: false,
  settings: false,
  users: false
};

const adminPermissions: UserPermissions = {
  overview: true,
  products: true,
  customProducts: true,
  orders: true,
  pos: true,
  avulsos: true,
  customers: true,
  coupons: true,
  financial: true,
  hr: true,
  accounting: true,
  documents: true,
  settings: true,
  users: true
};

export function UsersView() {
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'vendedor'>('vendedor');
  const [permissions, setPermissions] = useState<UserPermissions>({ ...defaultPermissions });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'admin_users'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminUser[];
      setUsersList(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to users:", error);
      toast.error("Erro ao carregar lista de usuários.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('vendedor');
    setPermissions({ ...defaultPermissions });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPermissions(user.permissions || { ...defaultPermissions });
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: 'admin' | 'vendedor') => {
    setRole(newRole);
    if (newRole === 'admin') {
      setPermissions({ ...adminPermissions });
    } else {
      setPermissions({ ...defaultPermissions });
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
    if (role === 'admin') return; // Admin always has all permissions
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;
    const toastId = toast.loading("Enviando e-mail de redefinição...");
    try {
      await sendPasswordResetEmail(auth, editingUser.email);
      toast.dismiss(toastId);
      toast.success(`E-mail de redefinição enviado com sucesso para ${editingUser.email}!`);
    } catch (err: any) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Erro ao enviar e-mail de redefinição.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Nome e E-mail são obrigatórios.");
      return;
    }

    if (!editingUser && password.length < 6) {
      toast.error("A senha de acesso deve ter pelo menos 6 caracteres.");
      return;
    }

    const lowerEmail = email.toLowerCase().trim();
    const userDocRef = doc(db, 'admin_users', lowerEmail);

    const userData: Partial<AdminUser> = {
      name: name.trim(),
      email: lowerEmail,
      role,
      permissions: role === 'admin' ? adminPermissions : permissions,
    };

    try {
      if (!editingUser) {
        // Criar usuário na autenticação do Firebase sem deslogar o administrador atual usando a API REST
        const toastId = toast.loading("Criando credenciais de login...");
        try {
          const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: lowerEmail,
              password: password,
              returnSecureToken: false
            })
          });

          const data = await res.json();
          if (!res.ok) {
            const errCode = data.error?.message;
            if (errCode === 'EMAIL_EXISTS') {
              toast.dismiss(toastId);
              toast.success("O e-mail já existe na autenticação. Vinculando permissões...");
            } else if (errCode === 'INVALID_EMAIL') {
              toast.dismiss(toastId);
              toast.error("E-mail inválido.");
              return;
            } else if (errCode === 'WEAK_PASSWORD') {
              toast.dismiss(toastId);
              toast.error("A senha digitada é muito fraca (mínimo 6 caracteres).");
              return;
            } else {
              toast.dismiss(toastId);
              toast.error(`Erro ao criar conta de login: ${errCode || 'Desconhecido'}`);
              return;
            }
          } else {
            toast.dismiss(toastId);
          }
        } catch (restErr: any) {
          console.error("Auth REST API error:", restErr);
          toast.dismiss(toastId);
          toast.error("Erro de conexão ao criar conta de login.");
          return;
        }

        // Create
        await setDoc(userDocRef, {
          ...userData,
          createdAt: serverTimestamp()
        });
        toast.success("Usuário/Vendedor cadastrado com sucesso!");
      } else {
        // Edit
        await setDoc(userDocRef, userData, { merge: true });
        toast.success("Usuário atualizado com sucesso!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar usuário.");
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (window.confirm(`Tem certeza de que deseja excluir o usuário ${user.name}?`)) {
      try {
        await deleteDoc(doc(db, 'admin_users', user.id));
        toast.success("Usuário excluído com sucesso!");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao excluir usuário.");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-800">Controle de Usuários & Vendedores</h2>
          <p className="text-gray-500 text-sm mt-1">Gerencie quem tem acesso ao painel e configure permissões de forma cirúrgica.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-105 transition-all shadow-sm"
        >
          <Plus size={18} /> Novo Usuário / Vendedor
        </button>
      </div>

      {/* Info Alert explaining implementation */}
      <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3.5">
        <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-amber-800 leading-relaxed">
          <strong className="font-bold">Como funciona a Autenticação no Firebase:</strong>
          <p className="mt-1">
            Para que o novo usuário ou vendedor consiga acessar o painel administrativo, além de cadastrá-lo aqui com as permissões devidas, você deve criar as credenciais de login no seu <strong className="font-bold">Console do Firebase</strong> (Menu Lateral &gt; <strong className="font-bold">Autenticação</strong> &gt; Aba <strong className="font-bold">Users</strong> &gt; Botão <strong className="font-bold">Add user</strong>), inserindo o <strong className="font-bold">mesmo E-mail</strong> cadastrado abaixo e a senha que ele usará.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent"></div>
        </div>
      ) : usersList.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <Shield className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">Nenhum usuário ou vendedor cadastrado além do administrador padrão.</p>
          <p className="text-gray-400 text-sm mt-1">Clique no botão acima para adicionar o primeiro vendedor.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200/80">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Nome</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">E-mail</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Função / Cargo</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Permissões Principais</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 text-sm">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm font-medium">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        <Shield size={12} />
                        {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="text-xs text-purple-600 font-semibold">Acesso Total Irrestrito</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(user.permissions || {}).map(([key, value]) => {
                            if (!value) return null;
                            const labels: Record<string, string> = {
                              overview: 'Painel',
                              products: 'Produtos',
                              customProducts: 'Personalizados',
                              orders: 'Pedidos',
                              pos: 'PDV',
                              avulsos: 'Avulsos',
                              customers: 'Clientes',
                              coupons: 'Cupons',
                              financial: 'Financeiro',
                              hr: 'RH/Equipe',
                              accounting: 'Contabilidade',
                              documents: 'Documentos',
                              settings: 'Ajustes',
                              users: 'Usuários'
                            };
                            return (
                              <span key={key} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {labels[key] || key}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 rounded-lg transition-all"
                          title="Editar Usuário"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir Usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col my-8">
            <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Shield className="text-[var(--color-primary)]" size={20} />
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">
                  {editingUser ? 'Editar Usuário / Vendedor' : 'Cadastrar Usuário / Vendedor'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Silva"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all font-medium text-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">E-mail de Login</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      disabled={!!editingUser}
                      placeholder="vendedor@seuemail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-60 transition-all font-medium text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {!editingUser ? (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Senha Inicial de Acesso (mínimo 6 caracteres)</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="Ex: Senha123"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all font-medium text-gray-800"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Key className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <span className="font-bold text-xs text-blue-900 block">Redefinição de Senha</span>
                      <span className="text-[10px] text-blue-600 block">Deseja alterar ou recuperar a senha deste vendedor?</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="w-full sm:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Enviar E-mail de Redefinição
                  </button>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Função / Cargo</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                    role === 'vendedor' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="vendedor"
                      checked={role === 'vendedor'}
                      onChange={() => handleRoleChange('vendedor')}
                      className="mt-0.5 text-[var(--color-primary)] border-gray-300 focus:ring-[var(--color-primary)]"
                    />
                    <div>
                      <span className="font-bold text-sm block">Vendedor</span>
                      <span className="text-xs text-gray-500 mt-1 block">Acesso restrito apenas às áreas que você selecionar abaixo.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                    role === 'admin' 
                      ? 'border-purple-600 bg-purple-50/50 text-purple-700' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => handleRoleChange('admin')}
                      className="mt-0.5 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-bold text-sm block">Administrador</span>
                      <span className="text-xs text-gray-500 mt-1 block">Acesso completo e total de administração (não é possível limitar).</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Permissions Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Permissões de Acesso</label>
                  {role === 'admin' && (
                    <span className="text-xs text-purple-600 font-semibold">Administradores têm todas as permissões liberadas</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'overview', label: 'Painel / Visão Geral', desc: 'Resumos de faturamento, gráficos e estatísticas.' },
                    { key: 'products', label: 'Produtos', desc: 'Cadastrar, editar ou excluir produtos de catálogo.' },
                    { key: 'customProducts', label: 'Personalizados', desc: 'Gerenciar moldes e opções de personalizados.' },
                    { key: 'orders', label: 'Pedidos', desc: 'Visualizar, atualizar status e imprimir pedidos.' },
                    { key: 'pos', label: 'Novo Orçamento / Venda (PDV)', desc: 'Registrar novas vendas presenciais e orçamentos.' },
                    { key: 'avulsos', label: 'Avulsos', desc: 'Gerenciar itens avulsos de venda.' },
                    { key: 'customers', label: 'Clientes', desc: 'Visualizar estatísticas de clientes e excluir cadastros.' },
                    { key: 'coupons', label: 'Cupons de Desconto', desc: 'Criar e deletar cupons promocionais.' },
                    { key: 'financial', label: 'Módulo Financeiro', desc: 'Acessar precificação fixa, custos, métodos de pagamento e frete.' },
                    { key: 'hr', label: 'Gestão de RH e Equipe', desc: 'Gerenciar colaboradores, folha de pagamento, comissões e holerites.' },
                    { key: 'accounting', label: 'Contabilidade Integrada', desc: 'DRE, Plano de contas, livro caixa, NFe e relatórios contábeis.' },
                    { key: 'documents', label: 'Documentos / Recibos', desc: 'Gerar recibos de pagamentos e orçamentos.' },
                    { key: 'settings', label: 'Configurações', desc: 'Alterar visual do site, contatos e preferências gerais.' },
                    { key: 'users', label: 'Controle de Usuários', desc: 'Adicionar ou alterar permissões de outros vendedores.' },
                  ].map((perm) => {
                    const isChecked = role === 'admin' ? true : permissions[perm.key as keyof UserPermissions];
                    return (
                      <label
                        key={perm.key}
                        onClick={() => togglePermission(perm.key as keyof UserPermissions)}
                        className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                          role === 'admin'
                            ? 'opacity-70 bg-purple-50/10 border-purple-100 cursor-not-allowed'
                            : isChecked
                            ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 text-gray-900'
                            : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isChecked 
                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' 
                            : 'border-gray-300'
                        }`}>
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div>
                          <span className="text-xs font-bold block">{perm.label}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5 block">{perm.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <footer className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-50 transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-105 transition-all text-center shadow-md"
                >
                  Salvar Alterações
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
