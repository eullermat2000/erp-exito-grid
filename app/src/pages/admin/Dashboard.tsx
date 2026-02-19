import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  ClipboardList, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  Cell
} from 'recharts';

const revenueData = [
  { month: 'Jan', value: 45000 },
  { month: 'Fev', value: 52000 },
  { month: 'Mar', value: 48000 },
  { month: 'Abr', value: 61000 },
  { month: 'Mai', value: 55000 },
  { month: 'Jun', value: 67000 },
];

const worksByStatus = [
  { name: 'Em Andamento', value: 12, color: '#3b82f6' },
  { name: 'Concluídas', value: 8, color: '#10b981' },
  { name: 'Pendentes', value: 5, color: '#f59e0b' },
  { name: 'Canceladas', value: 2, color: '#ef4444' },
];

const recentWorks = [
  { id: '1', code: 'OB-2024-001', title: 'Instalação Elétrica Residencial', client: 'João Silva', progress: 75, status: 'in_progress' },
  { id: '2', code: 'OB-2024-002', title: 'Projeto Comercial Shopping', client: 'Maria Empreendimentos', progress: 30, status: 'in_progress' },
  { id: '3', code: 'OB-2024-003', title: 'Manutenção Industrial', client: 'Indústria ABC', progress: 100, status: 'completed' },
  { id: '4', code: 'OB-2024-004', title: 'Instalação Predial', client: 'Condomínio Vista', progress: 0, status: 'pending' },
];

const pendingTasks = [
  { id: '1', title: 'Aprovar proposta #PROP-2024-045', deadline: 'Hoje', priority: 'high' },
  { id: '2', title: 'Revisar documentação protocolo Neoenergia', deadline: 'Amanhã', priority: 'medium' },
  { id: '3', title: 'Agendar vistoria obra OB-2024-001', deadline: 'Em 2 dias', priority: 'low' },
];

export default function AdminDashboard() {
  const [stats] = useState({
    totalWorks: 27,
    activeWorks: 12,
    pendingTasks: 8,
    monthlyRevenue: 67000,
    opportunitiesCount: 15,
    conversionRate: 68,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Administrativo</h1>
          <p className="text-slate-500">Visão geral do sistema</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Histórico
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
            <Plus className="w-4 h-4 mr-2" />
            Nova Obra
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total de Obras</CardTitle>
            <Building2 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorks}</div>
            <p className="text-xs text-slate-500">+3 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Obras Ativas</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWorks}</div>
            <p className="text-xs text-slate-500">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tarefas Pendentes</CardTitle>
            <ClipboardList className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-slate-500">Aguardando ação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Faturamento Mensal</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Faturamento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Works by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Obras por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={worksByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {worksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {worksByStatus.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Works */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Obras Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/works">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentWorks.map((work) => (
                <div key={work.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">{work.code}</span>
                      <Badge variant={work.status === 'completed' ? 'default' : work.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {work.status === 'completed' ? 'Concluída' : work.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-900">{work.title}</p>
                    <p className="text-sm text-slate-500">{work.client}</p>
                  </div>
                  <div className="w-24">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{work.progress}%</span>
                    </div>
                    <Progress value={work.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Tarefas Pendentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/tasks">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500">Prazo: {task.deadline}</p>
                  </div>
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
