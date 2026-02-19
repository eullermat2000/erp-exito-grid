import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Kanban,
  Building2,
  ClipboardList,
  FileText,
  FileCheck,
  FolderOpen,
  Users,
  UserCircle,
  DollarSign,
  Settings,
  LogOut,
  Bell,
  Zap,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'commercial', 'engineer', 'finance'] },
  { path: '/admin/pipeline', label: 'Pipeline', icon: Kanban, roles: ['admin', 'commercial'] },
  { path: '/admin/works', label: 'Obras', icon: Building2, roles: ['admin', 'engineer', 'commercial'] },
  { path: '/admin/tasks', label: 'Tarefas', icon: ClipboardList, roles: ['admin', 'engineer', 'commercial'] },
  { path: '/admin/proposals', label: 'Propostas', icon: FileText, roles: ['admin', 'commercial'] },
  { path: '/admin/protocols', label: 'Protocolos', icon: FileCheck, roles: ['admin', 'engineer'] },
  { path: '/admin/documents', label: 'Documentos', icon: FolderOpen, roles: ['admin', 'engineer', 'commercial', 'finance'] },
  { path: '/admin/employees', label: 'Funcionários', icon: Users, roles: ['admin'] },
  { path: '/admin/users', label: 'Usuários', icon: Users, roles: ['admin'] },
  { path: '/admin/clients', label: 'Clientes', icon: UserCircle, roles: ['admin', 'commercial'] },
  { path: '/admin/finance', label: 'Financeiro', icon: DollarSign, roles: ['admin', 'finance'] },
  { path: '/admin/catalog', label: 'Catálogo', icon: Zap, roles: ['admin', 'commercial'] },
  { path: '/admin/settings', label: 'Configurações', icon: Settings, roles: ['admin'] },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ElectraFlow</h1>
              <p className="text-xs text-slate-400">ERP para Engenharia</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                      ? 'bg-amber-500 text-slate-900 font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-amber-500 text-slate-900 text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-slate-400">Administrador</p>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Área Administrativa
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
