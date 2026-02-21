import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    MessageSquare,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    X,
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    open: { label: 'Aberta', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    in_progress: { label: 'Em Análise', color: 'bg-amber-100 text-amber-700', icon: Clock },
    resolved: { label: 'Resolvida', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    closed: { label: 'Fechada', color: 'bg-slate-100 text-slate-700', icon: XCircle },
};

const typeLabels: Record<string, string> = {
    information: 'Informação',
    service: 'Serviço',
    complaint: 'Reclamação',
    approval: 'Aprovação',
    other: 'Outro',
};

const priorityLabels: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
    medium: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
    high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

export default function ClientRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [works, setWorks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        type: 'information',
        subject: '',
        description: '',
        workId: '',
        priority: 'medium',
    });

    const loadData = async () => {
        try {
            const [reqData, worksData] = await Promise.all([
                api.getClientMyRequests(),
                api.getClientMyWorks(),
            ]);
            setRequests(reqData || []);
            setWorks(worksData || []);
        } catch (err) {
            console.error('Erro ao carregar solicitações:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createClientRequest({
                type: form.type,
                subject: form.subject,
                description: form.description,
                workId: form.workId || undefined,
                priority: form.priority,
            });
            toast.success('Solicitação criada com sucesso!');
            setShowDialog(false);
            setForm({ type: 'information', subject: '', description: '', workId: '', priority: 'medium' });
            setIsLoading(true);
            await loadData();
        } catch (err) {
            toast.error('Erro ao criar solicitação');
        } finally {
            setSubmitting(false);
        }
    };

    const openCount = requests.filter(r => r.status === 'open').length;
    const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
    const resolvedCount = requests.filter(r => r.status === 'resolved').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Solicitações</h1>
                    <p className="text-slate-500">Envie e acompanhe suas solicitações</p>
                </div>
                <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => setShowDialog(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Solicitação
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{openCount}</p>
                            <p className="text-sm text-slate-500">Abertas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{inProgressCount}</p>
                            <p className="text-sm text-slate-500">Em Análise</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{resolvedCount}</p>
                            <p className="text-sm text-slate-500">Resolvidas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhuma solicitação encontrada</p>
                        <p className="text-sm text-slate-400 mt-1">Clique em "Nova Solicitação" para enviar uma</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requests.map((req: any) => {
                        const status = statusConfig[req.status] || statusConfig.open;
                        const StatusIcon = status.icon;
                        return (
                            <Card key={req.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.color}`}>
                                                <StatusIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{req.subject}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline">{typeLabels[req.type] || req.type}</Badge>
                                                    <Badge className={priorityLabels[req.priority]?.color || 'bg-slate-100'}>
                                                        {priorityLabels[req.priority]?.label || req.priority}
                                                    </Badge>
                                                    <Badge className={status.color}>{status.label}</Badge>
                                                </div>
                                                <p className="text-slate-600 mt-3">{req.description}</p>
                                                {req.work && (
                                                    <p className="text-sm text-slate-400 mt-2">📋 Obra: {req.work.code} — {req.work.title}</p>
                                                )}
                                                <p className="text-xs text-slate-400 mt-2">
                                                    Criada em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {req.adminResponse && (
                                        <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <p className="text-sm font-medium text-emerald-800">Resposta da equipe:</p>
                                            <p className="text-sm text-emerald-700 mt-1">{req.adminResponse}</p>
                                            {req.respondedAt && (
                                                <p className="text-xs text-emerald-500 mt-2">
                                                    Respondida em {new Date(req.respondedAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Dialog: Nova Solicitação */}
            {showDialog && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Nova Solicitação</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowDialog(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <select
                                        className="w-full border rounded-md px-3 py-2 text-sm"
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    >
                                        <option value="information">Informação</option>
                                        <option value="service">Serviço</option>
                                        <option value="complaint">Reclamação</option>
                                        <option value="approval">Aprovação</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Prioridade</Label>
                                    <select
                                        className="w-full border rounded-md px-3 py-2 text-sm"
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>

                                {works.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Obra (opcional)</Label>
                                        <select
                                            className="w-full border rounded-md px-3 py-2 text-sm"
                                            value={form.workId}
                                            onChange={(e) => setForm({ ...form, workId: e.target.value })}
                                        >
                                            <option value="">Não vinculada a uma obra</option>
                                            {works.map((w: any) => (
                                                <option key={w.id} value={w.id}>{w.code} — {w.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Assunto</Label>
                                    <Input
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        placeholder="Resumo da solicitação"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Descreva sua solicitação em detalhes..."
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" disabled={submitting}>
                                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Enviar Solicitação
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
