import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  FileText,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const myWorks = [
  { id: '1', code: 'OB-2024-001', title: 'Instalação Elétrica Residencial', progress: 75, status: 'in_progress', address: 'Rua das Flores, 123' },
];

const notifications = [
  { id: '1', title: 'Obra atualizada', message: 'A obra OB-2024-001 teve progresso atualizado para 75%', date: '2024-06-15' },
  { id: '2', title: 'Nova tarefa concluída', message: 'Instalação do quadro elétrico foi concluída', date: '2024-06-10' },
];

export default function ClientDashboard() {
  const [stats] = useState({
    totalWorks: 1,
    completedWorks: 0,
    pendingApprovals: 1,
    documents: 3,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bem-vindo!</h1>
        <p className="text-slate-500">Acompanhe suas obras em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalWorks}</p>
              <p className="text-sm text-slate-500">Minhas Obras</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completedWorks}</p>
              <p className="text-sm text-slate-500">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
              <p className="text-sm text-slate-500">Aguardando Aprovação</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.documents}</p>
              <p className="text-sm text-slate-500">Documentos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Minhas Obras</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/client/works">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myWorks.map((work) => (
                <div key={work.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-medium text-slate-500">{work.code}</span>
                      <p className="font-medium">{work.title}</p>
                      <p className="text-sm text-slate-500">{work.address}</p>
                    </div>
                    <Badge variant="secondary">Em Andamento</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Progresso</span>
                      <span>{work.progress}%</span>
                    </div>
                    <Progress value={work.progress} className="h-2" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link to={`/client/works/${work.id}`}>Ver Detalhes</Link>
                    </Button>
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1">
                      Aprovar Etapa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium">{notif.title}</p>
                  <p className="text-sm text-slate-500">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(notif.date).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
