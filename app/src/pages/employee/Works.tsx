import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Building2,
  ArrowRight,
  Calendar,
  MapPin,
} from 'lucide-react';
import type { Work } from '@/types';

const mockWorks: Work[] = [
  {
    id: '1',
    code: 'OB-2024-001',
    title: 'Instalação Elétrica Residencial',
    client: { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-9999', hasPortalAccess: true, segment: 'residential', type: 'individual', createdAt: '2024-01-01' },
    type: 'residential',
    status: 'in_progress',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    estimatedValue: 25000,
    progress: 75,
    createdAt: '2024-01-15',
    updatedAt: '2024-06-15',
  },
  {
    id: '2',
    code: 'OB-2024-002',
    title: 'Projeto Comercial Shopping',
    client: { id: '2', name: 'Maria Empreendimentos', email: 'maria@emp.com', phone: '(11) 98888-8888', hasPortalAccess: true, segment: 'commercial', type: 'company', createdAt: '2024-01-10' },
    type: 'commercial',
    status: 'in_progress',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    estimatedValue: 120000,
    progress: 30,
    createdAt: '2024-02-01',
    updatedAt: '2024-06-14',
  },
];

export default function EmployeeWorks() {
  const [works] = useState<Work[]>(mockWorks);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWorks = works.filter((work) =>
    work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Minhas Obras</h1>
        <p className="text-slate-500">Obras atribuídas a você</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{works.length}</p>
              <p className="text-sm text-slate-500">Obras Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-slate-500">Vistorias Esta Semana</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-slate-500">Locais de Obra</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar obras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorks.map((work) => (
                <TableRow key={work.id}>
                  <TableCell className="font-medium">{work.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{work.title}</p>
                      <p className="text-sm text-slate-500">{work.city}, {work.state}</p>
                    </div>
                  </TableCell>
                  <TableCell>{work.client.name}</TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{work.progress}%</span>
                      </div>
                      <Progress value={work.progress} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/employee/works/${work.id}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
