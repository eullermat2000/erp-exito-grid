import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  UserCircle,
  CheckCircle2,
  Building2,
  Lock,
  Loader2,
  Eye,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/api';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';
import { ClientDialog } from '@/components/ClientDialog';
import { ClientDetailViewer } from '@/components/ClientDetailViewer';
import { toast } from 'sonner';

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este cliente?')) return;
    try {
      await api.deleteClient(id);
      toast.success('Cliente removido');
      loadClients();
    } catch (error) {
      toast.error('Erro ao remover cliente');
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document?.includes(searchTerm)
  );

  const portalAccessCount = clients.filter(c => c.hasPortalAccess).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-slate-500 font-medium">Carregando carteira de clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-500" />
            Clientes
          </h1>
          <p className="text-slate-500">Gestão centralizada de informações e documentos.</p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg"
          onClick={() => {
            setSelectedClient(undefined);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
              <p className="text-xs font-bold text-blue-600/60 uppercase">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-900">{portalAccessCount}</p>
              <p className="text-xs font-bold text-emerald-600/60 uppercase">Com Portal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shadow-inner">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">{clients.filter(c => c.type === 'company').length}</p>
              <p className="text-xs font-bold text-purple-600/60 uppercase">Empresas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shadow-inner">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">{clients.length - portalAccessCount}</p>
              <p className="text-xs font-bold text-amber-600/60 uppercase">Sem Acesso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, empresa ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 border-slate-200 focus:ring-amber-500 shadow-sm"
        />
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Cliente / ID</TableHead>
                <TableHead className="font-bold text-slate-700">Empresa</TableHead>
                <TableHead className="font-bold text-slate-700">Contato</TableHead>
                <TableHead className="font-bold text-slate-700">Localização</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-11 h-11 border-2 border-white shadow-md ring-1 ring-slate-100">
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold">
                          {client.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-700">{client.name}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-slate-300 hover:text-amber-500"
                            onClick={() => {
                              setViewingClient(client);
                              setIsViewerOpen(true);
                            }}
                            title="Abrir Central do Cliente"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{client.document || 'PF'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-600 truncate max-w-[180px]">{client.companyName || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        {client.phone || client.whatsapp || '-'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-600 font-medium">{client.city}, {client.state}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-bold text-[10px] uppercase px-2 shadow-sm border-none",
                      client.hasPortalAccess ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    )}>
                      {client.hasPortalAccess ? 'Portal Ativo' : 'Sem Acesso'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-500 group-hover:bg-amber-50 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 border-none shadow-2xl p-2 rounded-xl">
                        <DropdownMenuItem
                          className="rounded-lg gap-2 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600"
                          onClick={() => {
                            setViewingClient(client);
                            setIsViewerOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" /> Ver Central
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg gap-2 font-bold text-slate-600 focus:bg-slate-100"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" /> Editar Cadastro
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg gap-2 font-bold text-red-600 focus:bg-red-50 focus:text-red-600"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Excluir Cliente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-slate-400 italic">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadClients}
        client={selectedClient}
      />

      <ClientDetailViewer
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        client={viewingClient}
      />
    </div>
  );
}
