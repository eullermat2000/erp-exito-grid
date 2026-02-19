import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Download,
} from 'lucide-react';
import type { Work, Task, Document } from '@/types';

const mockWork: Work = {
  id: '1',
  code: 'OB-2024-001',
  title: 'Instalação Elétrica Residencial',
  description: 'Instalação elétrica completa para residência de 200m², incluindo quadro de distribuição, tomadas, interruptores e iluminação.',
  client: {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    hasPortalAccess: true,
    segment: 'residential',
    type: 'individual',
    createdAt: '2024-01-01'
  },
  type: 'residential',
  status: 'in_progress',
  address: 'Rua das Flores, 123',
  city: 'São Paulo',
  state: 'SP',
  estimatedValue: 25000,
  progress: 75,
  startDate: '2024-01-20',
  estimatedDeadline: '2024-03-20',
  createdAt: '2024-01-15',
  updatedAt: '2024-06-15',
};

const mockTasks: Task[] = [
  { id: '1', title: 'Vistoria inicial', status: 'completed', priority: 'high', createdAt: '2024-01-15', updatedAt: '2024-01-20' },
  { id: '2', title: 'Instalação do quadro de distribuição', status: 'completed', priority: 'high', createdAt: '2024-01-20', updatedAt: '2024-02-05' },
  { id: '3', title: 'Instalação de tomadas', status: 'completed', priority: 'medium', createdAt: '2024-02-05', updatedAt: '2024-02-20' },
  { id: '4', title: 'Instalação de iluminação', status: 'in_progress', priority: 'medium', createdAt: '2024-02-20', updatedAt: '2024-03-01' },
  { id: '5', title: 'Testes finais', status: 'pending', priority: 'high', createdAt: '2024-03-01', updatedAt: '2024-03-01' },
];

const mockDocuments: Document[] = [
  { id: '1', name: 'Projeto Elétrico.pdf', fileName: 'projeto.pdf', type: 'project', mimeType: 'application/pdf', size: 2500000, createdAt: '2024-01-16', updatedAt: '2024-01-16', url: '#', version: 1 },
  { id: '2', name: 'Contrato de Serviço.pdf', fileName: 'contrato.pdf', type: 'contract', mimeType: 'application/pdf', size: 1500000, createdAt: '2024-01-18', updatedAt: '2024-01-18', url: '#', version: 1 },
  { id: '3', name: 'ART - Responsabilidade Técnica.pdf', fileName: 'art.pdf', type: 'other' as any, mimeType: 'application/pdf', size: 800000, createdAt: '2024-01-19', updatedAt: '2024-01-19', url: '#', version: 1 },
];

const taskStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
};

export default function ClientWorkDetail() {
  useParams();
  const [work] = useState<Work>(mockWork);
  const [tasks] = useState<Task[]>(mockTasks);
  const [documents] = useState<Document[]>(mockDocuments);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/client/works">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{work.title}</h1>
              <Badge variant="secondary">Em Andamento</Badge>
            </div>
            <p className="text-slate-500">{work.code}</p>
          </div>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Aprovar Etapa Atual
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Progresso da Obra</p>
              <p className="text-3xl font-bold">{work.progress}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Tarefas Concluídas</p>
              <p className="text-xl font-semibold">{completedTasks} de {tasks.length}</p>
            </div>
          </div>
          <Progress value={work.progress} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="tasks">Etapas ({tasks.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados da Obra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Descrição</p>
                  <p className="text-slate-700">{work.description}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Endereço</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {work.address}, {work.city} - {work.state}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Data de Início</p>
                    <p className="font-medium">{work.startDate ? new Date(work.startDate).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Prazo Estimado</p>
                    <p className="font-medium">{work.estimatedDeadline ? new Date(work.estimatedDeadline).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Valor do Projeto</p>
                  <p className="font-medium text-lg">R$ {work.estimatedValue.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">Para dúvidas sobre esta obra, entre em contato:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>(11) 99999-9999</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>contato@electraflow.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <h3 className="text-lg font-semibold">Etapas da Obra</h3>
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <Card key={task.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                      {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <Badge variant={taskStatusLabels[task.status].variant}>
                        {taskStatusLabels[task.status].label}
                      </Badge>
                    </div>
                  </div>
                  {task.status === 'in_progress' && (
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      Aprovar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <h3 className="text-lg font-semibold mb-4">Documentos da Obra</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-slate-400">
                        {(doc.size || 0) / 1024 / 1024 < 1 ? ((doc.size || 0) / 1024).toFixed(0) + ' KB' : ((doc.size || 0) / 1024 / 1024).toFixed(2) + ' MB'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
