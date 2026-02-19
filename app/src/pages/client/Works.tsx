import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  ArrowRight,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import type { Work } from '@/types';

const mockWorks: Work[] = [
  {
    id: '1',
    code: 'OB-2024-001',
    title: 'Instalação Elétrica Residencial',
    description: 'Instalação elétrica completa para residência de 200m².',
    client: { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-9999', hasPortalAccess: true, createdAt: '2024-01-01', segment: 'residential', type: 'individual' },
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
  },
];

export default function ClientWorks() {
  const [works] = useState<Work[]>(mockWorks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Minhas Obras</h1>
        <p className="text-slate-500">Acompanhe o progresso das suas obras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{works.length}</p>
              <p className="text-sm text-slate-500">Obras em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-slate-500">Vistorias Agendadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-slate-500">Aguardando Aprovação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {works.map((work) => (
          <Card key={work.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-slate-500">{work.code}</span>
                    <Badge variant="secondary">Em Andamento</Badge>
                  </div>
                  <h3 className="text-xl font-bold">{work.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    {work.address}, {work.city} - {work.state}
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/client/works/${work.id}`}>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Progresso da Obra</span>
                  <span className="font-medium">{work.progress}%</span>
                </div>
                <Progress value={work.progress} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Data de Início</p>
                  <p className="font-medium">{work.startDate ? new Date(work.startDate).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Prazo Estimado</p>
                  <p className="font-medium">{work.estimatedDeadline ? new Date(work.estimatedDeadline).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Valor</p>
                  <p className="font-medium">R$ {work.estimatedValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
