import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs 
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}
import { 
  Users, User, UserPlus, FileText, Calendar, DollarSign, Clock, Award, TrendingUp, 
  Plus, Search, Filter, Edit2, Trash2, Eye, CheckCircle2, XCircle, AlertCircle, 
  Printer, Download, Building, Briefcase, HeartHandshake, ShieldCheck, Check, 
  X, ChevronRight, Phone, Mail, MapPin, CreditCard, PieChart, BadgePercent, ArrowUpRight, FileCheck, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface Employee {
  id: string;
  name: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  phone: string;
  email: string;
  address?: string;
  emergencyContact?: string;
  roleTitle: string; // e.g. Vendedor, Gerente, Estoquista, Designer
  department: 'Vendas' | 'Atendimento' | 'Produção' | 'Estoque' | 'Financeiro' | 'Gerência' | 'Outro';
  contractType: 'CLT' | 'PJ' | 'Estágio' | 'Freelancer' | 'Menor Aprendiz';
  admissionDate: string;
  workSchedule?: string; // e.g. "Seg a Sex: 08h às 18h"
  status: 'Ativo' | 'Férias' | 'Licença' | 'Desligado';
  baseSalary: number;
  commissionPct: number; // e.g. 3%
  salesGoalMonthly?: number; // e.g. 15000
  pixKey?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  notes?: string;
  createdAt?: any;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  referenceMonth: string; // YYYY-MM
  baseSalary: number;
  commissionAmount: number;
  bonusAmount: number;
  overtimeAmount: number;
  advancesAmount: number; // vales
  deductionsAmount: number; // faltas, descontos
  netSalary: number;
  status: 'Pendente' | 'Pago';
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt?: any;
}

export interface TimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  entry1?: string; // 08:00
  exit1?: string;  // 12:00
  entry2?: string; // 13:00
  exit2?: string;  // 18:00
  type: 'normal' | 'falta' | 'atestado' | 'folga' | 'ferias';
  notes?: string;
}

export interface VacationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: 'Programado' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  notes?: string;
}

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Carlos Eduardo Silva',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    birthDate: '1992-05-14',
    phone: '(11) 98765-4321',
    email: 'carlos.vendas@empresa.com',
    address: 'Rua das Flores, 120 - São Paulo, SP',
    emergencyContact: 'Maria Silva (Esposa) - (11) 97777-6666',
    roleTitle: 'Vendedor Sênior',
    department: 'Vendas',
    contractType: 'CLT',
    admissionDate: '2023-03-15',
    workSchedule: 'Seg a Sex: 08:30 às 18:00 (Sáb: 08:30 às 12:30)',
    status: 'Ativo',
    baseSalary: 2800.00,
    commissionPct: 3.5,
    salesGoalMonthly: 25000,
    pixKey: '123.456.789-00',
    bankName: 'Banco Itaú',
    bankAgency: '0123',
    bankAccount: '45678-9',
    notes: 'Excelente desempenho em vendas consultivas e atendimento ao cliente.'
  },
  {
    id: 'emp-2',
    name: 'Ana Beatriz Souza',
    cpf: '987.654.321-11',
    rg: '98.765.432-1',
    birthDate: '1996-11-20',
    phone: '(11) 91234-5678',
    email: 'ana.design@empresa.com',
    address: 'Av. Paulista, 1000 - Cj 42 - São Paulo, SP',
    emergencyContact: 'Roberto Souza (Pai) - (11) 98888-1111',
    roleTitle: 'Designer de Produtos / Arte',
    department: 'Produção',
    contractType: 'PJ',
    admissionDate: '2024-01-10',
    workSchedule: 'Seg a Sex: 09:00 às 18:00',
    status: 'Ativo',
    baseSalary: 3500.00,
    commissionPct: 0,
    salesGoalMonthly: 0,
    pixKey: 'ana.design@empresa.com',
    bankName: 'Banco Nubank',
    bankAgency: '0001',
    bankAccount: '1234567-8',
    notes: 'Responsável pela criação de artes e layout de produtos personalizados.'
  },
  {
    id: 'emp-3',
    name: 'Roberto Mendes Santos',
    cpf: '456.789.123-22',
    phone: '(11) 99887-7665',
    email: 'roberto.estoque@empresa.com',
    roleTitle: 'Auxiliar de Logística & Estoque',
    department: 'Estoque',
    contractType: 'CLT',
    admissionDate: '2023-08-01',
    workSchedule: 'Seg a Sex: 08:00 às 17:00',
    status: 'Ativo',
    baseSalary: 2200.00,
    commissionPct: 1.0,
    salesGoalMonthly: 10000,
    pixKey: '(11) 99887-7665',
    bankName: 'Banco Bradesco',
    bankAgency: '0456',
    bankAccount: '98765-4',
    notes: 'Conferência de estoque, expedição e embalagem de pedidos.'
  }
];

export function HRView() {
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'time' | 'commissions' | 'vacations'>('employees');
  
  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [vacations, setVacations] = useState<VacationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modal States
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);

  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [selectedPayrollReceipt, setSelectedPayrollReceipt] = useState<PayrollRecord | null>(null);

  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);

  // Form States - Employee
  const [empName, setEmpName] = useState('');
  const [empCpf, setEmpCpf] = useState('');
  const [empRg, setEmpRg] = useState('');
  const [empBirthDate, setEmpBirthDate] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [empEmergencyContact, setEmpEmergencyContact] = useState('');
  const [empRoleTitle, setEmpRoleTitle] = useState('');
  const [empDepartment, setEmpDepartment] = useState<Employee['department']>('Vendas');
  const [empContractType, setEmpContractType] = useState<Employee['contractType']>('CLT');
  const [empAdmissionDate, setEmpAdmissionDate] = useState('');
  const [empWorkSchedule, setEmpWorkSchedule] = useState('');
  const [empStatus, setEmpStatus] = useState<Employee['status']>('Ativo');
  const [empBaseSalary, setEmpBaseSalary] = useState<number | ''>(0);
  const [empCommissionPct, setEmpCommissionPct] = useState<number | ''>(0);
  const [empSalesGoalMonthly, setEmpSalesGoalMonthly] = useState<number | ''>(0);
  const [empPixKey, setEmpPixKey] = useState('');
  const [empBankName, setEmpBankName] = useState('');
  const [empBankAgency, setEmpBankAgency] = useState('');
  const [empBankAccount, setEmpBankAccount] = useState('');
  const [empNotes, setEmpNotes] = useState('');

  // Form States - Payroll
  const [payEmpId, setPayEmpId] = useState('');
  const [payRefMonth, setPayRefMonth] = useState(selectedMonth);
  const [payBaseSalary, setPayBaseSalary] = useState<number | ''>(0);
  const [payCommissionAmount, setPayCommissionAmount] = useState<number | ''>(0);
  const [payBonusAmount, setPayBonusAmount] = useState<number | ''>(0);
  const [payOvertimeAmount, setPayOvertimeAmount] = useState<number | ''>(0);
  const [payAdvancesAmount, setPayAdvancesAmount] = useState<number | ''>(0);
  const [payDeductionsAmount, setPayDeductionsAmount] = useState<number | ''>(0);
  const [payStatus, setPayStatus] = useState<'Pendente' | 'Pago'>('Pendente');
  const [payPaymentDate, setPayPaymentDate] = useState('');
  const [payPaymentMethod, setPayPaymentMethod] = useState('PIX');
  const [payNotes, setPayNotes] = useState('');

  // Form States - Vacation
  const [vacEmpId, setVacEmpId] = useState('');
  const [vacStartDate, setVacStartDate] = useState('');
  const [vacEndDate, setVacEndDate] = useState('');
  const [vacStatus, setVacStatus] = useState<VacationRecord['status']>('Programado');
  const [vacNotes, setVacNotes] = useState('');

  // Realtime Listeners
  useEffect(() => {
    // 1. Employees
    const unsubEmployees = onSnapshot(collection(db, 'hr_employees'), (snapshot) => {
      if (snapshot.empty) {
        setEmployees(INITIAL_EMPLOYEES);
      } else {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
        setEmployees(list);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hr_employees');
      setEmployees(INITIAL_EMPLOYEES);
      setLoading(false);
    });

    // 2. Payrolls
    const unsubPayrolls = onSnapshot(collection(db, 'hr_payrolls'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PayrollRecord[];
        setPayrolls(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hr_payrolls');
    });

    // 3. Time Records
    const unsubTime = onSnapshot(collection(db, 'hr_time_records'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimeRecord[];
        setTimeRecords(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hr_time_records');
    });

    // 4. Vacations
    const unsubVacations = onSnapshot(collection(db, 'hr_vacations'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VacationRecord[];
        setVacations(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hr_vacations');
    });

    return () => {
      unsubEmployees();
      unsubPayrolls();
      unsubTime();
      unsubVacations();
    };
  }, []);

  // Open Employee Modal
  const handleOpenEmployeeModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setEmpName(emp.name);
      setEmpCpf(emp.cpf);
      setEmpRg(emp.rg || '');
      setEmpBirthDate(emp.birthDate || '');
      setEmpPhone(emp.phone);
      setEmpEmail(emp.email);
      setEmpAddress(emp.address || '');
      setEmpEmergencyContact(emp.emergencyContact || '');
      setEmpRoleTitle(emp.roleTitle);
      setEmpDepartment(emp.department);
      setEmpContractType(emp.contractType);
      setEmpAdmissionDate(emp.admissionDate);
      setEmpWorkSchedule(emp.workSchedule || '');
      setEmpStatus(emp.status);
      setEmpBaseSalary(emp.baseSalary);
      setEmpCommissionPct(emp.commissionPct);
      setEmpSalesGoalMonthly(emp.salesGoalMonthly || 0);
      setEmpPixKey(emp.pixKey || '');
      setEmpBankName(emp.bankName || '');
      setEmpBankAgency(emp.bankAgency || '');
      setEmpBankAccount(emp.bankAccount || '');
      setEmpNotes(emp.notes || '');
    } else {
      setEditingEmployee(null);
      setEmpName('');
      setEmpCpf('');
      setEmpRg('');
      setEmpBirthDate('');
      setEmpPhone('');
      setEmpEmail('');
      setEmpAddress('');
      setEmpEmergencyContact('');
      setEmpRoleTitle('Vendedor');
      setEmpDepartment('Vendas');
      setEmpContractType('CLT');
      setEmpAdmissionDate(new Date().toISOString().split('T')[0]);
      setEmpWorkSchedule('Seg a Sex: 08:00 às 18:00');
      setEmpStatus('Ativo');
      setEmpBaseSalary(2500);
      setEmpCommissionPct(2);
      setEmpSalesGoalMonthly(15000);
      setEmpPixKey('');
      setEmpBankName('');
      setEmpBankAgency('');
      setEmpBankAccount('');
      setEmpNotes('');
    }
    setIsEmployeeModalOpen(true);
  };

  // Save Employee
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empCpf.trim()) {
      toast.error("Por favor, preencha o Nome e o CPF do colaborador.");
      return;
    }

    const payload: Omit<Employee, 'id'> = {
      name: empName.trim(),
      cpf: empCpf.trim(),
      rg: empRg.trim(),
      birthDate: empBirthDate,
      phone: empPhone.trim(),
      email: empEmail.trim(),
      address: empAddress.trim(),
      emergencyContact: empEmergencyContact.trim(),
      roleTitle: empRoleTitle.trim() || 'Colaborador',
      department: empDepartment,
      contractType: empContractType,
      admissionDate: empAdmissionDate || new Date().toISOString().split('T')[0],
      workSchedule: empWorkSchedule.trim(),
      status: empStatus,
      baseSalary: Number(empBaseSalary) || 0,
      commissionPct: Number(empCommissionPct) || 0,
      salesGoalMonthly: Number(empSalesGoalMonthly) || 0,
      pixKey: empPixKey.trim(),
      bankName: empBankName.trim(),
      bankAgency: empBankAgency.trim(),
      bankAccount: empBankAccount.trim(),
      notes: empNotes.trim(),
      createdAt: serverTimestamp()
    };

    try {
      if (editingEmployee) {
        await setDoc(doc(db, 'hr_employees', editingEmployee.id), payload, { merge: true });
        toast.success("Dados do colaborador atualizados com sucesso!");
      } else {
        const newRef = doc(collection(db, 'hr_employees'));
        await setDoc(newRef, { id: newRef.id, ...payload });
        toast.success("Novo colaborador cadastrado com sucesso!");
      }
      setIsEmployeeModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hr_employees');
      toast.error("Erro ao salvar informações no banco de dados.");
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (empId: string, empName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o cadastro de "${empName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'hr_employees', empId));
      toast.success("Colaborador removido com sucesso.");
      if (selectedEmployeeDetail?.id === empId) setSelectedEmployeeDetail(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `hr_employees/${empId}`);
      toast.error("Erro ao remover registro.");
    }
  };

  // Open Payroll Modal
  const handleOpenPayrollModal = (pay?: PayrollRecord, defaultEmp?: Employee) => {
    if (pay) {
      setEditingPayroll(pay);
      setPayEmpId(pay.employeeId);
      setPayRefMonth(pay.referenceMonth);
      setPayBaseSalary(pay.baseSalary);
      setPayCommissionAmount(pay.commissionAmount);
      setPayBonusAmount(pay.bonusAmount);
      setPayOvertimeAmount(pay.overtimeAmount);
      setPayAdvancesAmount(pay.advancesAmount);
      setPayDeductionsAmount(pay.deductionsAmount);
      setPayStatus(pay.status);
      setPayPaymentDate(pay.paymentDate || '');
      setPayPaymentMethod(pay.paymentMethod || 'PIX');
      setPayNotes(pay.notes || '');
    } else {
      setEditingPayroll(null);
      const targetEmp = defaultEmp || employees[0];
      setPayEmpId(targetEmp ? targetEmp.id : '');
      setPayRefMonth(selectedMonth);
      setPayBaseSalary(targetEmp ? targetEmp.baseSalary : 0);
      setPayCommissionAmount(0);
      setPayBonusAmount(0);
      setPayOvertimeAmount(0);
      setPayAdvancesAmount(0);
      setPayDeductionsAmount(0);
      setPayStatus('Pendente');
      setPayPaymentDate(new Date().toISOString().split('T')[0]);
      setPayPaymentMethod('PIX');
      setPayNotes('');
    }
    setIsPayrollModalOpen(true);
  };

  // Handle Employee select change in Payroll modal
  const handlePayrollEmployeeChange = (empId: string) => {
    setPayEmpId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setPayBaseSalary(emp.baseSalary);
    }
  };

  // Save Payroll
  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === payEmpId);
    if (!emp) {
      toast.error("Selecione um colaborador válido.");
      return;
    }

    const base = Number(payBaseSalary) || 0;
    const comm = Number(payCommissionAmount) || 0;
    const bonus = Number(payBonusAmount) || 0;
    const over = Number(payOvertimeAmount) || 0;
    const adv = Number(payAdvancesAmount) || 0;
    const ded = Number(payDeductionsAmount) || 0;
    const net = base + comm + bonus + over - adv - ded;

    const payload: Omit<PayrollRecord, 'id'> = {
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.roleTitle,
      referenceMonth: payRefMonth,
      baseSalary: base,
      commissionAmount: comm,
      bonusAmount: bonus,
      overtimeAmount: over,
      advancesAmount: adv,
      deductionsAmount: ded,
      netSalary: net,
      status: payStatus,
      paymentDate: payStatus === 'Pago' ? (payPaymentDate || new Date().toISOString().split('T')[0]) : '',
      paymentMethod: payPaymentMethod,
      notes: payNotes.trim(),
      createdAt: serverTimestamp()
    };

    try {
      if (editingPayroll) {
        await setDoc(doc(db, 'hr_payrolls', editingPayroll.id), payload, { merge: true });
        toast.success("Folha de pagamento atualizada!");
      } else {
        const newRef = doc(collection(db, 'hr_payrolls'));
        await setDoc(newRef, { id: newRef.id, ...payload });
        toast.success("Lançamento de folha gerado com sucesso!");
      }
      setIsPayrollModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hr_payrolls');
      toast.error("Erro ao registrar lançamento de folha.");
    }
  };

  // Save Vacation
  const handleSaveVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === vacEmpId);
    if (!emp || !vacStartDate || !vacEndDate) {
      toast.error("Preencha o colaborador e as datas de início e término.");
      return;
    }

    const start = new Date(vacStartDate);
    const end = new Date(vacEndDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    const payload = {
      employeeId: emp.id,
      employeeName: emp.name,
      startDate: vacStartDate,
      endDate: vacEndDate,
      daysCount: days > 0 ? days : 1,
      status: vacStatus,
      notes: vacNotes.trim(),
      createdAt: serverTimestamp()
    };

    try {
      const newRef = doc(collection(db, 'hr_vacations'));
      await setDoc(newRef, { id: newRef.id, ...payload });
      toast.success("Registro de férias agendado com sucesso!");
      setIsVacationModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hr_vacations');
      toast.error("Erro ao salvar agendamento.");
    }
  };

  // Filtered Employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.cpf.includes(searchTerm) ||
                          emp.roleTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'todos' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'todos' || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate High Level Metrics
  const activeEmployeesCount = employees.filter(e => e.status === 'Ativo').length;
  const totalBaseSalaries = employees.reduce((acc, curr) => acc + (curr.status === 'Ativo' ? curr.baseSalary : 0), 0);
  
  // Current Month Payroll Net Total
  const currentMonthPayrolls = payrolls.filter(p => p.referenceMonth === selectedMonth);
  const currentMonthPaidTotal = currentMonthPayrolls.filter(p => p.status === 'Pago').reduce((acc, p) => acc + p.netSalary, 0);
  const currentMonthPendingTotal = currentMonthPayrolls.filter(p => p.status === 'Pendente').reduce((acc, p) => acc + p.netSalary, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-purple-300 text-xs font-extrabold uppercase tracking-widest mb-1">
              <Building size={18} /> Gestão Estratégica de Pessoas & DHO
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Módulo Profissional de RH</h1>
            <p className="text-purple-200/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Controle de colaboradores, folha de pagamento, cálculo de comissões, banco de horas, holerites e gestão de férias integrados.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => handleOpenEmployeeModal()} 
              className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 text-xs uppercase tracking-wider"
            >
              <UserPlus size={18} />
              <span>Novo Colaborador</span>
            </button>
            <button 
              onClick={() => handleOpenPayrollModal()} 
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 text-xs uppercase tracking-wider"
            >
              <DollarSign size={18} />
              <span>Lançar Folha</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-purple-800/60">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider block">Equipe Ativa</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{activeEmployeesCount}</span>
              <span className="text-[11px] text-purple-300">colaboradores</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider block">Folha Base Mensal</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">R$ {totalBaseSalaries.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider block">Folha do Mês ({selectedMonth})</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-300">
                R$ {(currentMonthPaidTotal + currentMonthPendingTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider block">Status de Pagamento</span>
            <div className="flex items-center gap-2 mt-1 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                R$ {currentMonthPaidTotal.toLocaleString('pt-BR')} Pago
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/40">
                R$ {currentMonthPendingTotal.toLocaleString('pt-BR')} Pend.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'employees'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users size={16} />
          <span>Ficha de Colaboradores</span>
          <span className="ml-1 bg-white/20 text-current px-2 py-0.5 rounded-full text-[10px]">
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <DollarSign size={16} />
          <span>Folha de Pagamento & Holerites</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'commissions'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Award size={16} />
          <span>Comissões & Metas</span>
        </button>

        <button
          onClick={() => setActiveTab('time')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'time'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Clock size={16} />
          <span>Escalas & Registro Ponto</span>
        </button>

        <button
          onClick={() => setActiveTab('vacations')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'vacations'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar size={16} />
          <span>Férias & Ausências</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEES LIST & FICHA */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Filters and Controls */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou cargo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:border-purple-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Filter size={14} className="text-gray-400" />
                <span className="text-[10px] uppercase font-bold text-gray-500">Setor:</span>
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="todos">Todos os Setores</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Atendimento">Atendimento</option>
                  <option value="Produção">Produção</option>
                  <option value="Estoque">Estoque</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Gerência">Gerência</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Férias">Férias</option>
                  <option value="Licença">Licença</option>
                  <option value="Desligado">Desligado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employee Grid / Table */}
          {filteredEmployees.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-700 uppercase tracking-wider">Nenhum colaborador encontrado</h3>
              <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros de busca ou cadastre um novo membro da equipe.</p>
              <button 
                onClick={() => handleOpenEmployeeModal()} 
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition-all"
              >
                Cadastrar Colaborador
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shrink-0">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{emp.name}</h3>
                          <span className="inline-block text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md mt-0.5">
                            {emp.roleTitle}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        emp.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' :
                        emp.status === 'Férias' ? 'bg-blue-100 text-blue-800' :
                        emp.status === 'Licença' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {emp.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Departamento:</span>
                        <span className="font-bold text-gray-800">{emp.department} ({emp.contractType})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">CPF / Telefone:</span>
                        <span className="font-semibold text-gray-700">{emp.cpf}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Salário Base:</span>
                        <span className="font-extrabold text-emerald-600">R$ {emp.baseSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {emp.commissionPct > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 font-bold uppercase text-[10px]">Comissão sobre vendas:</span>
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{emp.commissionPct}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button 
                      onClick={() => setSelectedEmployeeDetail(emp)} 
                      className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      <Eye size={15} /> Ver Ficha Completa
                    </button>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenEmployeeModal(emp)} 
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar Colaborador"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)} 
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remover Colaborador"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYROLL & HOLERITES */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Month Selector & Banner */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-gray-900 uppercase text-sm tracking-wider">Folha de Pagamento & Holerites</h3>
              <p className="text-xs text-gray-500">Gerencie salários, comissões, vales, horas extras e gere holerites em PDF para a equipe.</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-600 uppercase">Mês de Referência:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-purple-600"
              />
              <button 
                onClick={() => handleOpenPayrollModal()}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
              >
                <Plus size={16} /> Lançar na Folha
              </button>
            </div>
          </div>

          {/* Payroll List Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-4">Colaborador</th>
                    <th className="p-4">Mês Ref.</th>
                    <th className="p-4">Salário Base</th>
                    <th className="p-4">Comissão / Bônus</th>
                    <th className="p-4">Descontos / Vales</th>
                    <th className="p-4">Líquido a Pagar</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {payrolls.filter(p => p.referenceMonth === selectedMonth).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        Nenhum lançamento de folha encontrado para o mês de {selectedMonth}.
                        <button 
                          onClick={() => handleOpenPayrollModal()} 
                          className="block mx-auto mt-2 text-xs text-purple-600 font-bold underline"
                        >
                          Clique aqui para gerar o lançamento deste mês
                        </button>
                      </td>
                    </tr>
                  ) : (
                    payrolls.filter(p => p.referenceMonth === selectedMonth).map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-gray-900 block">{pay.employeeName}</span>
                          <span className="text-[10px] text-gray-400 block">{pay.employeeRole}</span>
                        </td>
                        <td className="p-4 font-bold text-gray-600">{pay.referenceMonth}</td>
                        <td className="p-4 font-semibold text-gray-700">R$ {pay.baseSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-emerald-600 font-bold">
                          +R$ {(pay.commissionAmount + pay.bonusAmount + pay.overtimeAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-rose-500 font-bold">
                          -R$ {(pay.advancesAmount + pay.deductionsAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 font-black text-sm text-gray-900">
                          R$ {pay.netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            pay.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pay.status === 'Pago' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {pay.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button 
                            onClick={() => setSelectedPayrollReceipt(pay)}
                            className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            title="Visualizar e Imprimir Holerite"
                          >
                            <Printer size={14} /> Holerite
                          </button>
                          <button 
                            onClick={() => handleOpenPayrollModal(pay)} 
                            className="p-1.5 text-gray-500 hover:text-purple-600 rounded-lg"
                          >
                            <Edit2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMISSIONS & GOALS */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-gray-900 uppercase text-sm tracking-wider">Metas & Desempenho Comercial da Equipe</h3>
              <p className="text-xs text-gray-500">Acompanhamento do atingimento de metas individuais de vendas e cálculo de comissões estimadas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {employees.filter(e => e.status === 'Ativo').map((emp) => {
                const goal = emp.salesGoalMonthly || 1;
                // Dummy calculated current sales for visualization (can be connected to orders)
                const currentSales = emp.salesGoalMonthly ? Math.round(emp.salesGoalMonthly * 0.78) : 0;
                const progressPct = Math.min(Math.round((currentSales / goal) * 100), 100);
                const estimatedCommission = (currentSales * (emp.commissionPct / 100));

                return (
                  <div key={emp.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-sm">{emp.name}</h4>
                        <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{emp.roleTitle}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-purple-900 block">{emp.commissionPct}% Comissão</span>
                        <span className="text-[10px] text-gray-400 block">taxa fixa</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">Meta de Vendas:</span>
                        <span className="font-bold text-gray-800">R$ {goal.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">Vendido no Mês:</span>
                        <span className="font-extrabold text-emerald-600">R$ {currentSales.toLocaleString('pt-BR')}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mt-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                        <span>Atingido: {progressPct}%</span>
                        <span className="text-emerald-700">Comissão Acumulada: R$ {estimatedCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIME & SCHEDULE */}
      {activeTab === 'time' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900 uppercase text-sm tracking-wider">Escalas de Trabalho & Apontamento de Ponto</h3>
              <p className="text-xs text-gray-500">Horários contratados e controle de presença da equipe.</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {employees.map((emp) => (
              <div key={emp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-xs">
                    {emp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{emp.name}</h4>
                    <p className="text-xs text-gray-500">{emp.roleTitle} • <span className="text-purple-700 font-bold">{emp.department}</span></p>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[10px] block">Escala Contratada:</span>
                  <span className="font-extrabold text-slate-800">{emp.workSchedule || 'Segunda a Sexta (08h às 18h)'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: VACATIONS */}
      {activeTab === 'vacations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 uppercase text-sm tracking-wider">Gestão de Férias & Ausências</h3>
                <p className="text-xs text-gray-500">Agendamento de períodos de descanso e controle de afastamentos.</p>
              </div>
              <button 
                onClick={() => setIsVacationModalOpen(true)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                <Plus size={16} /> Agendar Férias
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {vacations.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-gray-400 border border-dashed rounded-2xl">
                  Nenhuma férias agendada no momento.
                </div>
              ) : (
                vacations.map((vac) => (
                  <div key={vac.id} className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-purple-900 text-sm">{vac.employeeName}</h4>
                      <p className="text-xs text-purple-700 mt-0.5">
                        <Calendar size={14} className="inline mr-1" />
                        {vac.startDate} até {vac.endDate} ({vac.daysCount} dias)
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-purple-200 text-purple-900 font-black rounded-full text-[10px] uppercase">
                      {vac.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRO / EDIÇÃO DE COLABORADOR */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 uppercase tracking-wider">
                    {editingEmployee ? 'Editar Ficha do Colaborador' : 'Novo Cadastro de Colaborador'}
                  </h3>
                  <p className="text-xs text-gray-500">Preencha as informações pessoais, profissionais e financeiras.</p>
                </div>
              </div>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-6">
              
              {/* Seção Dados Pessoais */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-purple-800 tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <User size={14} /> 1. Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Nome Completo *</label>
                    <input 
                      type="text" 
                      required 
                      value={empName} 
                      onChange={e => setEmpName(e.target.value)} 
                      placeholder="Ex: Carlos Eduardo Silva" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">CPF *</label>
                    <input 
                      type="text" 
                      required 
                      value={empCpf} 
                      onChange={e => setEmpCpf(e.target.value)} 
                      placeholder="000.000.000-00" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Telefone / WhatsApp</label>
                    <input 
                      type="text" 
                      value={empPhone} 
                      onChange={e => setEmpPhone(e.target.value)} 
                      placeholder="(11) 99999-9999" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">E-mail</label>
                    <input 
                      type="email" 
                      value={empEmail} 
                      onChange={e => setEmpEmail(e.target.value)} 
                      placeholder="email@empresa.com" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Contato de Emergência</label>
                    <input 
                      type="text" 
                      value={empEmergencyContact} 
                      onChange={e => setEmpEmergencyContact(e.target.value)} 
                      placeholder="Nome e telefone" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Dados Profissionais */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-purple-800 tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <Briefcase size={14} /> 2. Dados Profissionais & Contratuais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Cargo / Função</label>
                    <input 
                      type="text" 
                      value={empRoleTitle} 
                      onChange={e => setEmpRoleTitle(e.target.value)} 
                      placeholder="Ex: Vendedor, Estoquista" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Setor / Departamento</label>
                    <select 
                      value={empDepartment} 
                      onChange={e => setEmpDepartment(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    >
                      <option value="Vendas">Vendas</option>
                      <option value="Atendimento">Atendimento</option>
                      <option value="Produção">Produção</option>
                      <option value="Estoque">Estoque</option>
                      <option value="Financeiro">Financeiro</option>
                      <option value="Gerência">Gerência</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Tipo Contrato</label>
                    <select 
                      value={empContractType} 
                      onChange={e => setEmpContractType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    >
                      <option value="CLT">CLT</option>
                      <option value="PJ">PJ</option>
                      <option value="Estagio">Estágio</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Menor Aprendiz">Menor Aprendiz</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Data de Admissão</label>
                    <input 
                      type="date" 
                      value={empAdmissionDate} 
                      onChange={e => setEmpAdmissionDate(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Status</label>
                    <select 
                      value={empStatus} 
                      onChange={e => setEmpStatus(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Férias">Férias</option>
                      <option value="Licença">Licença</option>
                      <option value="Desligado">Desligado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Escala de Horário</label>
                    <input 
                      type="text" 
                      value={empWorkSchedule} 
                      onChange={e => setEmpWorkSchedule(e.target.value)} 
                      placeholder="Ex: Seg a Sex 08h às 18h" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Salário e Remuneração */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-purple-800 tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <DollarSign size={14} /> 3. Salário & Comissões
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Salário Base Mensal (R$)</label>
                    <input 
                      type="number" 
                      step="50" 
                      value={empBaseSalary} 
                      onChange={e => setEmpBaseSalary(parseFloat(e.target.value) || '')} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-emerald-700 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Taxa de Comissão (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={empCommissionPct} 
                      onChange={e => setEmpCommissionPct(parseFloat(e.target.value) || '')} 
                      placeholder="Ex: 3.5%" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-purple-700 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Meta de Vendas (R$/mês)</label>
                    <input 
                      type="number" 
                      step="500" 
                      value={empSalesGoalMonthly} 
                      onChange={e => setEmpSalesGoalMonthly(parseFloat(e.target.value) || '')} 
                      placeholder="Ex: 20000" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Chave PIX</label>
                    <input 
                      type="text" 
                      value={empPixKey} 
                      onChange={e => setEmpPixKey(e.target.value)} 
                      placeholder="CPF, E-mail ou Celular" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Dados Bancários</label>
                    <input 
                      type="text" 
                      value={empBankName} 
                      onChange={e => setEmpBankName(e.target.value)} 
                      placeholder="Ex: Banco Itaú / Ag 0123 / Cc 45678-9" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEmployeeModalOpen(false)} 
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LANÇAMENTO DE FOLHA */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 uppercase tracking-wider">Lançamento de Folha de Pagamento</h3>
                  <p className="text-xs text-gray-500">Apuração de salário, comissão, vales e deduções.</p>
                </div>
              </div>
              <button onClick={() => setIsPayrollModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Colaborador *</label>
                  <select 
                    value={payEmpId} 
                    onChange={e => handlePayrollEmployeeChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-emerald-600"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.roleTitle})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Mês Referência *</label>
                  <input 
                    type="month" 
                    required 
                    value={payRefMonth} 
                    onChange={e => setPayRefMonth(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Salário Base (R$)</label>
                  <input 
                    type="number" 
                    step="50" 
                    value={payBaseSalary} 
                    onChange={e => setPayBaseSalary(parseFloat(e.target.value) || '')} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-emerald-700">+ Comissão do Mês (R$)</label>
                  <input 
                    type="number" 
                    step="10" 
                    value={payCommissionAmount} 
                    onChange={e => setPayCommissionAmount(parseFloat(e.target.value) || '')} 
                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs font-bold text-emerald-800 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-emerald-700">+ Horas Extras / Bônus (R$)</label>
                  <input 
                    type="number" 
                    step="10" 
                    value={payBonusAmount} 
                    onChange={e => setPayBonusAmount(parseFloat(e.target.value) || '')} 
                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs font-bold text-emerald-800 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-rose-700">- Vales & Adiantamentos (R$)</label>
                  <input 
                    type="number" 
                    step="10" 
                    value={payAdvancesAmount} 
                    onChange={e => setPayAdvancesAmount(parseFloat(e.target.value) || '')} 
                    className="w-full bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs font-bold text-rose-800 outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Totalizador Calculado */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Líquido A Pagar:</span>
                  <span className="text-2xl font-black text-emerald-400">
                    R$ {((Number(payBaseSalary) || 0) + (Number(payCommissionAmount) || 0) + (Number(payBonusAmount) || 0) - (Number(payAdvancesAmount) || 0) - (Number(payDeductionsAmount) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold uppercase text-slate-300 block">Status do Pagamento:</label>
                  <select 
                    value={payStatus} 
                    onChange={e => setPayStatus(e.target.value as any)}
                    className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPayrollModalOpen(false)} 
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 uppercase"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                >
                  Salvar Lançamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPRESSÃO DE HOLERITE / RECIBO DE PAGAMENTO */}
      {selectedPayrollReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 print:p-0 print:shadow-none print:m-0">
            
            {/* Header impressao */}
            <div className="border-b-2 border-gray-900 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-gray-900">RECIBO DE PAGAMENTO / HOLERITE</h2>
                <p className="text-xs text-gray-600 font-bold">Mês de Referência: {selectedPayrollReceipt.referenceMonth}</p>
              </div>
              <button 
                onClick={() => window.print()} 
                className="no-print flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase"
              >
                <Printer size={16} /> Imprimir / PDF
              </button>
            </div>

            {/* Dados do Colaborador */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px] block">Colaborador:</span>
                <span className="font-extrabold text-gray-900 text-sm block">{selectedPayrollReceipt.employeeName}</span>
                <span className="text-gray-600 font-medium">{selectedPayrollReceipt.employeeRole}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 font-bold uppercase text-[10px] block">Status:</span>
                <span className="font-black text-emerald-700 uppercase">{selectedPayrollReceipt.status}</span>
                {selectedPayrollReceipt.paymentDate && (
                  <span className="text-gray-500 block text-[10px]">Data Pagto: {selectedPayrollReceipt.paymentDate}</span>
                )}
              </div>
            </div>

            {/* Tabela de Proventos e Descontos */}
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700 uppercase text-[10px]">
                    <th className="p-3">Descrição da Rubrica</th>
                    <th className="p-3 text-right">Proventos (R$)</th>
                    <th className="p-3 text-right">Descontos (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  <tr>
                    <td className="p-3 font-semibold">Salário Base Mensal</td>
                    <td className="p-3 text-right font-bold text-emerald-600">R$ {selectedPayrollReceipt.baseSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-gray-300">-</td>
                  </tr>
                  {selectedPayrollReceipt.commissionAmount > 0 && (
                    <tr>
                      <td className="p-3 font-semibold">Comissão de Vendas do Mês</td>
                      <td className="p-3 text-right font-bold text-emerald-600">R$ {selectedPayrollReceipt.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right text-gray-300">-</td>
                    </tr>
                  )}
                  {selectedPayrollReceipt.bonusAmount > 0 && (
                    <tr>
                      <td className="p-3 font-semibold">Bônus / Gratificações</td>
                      <td className="p-3 text-right font-bold text-emerald-600">R$ {selectedPayrollReceipt.bonusAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right text-gray-300">-</td>
                    </tr>
                  )}
                  {selectedPayrollReceipt.advancesAmount > 0 && (
                    <tr>
                      <td className="p-3 font-semibold">Vales / Adiantamentos Salariais</td>
                      <td className="p-3 text-right text-gray-300">-</td>
                      <td className="p-3 text-right font-bold text-rose-600">R$ {selectedPayrollReceipt.advancesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                  {selectedPayrollReceipt.deductionsAmount > 0 && (
                    <tr>
                      <td className="p-3 font-semibold">Faltas / Outros Descontos</td>
                      <td className="p-3 text-right text-gray-300">-</td>
                      <td className="p-3 text-right font-bold text-rose-600">R$ {selectedPayrollReceipt.deductionsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-900 text-white font-black text-sm">
                    <td className="p-4 uppercase">Valor Líquido Recebido</td>
                    <td colSpan={2} className="p-4 text-right text-emerald-400 text-lg">
                      R$ {selectedPayrollReceipt.netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Assinaturas */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-gray-500">
              <div className="border-t border-gray-400 pt-2">
                <span className="font-bold text-gray-900 block">{selectedPayrollReceipt.employeeName}</span>
                <span>Assinatura do Colaborador</span>
              </div>
              <div className="border-t border-gray-400 pt-2">
                <span className="font-bold text-gray-900 block">Departamento de Recursos Humanos</span>
                <span>Empresa / Empregador</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedPayrollReceipt(null)}
              className="no-print w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs uppercase"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: DETALHES DA FICHA DO COLABORADOR */}
      {selectedEmployeeDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-lg shadow-md">
                  {selectedEmployeeDetail.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">{selectedEmployeeDetail.name}</h3>
                  <p className="text-xs text-purple-700 font-bold">{selectedEmployeeDetail.roleTitle} • {selectedEmployeeDetail.department}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[10px] block">CPF:</span>
                  <span className="font-bold text-gray-800">{selectedEmployeeDetail.cpf}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[10px] block">Tipo de Contrato:</span>
                  <span className="font-bold text-gray-800">{selectedEmployeeDetail.contractType}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[10px] block">Telefone:</span>
                  <span className="font-bold text-gray-800">{selectedEmployeeDetail.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[10px] block">Data de Admissão:</span>
                  <span className="font-bold text-gray-800">{selectedEmployeeDetail.admissionDate}</span>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-2">
                <h4 className="font-black text-purple-900 uppercase text-[11px]">Remuneração & Chave PIX</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Salário Base:</span>
                    <span className="font-black text-emerald-700 text-sm">R$ {selectedEmployeeDetail.baseSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Comissão sobre Vendas:</span>
                    <span className="font-black text-purple-700 text-sm">{selectedEmployeeDetail.commissionPct}%</span>
                  </div>
                  {selectedEmployeeDetail.pixKey && (
                    <div className="col-span-2 pt-1 border-t border-purple-200/60">
                      <span className="text-gray-500 text-[10px] block">Chave PIX Cadastrada:</span>
                      <span className="font-extrabold text-gray-900 bg-white px-3 py-1 rounded-lg border border-purple-200 inline-block mt-0.5">{selectedEmployeeDetail.pixKey}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedEmployeeDetail.notes && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px] block mb-1">Observações / Anotações:</span>
                  <p className="text-gray-700">{selectedEmployeeDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setSelectedEmployeeDetail(null)} 
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
