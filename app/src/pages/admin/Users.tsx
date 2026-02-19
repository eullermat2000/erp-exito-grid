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
    MoreHorizontal,
    Users,
    CheckCircle2,
    Loader2,
    Edit2,
    Trash2,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { api } from '@/api';
import type { User } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrador', color: 'bg-red-500' },
    commercial: { label: 'Comercial', color: 'bg-blue-500' },
    engineer: { label: 'Engenheiro', color: 'bg-emerald-500' },
    finance: { label: 'Financeiro', color: 'bg-purple-500' },
    viewer: { label: 'Visualizador', color: 'bg-slate-500' },
    employee: { label: 'Funcionário', color: 'bg-amber-500' },
    client: { label: 'Cliente', color: 'bg-cyan-500' },
};

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Deseja realmente remover o acesso deste usuário?')) {
            try {
                await api.deleteUser(id);
                toast.success('Acesso removido com sucesso');
                loadUsers();
            } catch (error) {
                toast.error('Erro ao remover usuário');
            }
        }
    };

    const filteredUsers = users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && users.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
                    <p className="text-slate-500">Controle de logins e permissões de acesso ao sistema</p>
                </div>
                <Button
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                    onClick={() => toast.info('Funcionalidade de criação em breve')}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-blue-50/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total de Acessos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.isActive).length}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Ativos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === 'admin').length}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Administradores</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-200"
                />
            </div>

            <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Usuário</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Nível de Acesso</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">E-mail de Login</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Status</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px]">Criado em</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                                                <AvatarFallback className="bg-slate-200 text-slate-600 font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-slate-700">{user.name}</p>
                                                <p className="text-xs text-slate-400">ID: {user.id.split('-')[0]}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("font-bold text-[10px] uppercase", roleLabels[user.role]?.color || "bg-slate-500")}>
                                            {roleLabels[user.role]?.label || user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            {user.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? "default" : "secondary"} className={cn(
                                            "font-bold text-[10px] uppercase",
                                            user.isActive ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {user.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-500">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => toast.info('Edição em breve')}>
                                                    <Edit2 className="w-4 h-4 mr-2" /> Editar Acesso
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user.id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Remover Acesso
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
