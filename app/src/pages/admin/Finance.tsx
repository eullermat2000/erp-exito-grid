import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Loader2,
  Edit2,
  Trash2,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '@/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORY_COLORS: Record<string, string> = {
  materials: '#ef4444',
  labor: '#f59e0b',
  equipment: '#8b5cf6',
  tax: '#3b82f6',
  office: '#10b981',
  project: '#06b6d4',
  utilities: '#64748b',
  marketing: '#eab308',
  other: '#94a3b8',
};

export default function AdminFinance() {
  const [summary, setSummary] = useState<any>(null);
  const [dre, setDre] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [formData, setFormData] = useState<any>({
    description: '',
    amount: '',
    type: 'income',
    category: 'other',
    dueDate: '',
    billingDate: '',
    scheduledPaymentDate: '',
    workId: '',
    taxWithholding: '0',
    taxCost: '0',
    notes: '',
  });

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [registerData, setRegisterData] = useState({
    amount: 0,
    method: 'transfer',
    transactionId: '',
  });

  useEffect(() => {
    loadData();
    loadWorks();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, dreData, paymentsData] = await Promise.all([
        api.getFinanceSummary(),
        api.getDREReport(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          new Date().toISOString()
        ),
        api.getPayments(),
      ]);
      setSummary(sum);
      setDre(dreData);
      setPayments(paymentsData);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados financeiros.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorks = async () => {
    try {
      const data = await api.getWorks();
      setWorks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (payment: any) => {
    setEditingPaymentId(payment.id);
    setFormData({
      description: payment.description,
      amount: payment.amount.toString(),
      type: payment.type,
      category: payment.category,
      dueDate: payment.dueDate.split('T')[0],
      billingDate: payment.billingDate?.split('T')[0] || '',
      scheduledPaymentDate: payment.scheduledPaymentDate?.split('T')[0] || '',
      workId: payment.workId || '',
      taxWithholding: (payment.taxWithholding || 0).toString(),
      taxCost: (payment.taxCost || 0).toString(),
      notes: payment.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este lançamento?')) return;
    try {
      await api.deletePayment(id);
      toast.success('Lançamento removido com sucesso!');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover lançamento.');
    }
  };

  const handleOpenRegister = (payment: any) => {
    setSelectedPayment(payment);
    setRegisterData({
      amount: payment.amount,
      method: 'transfer',
      transactionId: '',
    });
    setIsRegisterDialogOpen(true);
  };

  const handleRegisterPayment = async () => {
    if (!selectedPayment) return;
    try {
      await api.registerPayment(selectedPayment.id, registerData);
      toast.success('Baixa realizada com sucesso!');
      setIsRegisterDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao realizar baixa.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPaymentId) {
        await api.updatePayment(editingPaymentId, {
          ...formData,
          amount: Number(formData.amount),
          taxWithholding: Number(formData.taxWithholding),
          taxCost: Number(formData.taxCost),
        });
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        await api.createPayment({
          ...formData,
          amount: Number(formData.amount),
          taxWithholding: Number(formData.taxWithholding),
          taxCost: Number(formData.taxCost),
        });
        toast.success('Lançamento realizado com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingPaymentId(null);
      setFormData({
        description: '',
        amount: '',
        type: 'income',
        category: 'other',
        dueDate: '',
        billingDate: '',
        scheduledPaymentDate: '',
        workId: '',
        taxWithholding: '0',
        taxCost: '0',
        notes: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar lançamento.');
    }
  };

  const revenueVsExpense = [
    { name: 'Receitas', value: summary?.receivedThisMonth || 0 },
    { name: 'Despesas', value: summary?.paidThisMonth || 0 },
  ];

  const expenseByCategory = dre?.expense ? Object.entries(dre.expense).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number(value),
    key: name,
  })) : [];

  const filteredPayments = activeTab === 'overview'
    ? payments
    : payments.filter(p => p.type === (activeTab === 'receivable' ? 'income' : 'expense'));

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Carregando financeiro...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro Profissional</h1>
          <p className="text-slate-500">Gestão de fluxo de caixa, DRE e medições</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>Atualizar</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita (Contas a Receber)</SelectItem>
                        <SelectItem value="expense">Despesa (Contas a Pagar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="materials">Materiais</SelectItem>
                        <SelectItem value="labor">Mão de Obra</SelectItem>
                        <SelectItem value="equipment">Equipamentos</SelectItem>
                        <SelectItem value="tax">Impostos</SelectItem>
                        <SelectItem value="office">Escritório</SelectItem>
                        <SelectItem value="project">Projeto</SelectItem>
                        <SelectItem value="utilities">Utilidades</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workId">Obra/Projeto Relacionado</Label>
                    <Select
                      value={formData.workId}
                      onValueChange={(v) => setFormData({ ...formData, workId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma obra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {works.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Data de Vencimento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingDate">Data de Faturamento</Label>
                    <Input
                      id="billingDate"
                      type="date"
                      value={formData.billingDate}
                      onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Pagamento Programado</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={formData.scheduledPaymentDate}
                      onChange={(e) => setFormData({ ...formData, scheduledPaymentDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxWithholding">Retenção de NF (R$)</Label>
                    <Input
                      id="taxWithholding"
                      type="number"
                      step="0.01"
                      value={formData.taxWithholding}
                      onChange={(e) => setFormData({ ...formData, taxWithholding: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Salvar Lançamento</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
          <TabsTrigger value="payable">A Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Saldo Atual</CardTitle>
                <Wallet className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  R$ {(summary?.currentBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Receitas</CardTitle>
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  R$ {(summary?.receivedThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">Neste mês</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Despesas</CardTitle>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">
                  R$ {(summary?.paidThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">Neste mês</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Lucro Projetado</CardTitle>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {(summary?.projectedProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueVsExpense}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} />
                      <Tooltip
                        formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {revenueVsExpense.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[expenseByCategory[index].key] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {expenseByCategory.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.key] || '#94a3b8' }} />
                        <span className="text-xs text-slate-500">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Demonstrativo de Resultados (DRE)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[300px]">Item</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">% Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-bold bg-emerald-50/30">
                    <TableCell className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      Receita Operacional Bruta
                    </TableCell>
                    <TableCell className="text-right">R$ {(dre?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="pl-8 text-slate-500 italic">(-) Impostos e Deduções</TableCell>
                    <TableCell className="text-right text-rose-500">R$ {(dre?.taxes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-slate-400">
                      {dre?.revenue > 0 ? `${((dre.taxes / dre.revenue) * 100).toFixed(1)}%` : '0%'}
                    </TableCell>
                  </TableRow>

                  <TableRow className="font-semibold bg-slate-50/50">
                    <TableCell className="pl-4">(=) Receita Líquida</TableCell>
                    <TableCell className="text-right">R$ {(dre?.netRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      {dre?.revenue > 0 ? `${((dre.netRevenue / dre.revenue) * 100).toFixed(1)}%` : '0%'}
                    </TableCell>
                  </TableRow>

                  {expenseByCategory.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-8 text-slate-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.key] || '#94a3b8' }} />
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right text-rose-500">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-slate-400">
                        {dre?.revenue > 0 ? `${((item.value / dre.revenue) * 100).toFixed(1)}%` : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="font-bold border-t-2 border-slate-200 bg-amber-50/30">
                    <TableCell className="flex items-center gap-2 uppercase tracking-tight">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      Lucro Líquido do Período
                    </TableCell>
                    <TableCell className="text-right text-lg text-amber-600">R$ {(dre?.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-medium text-amber-600">
                      {dre?.revenue > 0 ? `${((dre.netProfit / dre.revenue) * 100).toFixed(1)}%` : '0%'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivable" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contas a Receber</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Buscar recebimentos..." className="pl-9 w-[300px]" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Obra/Projeto</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Nenhum recebimento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>{payment.work?.title || '-'}</TableCell>
                        <TableCell>{new Date(payment.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-emerald-600 font-semibold">
                          R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {payment.status === 'paid' ? 'Recebido' :
                              payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              {payment.status !== 'paid' && (
                                <DropdownMenuItem onClick={() => handleOpenRegister(payment)}>
                                  <CheckCircle className="w-4 h-4 mr-2" /> {payment.type === 'income' ? 'Baixar' : 'Dar Baixa'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(payment)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(payment.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payable" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contas a Pagar</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Buscar despesas..." className="pl-9 w-[300px]" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Nenhuma despesa encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[payment.category] || '#94a3b8' }} />
                            {payment.category.charAt(0).toUpperCase() + payment.category.slice(1)}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(payment.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-rose-600 font-semibold">
                          R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {payment.status === 'paid' ? 'Pago' :
                              payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Gerenciar</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Baixa - {selectedPayment?.description}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reg-amount">Valor Pago/Recebido</Label>
              <Input
                id="reg-amount"
                type="number"
                step="0.01"
                value={registerData.amount}
                onChange={(e) => setRegisterData({ ...registerData, amount: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-method">Método de Pagamento</Label>
              <Select
                value={registerData.method}
                onValueChange={(val) => setRegisterData({ ...registerData, method: val })}
              >
                <SelectTrigger id="reg-method">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-txid">ID da Transação / Comprovante (Opcional)</Label>
              <Input
                id="reg-txid"
                value={registerData.transactionId}
                onChange={(e) => setRegisterData({ ...registerData, transactionId: e.target.value })}
                placeholder="Ex: NSU, Autenticação, ID PIX..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRegisterPayment}>
              Confirmar Baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
