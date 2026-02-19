import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EditWorkDialog from '@/components/EditWorkDialog';
import WorkProgressDialog from '@/components/WorkProgressDialog';
import DeleteWorkDialog from '@/components/DeleteWorkDialog';
import {
  ArrowLeft,
  Edit,
  Clock,
  CheckCircle2,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Plus,
  CircleDot,
  Loader2,
  Trash2,
  Building2,
  ListTodo,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import { MeasurementDialog } from '@/components/MeasurementDialog';
import { toast } from 'sonner';
import { api } from '@/api';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-slate-500' },
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-amber-500' },
  approved: { label: 'Aprovada', color: 'bg-blue-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-600' },
  on_hold: { label: 'Pausada', color: 'bg-orange-500' },
  waiting_utility: { label: 'Aguardando Concessionária', color: 'bg-orange-400' },
  waiting_client: { label: 'Aguardando Cliente', color: 'bg-purple-500' },
  completed: { label: 'Concluída', color: 'bg-emerald-500' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500' },
};

const typeLabels: Record<string, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  pde_bt: 'PDE BT',
  pde_at: 'PDE AT',
  project_bt: 'Projeto BT',
  project_mt: 'Projeto MT',
  project_at: 'Projeto AT',
  solar: 'Solar',
  network_donation: 'Doação de Rede',
  network_work: 'Obra de Rede',
  report: 'Laudo',
  spda: 'SPDA',
  grounding: 'Aterramento',
  maintenance: 'Manutenção',
};

const taskStatusConfig: Record<string, { label: string; icon: any; color: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pendente', icon: CircleDot, color: 'text-yellow-500', badgeVariant: 'outline' },
  in_progress: { label: 'Em Andamento', icon: Clock, color: 'text-blue-500', badgeVariant: 'secondary' },
  completed: { label: 'Concluída', icon: CheckCircle, color: 'text-emerald-500', badgeVariant: 'default' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: 'text-red-500', badgeVariant: 'destructive' },
};

const taskPriorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-slate-500' },
  medium: { label: 'Média', color: 'text-amber-500' },
  high: { label: 'Alta', color: 'text-red-500' },
  urgent: { label: 'Urgente', color: 'text-red-700' },
};

export default function AdminWorkDetail() {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [isClientViewerOpen, setIsClientViewerOpen] = useState(false);
  const [isMeasurementDialogOpen, setIsMeasurementDialogOpen] = useState(false);

  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedHours: '',
  });
  const [taskLoading, setTaskLoading] = useState(false);

  const fetchWork = async () => {
    if (!id) return;
    try {
      const data = await api.getWork(id);
      setWork(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar obra.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdates = async () => {
    if (!id) return;
    try {
      const data = await api.getWorkUpdates(id);
      setUpdates(Array.isArray(data) ? data : []);
    } catch {
      setUpdates([]);
    }
  };

  const fetchTasks = async () => {
    if (!id) return;
    try {
      const data = await api.getTasksByWork(id);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchWork();
    fetchUpdates();
    fetchTasks();
  }, [id]);

  const handleRefresh = () => {
    fetchWork();
    fetchUpdates();
    fetchTasks();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Título é obrigatório.');
      return;
    }
    setTaskLoading(true);
    try {
      await api.createTask({
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority,
        estimatedHours: newTask.estimatedHours ? Number(newTask.estimatedHours) : undefined,
        workId: id,
      });
      toast.success('Tarefa criada com sucesso!');
      setNewTaskOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', estimatedHours: '' });
      handleRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar tarefa.');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tasks/${taskId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('electraflow_token')}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (!response.ok) throw new Error('Erro');
      toast.success('Tarefa concluída! Progresso atualizado.');
      handleRefresh();
    } catch {
      toast.error('Erro ao concluir tarefa.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      toast.success('Tarefa removida.');
      handleRefresh();
    } catch {
      toast.error('Erro ao remover tarefa.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-3 text-slate-500">Carregando obra...</span>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="text-center py-24 text-slate-500">
        <p className="text-lg">Obra não encontrada.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/admin/works">Voltar</Link>
        </Button>
      </div>
    );
  }

  const status = statusLabels[work.status] || { label: work.status, color: 'bg-slate-500' };
  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/admin/works">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{work.title}</h1>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
            <p className="text-slate-500">{work.code || '—'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            onClick={() => setProgressOpen(true)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Atualizar Progresso
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Progresso da Obra</p>
              <p className="text-3xl font-bold">{work.progress || 0}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Tarefas Concluídas</p>
              <p className="text-xl font-semibold">
                {completedTasks} de {tasks.length}
              </p>
            </div>
          </div>
          <Progress value={work.progress || 0} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas ({tasks.length})</TabsTrigger>
          <TabsTrigger value="updates">Atualizações ({updates.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Informações Tab */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dados da Obra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Tipo</p>
                    <p className="font-medium">{typeLabels[work.type] || work.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Valor Total</p>
                    <p className="font-medium">R$ {Number(work.totalValue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Endereço</p>
                    <p className="font-medium">{work.address || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Cidade / UF</p>
                    <p className="font-medium">{[work.city, work.state].filter(Boolean).join(' - ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Data de Início</p>
                    <p className="font-medium">{work.startDate ? new Date(work.startDate).toLocaleDateString('pt-BR') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Criada em</p>
                    <p className="font-medium">{new Date(work.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {work.description && (
                  <div>
                    <p className="text-sm text-slate-500">Descrição</p>
                    <p className="text-slate-700">{work.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Dados do Cliente
                  </div>
                  {work.client && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-bold border-amber-200 text-amber-600 hover:bg-amber-50"
                      onClick={() => setIsClientViewerOpen(true)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Visualizar Detalhes
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {work.client ? (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-amber-500 text-slate-900">
                          {work.client.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{work.client.name}</p>
                        {work.client.company && (
                          <p className="text-sm text-slate-500">{work.client.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {work.client.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{work.client.phone}</span>
                        </div>
                      )}
                      {work.client.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{work.client.email}</span>
                        </div>
                      )}
                      {(work.client.address || work.client.city) && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>
                            {[work.client.address, work.client.city, work.client.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400">Nenhum cliente vinculado.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tarefas Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Etapas / Tarefas da Obra</h3>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
              onClick={() => setNewTaskOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>

          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-400">
                <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Nenhuma tarefa cadastrada para esta obra.</p>
                <p className="text-sm mt-1">Crie tarefas para acompanhar as etapas da obra.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any, index: number) => {
                const taskStatus = taskStatusConfig[task.status] || taskStatusConfig.pending;
                const TaskIcon = taskStatus.icon;
                const priority = taskPriorityLabels[task.priority] || taskPriorityLabels.medium;

                return (
                  <Card key={task.id} className={task.status === 'completed' ? 'opacity-70' : ''}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <TaskIcon className={`w-5 h-5 ${taskStatus.color}`} />
                        <div>
                          <p className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={taskStatus.badgeVariant} className="text-xs">
                              {taskStatus.label}
                            </Badge>
                            <span className={`text-xs font-medium ${priority.color}`}>
                              • {priority.label}
                            </span>
                            {task.estimatedHours && (
                              <span className="text-xs text-slate-400">
                                • {task.estimatedHours}h estimadas
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Concluir
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Atualizações Tab */}
        <TabsContent value="updates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Atualizações de Progresso</h3>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
              onClick={() => setProgressOpen(true)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Nova Atualização
            </Button>
          </div>
          {updates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Nenhuma atualização registrada.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {updates.map((update: any) => (
                <Card key={update.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{update.progress}%</Badge>
                          <span className="text-sm text-slate-400">
                            {new Date(update.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700">{update.description}</p>
                        {update.imageUrl && (
                          <img
                            src={`${API_BASE}${update.imageUrl}`}
                            alt="Atualização"
                            className="mt-3 rounded-lg border max-h-64 object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Histórico da Obra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Obra criada</p>
                    <p className="text-sm text-slate-500">{new Date(work.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {work.startDate && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Data de início definida</p>
                      <p className="text-sm text-slate-500">{new Date(work.startDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                )}
                {tasks.filter((t: any) => t.status === 'completed').map((task: any) => (
                  <div className="flex gap-4" key={`task-${task.id}`}>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Tarefa concluída: {task.title}</p>
                      <p className="text-sm text-slate-500">
                        {task.completedAt ? new Date(task.completedAt).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                  </div>
                ))}
                {updates.map((update: any) => (
                  <div className="flex gap-4" key={`update-${update.id}`}>
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Progresso atualizado para {update.progress}%</p>
                      <p className="text-sm text-slate-500">
                        {new Date(update.createdAt).toLocaleDateString('pt-BR')} — {update.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {
        editOpen && (
          <EditWorkDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            work={work}
            onWorkUpdated={handleRefresh}
          />
        )
      }

      {
        progressOpen && (
          <WorkProgressDialog
            open={progressOpen}
            onOpenChange={setProgressOpen}
            work={work}
            onProgressUpdated={handleRefresh}
          />
        )
      }

      {
        deleteOpen && (
          <DeleteWorkDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            work={work}
            onWorkDeleted={() => window.location.href = '/admin/works'}
          />
        )
      }

      {/* New Task Dialog */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <Label htmlFor="task-title">Título da Tarefa *</Label>
              <Input
                id="task-title"
                placeholder="Ex: Instalação do quadro de distribuição"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="task-desc">Descrição</Label>
              <Textarea
                id="task-desc"
                placeholder="Descreva os detalhes da tarefa..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(val) => setNewTask({ ...newTask, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-hours">Horas Estimadas</Label>
                <Input
                  id="task-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Ex: 4"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewTaskOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                disabled={taskLoading}
              >
                {taskLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Criar Tarefa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ClientDetailViewer
        open={isClientViewerOpen}
        onOpenChange={setIsClientViewerOpen}
        client={work.client}
      />
      <MeasurementDialog
        isOpen={isMeasurementDialogOpen}
        onClose={() => setIsMeasurementDialogOpen(false)}
        workId={id!}
        onSuccess={fetchWork}
      />
    </div>
  );
}
