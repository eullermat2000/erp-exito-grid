import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Receipt,
    Upload,
    Shield,
    FileText,
    Package,
    Wrench,
    Plus,
    MoreVertical,
    Eye,
    XCircle,
    Download,
    CheckCircle,
    AlertTriangle,
    Clock,
    Ban,
    Search,
    Building2,
    KeyRound,
    Trash2,
    Loader2,
    Wifi,
    RefreshCw,
    FileCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700', icon: Clock },
    processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
    authorized: { label: 'Autorizada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: Ban },
    error: { label: 'Erro', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
};

const fmt = (v: number) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminFiscal() {
    const [activeTab, setActiveTab] = useState('invoices');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Emissão
    const [selectedProposal, setSelectedProposal] = useState<string>('');
    const [preview, setPreview] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [emitting, setEmitting] = useState(false);
    const [naturezaOperacao, setNaturezaOperacao] = useState('Venda de mercadoria');
    const [finalidadeNfe, setFinalidadeNfe] = useState(1);
    const [cfopCode, setCfopCode] = useState('');
    const [naturezas, setNaturezas] = useState<Record<string, string>>({});

    // Config
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPassword, setCertPassword] = useState('');
    const [uploadingCert, setUploadingCert] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [configForm, setConfigForm] = useState({
        companyName: '',
        cnpj: '',
        stateRegistration: '',
        municipalRegistration: '',
        companyAddress: '',
        companyCity: '',
        companyState: '',
        companyCep: '',
        canInvoiceMaterial: false,
        canInvoiceService: false,
        // Configuração Tributária
        regimeTributario: '1',
        simplesAnexo: '',
        crt: 1,
        aliquotaIss: 5,
        codigoServico: '',
        codigoTribNacional: '01.01.01',
        cnae: '',
        codigoMunicipio: '',
        nomeMunicipio: '',
        retIss: false,
        retIrpj: false,
        aliquotaIrpj: 1.5,
        retCsll: false,
        aliquotaCsll: 1.0,
        retPis: false,
        aliquotaPis: 0.65,
        retCofins: false,
        aliquotaCofins: 3.0,
        retInss: false,
        aliquotaInss: 11.0,
        cno: '',
        regEspTrib: '',
        // API
        fiscalApiProvider: 'nuvem_fiscal',
        fiscalApiClientId: '',
        fiscalApiClientSecret: '',
        fiscalApiEnvironment: 'sandbox',
    });
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionResult, setConnectionResult] = useState<any>(null);
    const [syncing, setSyncing] = useState(false);

    // Cancel dialog
    const [cancelDialog, setCancelDialog] = useState(false);
    const [cancelId, setCancelId] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    // Detail dialog
    const [detailDialog, setDetailDialog] = useState(false);
    const [detailInvoice, setDetailInvoice] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [inv, cfg, props, nats] = await Promise.all([
                api.getFiscalInvoices().catch(() => []),
                api.getFiscalConfig().catch(() => null),
                api.getProposals('accepted').catch(() => []),
                api.getNaturezasOperacao().catch(() => ({})),
            ]);
            setInvoices(inv);
            setNaturezas(nats);
            if (cfg) {
                setConfig(cfg);
                setConfigForm({
                    companyName: cfg.companyName || '',
                    cnpj: cfg.cnpj || '',
                    stateRegistration: cfg.stateRegistration || '',
                    municipalRegistration: cfg.municipalRegistration || '',
                    companyAddress: cfg.companyAddress || '',
                    companyCity: cfg.companyCity || '',
                    companyState: cfg.companyState || '',
                    companyCep: cfg.companyCep || '',
                    canInvoiceMaterial: cfg.canInvoiceMaterial || false,
                    canInvoiceService: cfg.canInvoiceService || false,
                    // Tributária
                    regimeTributario: cfg.regimeTributario || '1',
                    simplesAnexo: cfg.simplesAnexo || '',
                    crt: cfg.crt || 1,
                    aliquotaIss: cfg.aliquotaIss ?? 5,
                    codigoServico: cfg.codigoServico || '',
                    codigoTribNacional: cfg.codigoTribNacional || '01.01.01',
                    cnae: cfg.cnae || '',
                    codigoMunicipio: cfg.codigoMunicipio || '',
                    nomeMunicipio: cfg.nomeMunicipio || '',
                    retIss: cfg.retIss || false,
                    retIrpj: cfg.retIrpj || false,
                    aliquotaIrpj: cfg.aliquotaIrpj ?? 1.5,
                    retCsll: cfg.retCsll || false,
                    aliquotaCsll: cfg.aliquotaCsll ?? 1.0,
                    retPis: cfg.retPis || false,
                    aliquotaPis: cfg.aliquotaPis ?? 0.65,
                    retCofins: cfg.retCofins || false,
                    aliquotaCofins: cfg.aliquotaCofins ?? 3.0,
                    retInss: cfg.retInss || false,
                    aliquotaInss: cfg.aliquotaInss ?? 11.0,
                    cno: cfg.cno || '',
                    regEspTrib: cfg.regEspTrib != null ? String(cfg.regEspTrib) : '',
                    // API
                    fiscalApiProvider: cfg.fiscalApiProvider || 'nuvem_fiscal',
                    fiscalApiClientId: cfg.fiscalApiClientId || '',
                    fiscalApiClientSecret: cfg.fiscalApiClientSecret || '',
                    fiscalApiEnvironment: cfg.fiscalApiEnvironment || 'sandbox',
                });
            }
            setProposals(Array.isArray(props) ? props : []);
        } catch {
            toast.error('Erro ao carregar dados fiscais');
        }
        setLoading(false);
    };

    // ═══ CONFIGURAÇÃO ═══
    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            const updated = await api.updateFiscalConfig(configForm);
            setConfig(updated);
            toast.success('Configuração fiscal salva!');
        } catch {
            toast.error('Erro ao salvar configuração');
        }
        setSavingConfig(false);
    };

    // ═══ AUTO-PREENCHIMENTO CNPJ ═══
    const handleCnpjLookup = async () => {
        const clean = configForm.cnpj?.replace(/\D/g, '') || '';
        if (clean.length !== 14) return;
        try {
            const data = await api.lookupCnpj(clean);
            const endereco = [data.logradouro, data.numero, data.complemento, data.bairro]
                .filter(Boolean).join(', ');
            setConfigForm((prev: any) => ({
                ...prev,
                companyName: data.razaoSocial || prev.companyName,
                companyAddress: endereco || prev.companyAddress,
                companyCity: data.municipio || prev.companyCity,
                companyState: data.uf || prev.companyState,
                companyCep: data.cep?.replace(/\D/g, '') || prev.companyCep,
            }));
            toast.success('Dados da empresa preenchidos automaticamente!');
        } catch {
            // Silently fail — user can fill manually
        }
    };

    // ═══ AUTO-PREENCHIMENTO CEP ═══
    const handleCepLookup = async () => {
        const clean = configForm.companyCep?.replace(/\D/g, '') || '';
        if (clean.length !== 8) return;
        try {
            const data = await api.lookupCep(clean);
            const endereco = [data.logradouro, data.bairro].filter(Boolean).join(', ');
            setConfigForm((prev: any) => ({
                ...prev,
                companyAddress: endereco || prev.companyAddress,
                companyCity: data.cidade || prev.companyCity,
                companyState: data.uf || prev.companyState,
                codigoMunicipio: data.ibge || prev.codigoMunicipio,
                nomeMunicipio: data.cidade || prev.nomeMunicipio,
            }));
            toast.success('Endereço preenchido automaticamente!');
        } catch {
            // Silently fail
        }
    };

    const handleUploadCert = async () => {
        if (!certFile || !certPassword) {
            toast.error('Selecione o arquivo e informe a senha');
            return;
        }
        setUploadingCert(true);
        try {
            const updated = await api.uploadFiscalCertificate(certFile, certPassword);
            setConfig(updated);
            setCertFile(null);
            setCertPassword('');
            toast.success('Certificado digital enviado com sucesso!');
        } catch {
            toast.error('Erro ao enviar certificado');
        }
        setUploadingCert(false);
    };

    const handleRemoveCert = async () => {
        try {
            const updated = await api.removeFiscalCertificate();
            setConfig(updated);
            toast.success('Certificado removido');
        } catch {
            toast.error('Erro ao remover certificado');
        }
    };

    // ═══ EMISSÃO ═══
    const handleSelectProposal = async (proposalId: string) => {
        setSelectedProposal(proposalId);
        if (!proposalId) { setPreview(null); return; }
        setLoadingPreview(true);
        try {
            const data = await api.getFiscalProposalPreview(proposalId);
            setPreview(data);
        } catch {
            toast.error('Erro ao carregar preview da proposta');
        }
        setLoadingPreview(false);
    };

    const handleEmitInvoice = async (type: 'nfe' | 'nfse') => {
        if (!selectedProposal) return;
        if (!naturezaOperacao) {
            toast.error('Selecione a Natureza de Operação');
            return;
        }
        setEmitting(true);
        try {
            const result = await api.createFiscalInvoice({
                proposalId: selectedProposal,
                type,
                naturezaOperacao,
                finalidadeNfe,
                cfopCode,
            });
            if (result.status === 'error') {
                toast.error(`Erro: ${result.errorMessage || 'Falha ao emitir'}`);
            } else if (result.status === 'processing') {
                toast.success(`${type === 'nfe' ? 'NF-e' : 'NFS-e'} enviada para processamento! Verifique o status em breve.`);
            } else {
                toast.success(`${type === 'nfe' ? 'NF-e' : 'NFS-e'} emitida com sucesso!`);
            }
            setSelectedProposal('');
            setPreview(null);
            loadData();
            setActiveTab('invoices');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao emitir nota fiscal');
        }
        setEmitting(false);
    };

    // ═══ NUVEM FISCAL ═══
    const handleTestConnection = async () => {
        setTestingConnection(true);
        setConnectionResult(null);
        try {
            const result = await api.testFiscalConnection();
            setConnectionResult(result);
            if (result.success) {
                toast.success('Conexão com Nuvem Fiscal OK!');
            } else {
                toast.error(result.message || 'Falha na conexão com Nuvem Fiscal');
            }
        } catch (err: any) {
            setConnectionResult({ success: false, message: err?.response?.data?.message || err?.message || 'Falha na conexão' });
            toast.error('Erro ao testar conexão');
        }
        setTestingConnection(false);
    };

    const handleSyncCompany = async () => {
        setSyncing(true);
        try {
            await api.syncFiscalCompany();
            await api.syncFiscalServices();
            toast.success('Empresa e serviços sincronizados com Nuvem Fiscal!');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao sincronizar');
        }
        setSyncing(false);
    };

    const handleCheckStatus = async (id: string) => {
        try {
            const updated = await api.checkFiscalInvoiceStatus(id);
            toast.success(`Status atualizado: ${STATUS_CONFIG[updated.status]?.label || updated.status}`);
            loadData();
        } catch {
            toast.error('Erro ao consultar status');
        }
    };

    const handleDownloadPdf = async (id: string) => {
        try {
            const blob = await api.downloadFiscalInvoicePdf(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `nf-${id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao baixar PDF. A nota pode ainda estar sendo processada.');
        }
    };

    const handleDownloadXml = async (id: string) => {
        try {
            const blob = await api.downloadFiscalInvoiceXml(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `nf-${id}.xml`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao baixar XML. A nota pode ainda estar sendo processada.');
        }
    };

    // ═══ CANCELAMENTO ═══
    const handleCancel = async () => {
        if (!cancelReason.trim()) { toast.error('Informe o motivo do cancelamento'); return; }
        try {
            await api.cancelFiscalInvoice(cancelId, cancelReason);
            toast.success('Nota fiscal cancelada');
            setCancelDialog(false);
            setCancelReason('');
            loadData();
        } catch {
            toast.error('Erro ao cancelar nota fiscal');
        }
    };

    // Filter invoices
    const filteredInvoices = invoices.filter((inv) => {
        if (filterType !== 'all' && inv.type !== filterType) return false;
        if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchNum = inv.invoiceNumber?.toLowerCase().includes(term);
            const matchRecipient = inv.recipientName?.toLowerCase().includes(term);
            const matchProposal = inv.proposal?.proposalNumber?.toLowerCase().includes(term);
            if (!matchNum && !matchRecipient && !matchProposal) return false;
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Receipt className="h-7 w-7 text-amber-600" />
                        Módulo Fiscal
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Faturamento NF-e (Material) e NFS-e (Serviço)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('emit')} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Emitir NF
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-slate-500">Autorizadas</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            {invoices.filter((i) => i.status === 'authorized').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-slate-400">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-slate-500">Rascunhos</p>
                        <p className="text-2xl font-bold text-slate-600">
                            {invoices.filter((i) => i.status === 'draft').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-slate-500">NF-e (Material)</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {invoices.filter((i) => i.type === 'nfe').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-slate-500">NFS-e (Serviço)</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {invoices.filter((i) => i.type === 'nfse').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="invoices" className="gap-1.5">
                        <FileText className="h-4 w-4" /> Notas Fiscais
                    </TabsTrigger>
                    <TabsTrigger value="emit" className="gap-1.5">
                        <Plus className="h-4 w-4" /> Emitir NF
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-1.5">
                        <Shield className="h-4 w-4" /> Configuração
                    </TabsTrigger>
                </TabsList>

                {/* ═══ ABA: NOTAS FISCAIS ═══ */}
                <TabsContent value="invoices" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por número, cliente ou proposta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                <SelectItem value="nfe">NF-e (Material)</SelectItem>
                                <SelectItem value="nfse">NFS-e (Serviço)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="draft">Rascunho</SelectItem>
                                <SelectItem value="authorized">Autorizada</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                                <SelectItem value="error">Erro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {filteredInvoices.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">Nenhuma nota fiscal encontrada</p>
                                <p className="text-sm mt-1">Emita sua primeira nota fiscal na aba "Emitir NF"</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredInvoices.map((inv) => {
                                const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                                const StatusIcon = sc.icon;
                                return (
                                    <Card key={inv.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2 rounded-lg ${inv.type === 'nfe' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                                                        {inv.type === 'nfe' ? (
                                                            <Package className={`h-5 w-5 text-blue-600`} />
                                                        ) : (
                                                            <Wrench className={`h-5 w-5 text-purple-600`} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-slate-800">
                                                                {inv.type === 'nfe' ? 'NF-e' : 'NFS-e'}
                                                                {inv.invoiceNumber && ` #${inv.invoiceNumber}`}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${sc.color}`}>
                                                                <StatusIcon className="h-3 w-3" /> {sc.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 truncate">
                                                            {inv.recipientName || 'Sem destinatário'}
                                                            {inv.proposal?.proposalNumber && ` • Proposta ${inv.proposal.proposalNumber}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-800">R$ {fmt(inv.totalValue)}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('pt-BR') : '—'}
                                                        </p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { setDetailInvoice(inv); setDetailDialog(true); }}>
                                                                <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                                                            </DropdownMenuItem>
                                                            {inv.externalId && inv.status === 'processing' && (
                                                                <DropdownMenuItem onClick={() => handleCheckStatus(inv.id)}>
                                                                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Status
                                                                </DropdownMenuItem>
                                                            )}
                                                            {inv.externalId && (inv.status === 'authorized' || inv.status === 'processing') && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleDownloadPdf(inv.id)}>
                                                                        <Download className="h-4 w-4 mr-2" /> Baixar PDF (DANFE)
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleDownloadXml(inv.id)}>
                                                                        <FileCode className="h-4 w-4 mr-2" /> Baixar XML
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {inv.status !== 'cancelled' && (
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => { setCancelId(inv.id); setCancelDialog(true); }}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-2" /> Cancelar NF
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ═══ ABA: EMITIR NF ═══ */}
                <TabsContent value="emit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-amber-600" />
                                Emitir Nota Fiscal a partir de Proposta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Aviso de permissões */}
                            {config && !config.canInvoiceMaterial && !config.canInvoiceService && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">Permissões não configuradas</p>
                                        <p className="text-xs text-amber-600 mt-0.5">
                                            Vá para a aba "Configuração" e habilite o faturamento de Material e/ou Serviço.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {config && !config.certificateFile && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <Shield className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800">Certificado digital não configurado</p>
                                        <p className="text-xs text-red-600 mt-0.5">
                                            Faça o upload do certificado A1 (.pfx) na aba "Configuração".
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Seleção da proposta */}
                            <div>
                                <Label className="text-sm font-medium">Selecionar Proposta Aceita</Label>
                                <Select value={selectedProposal} onValueChange={handleSelectProposal}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Escolha uma proposta..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {proposals.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.proposalNumber} — {p.title} {p.client?.name && `(${p.client.name})`}
                                            </SelectItem>
                                        ))}
                                        {proposals.length === 0 && (
                                            <SelectItem value="_none" disabled>Nenhuma proposta aceita</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Natureza de Operação + Finalidade + CFOP */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Natureza de Operação *</Label>
                                    <Select value={naturezaOperacao} onValueChange={setNaturezaOperacao}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(naturezas).length > 0 ? (
                                                Object.entries(naturezas).map(([key, label]) => (
                                                    <SelectItem key={key} value={label as string}>
                                                        {label as string}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <>
                                                    <SelectItem value="Venda de mercadoria">Venda de mercadoria</SelectItem>
                                                    <SelectItem value="Venda para entrega futura">Venda para entrega futura</SelectItem>
                                                    <SelectItem value="Troca / Devolução em garantia">Troca / Devolução em garantia</SelectItem>
                                                    <SelectItem value="Devolução de mercadoria">Devolução de mercadoria</SelectItem>
                                                    <SelectItem value="Remessa para demonstração">Remessa para demonstração</SelectItem>
                                                    <SelectItem value="Remessa em consignação mercantil">Remessa em consignação mercantil</SelectItem>
                                                    <SelectItem value="Remessa em bonificação, doação ou brinde">Remessa em bonificação</SelectItem>
                                                    <SelectItem value="Transferência de mercadoria">Transferência de mercadoria</SelectItem>
                                                    <SelectItem value="Prestação de serviço">Prestação de serviço</SelectItem>
                                                    <SelectItem value="NF complementar">NF complementar</SelectItem>
                                                    <SelectItem value="Simples faturamento">Simples faturamento</SelectItem>
                                                    <SelectItem value="Outras saídas">Outras saídas</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Finalidade NF-e</Label>
                                    <Select value={String(finalidadeNfe)} onValueChange={(v) => setFinalidadeNfe(Number(v))}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 — NF-e Normal</SelectItem>
                                            <SelectItem value="2">2 — NF-e Complementar</SelectItem>
                                            <SelectItem value="3">3 — NF-e de Ajuste</SelectItem>
                                            <SelectItem value="4">4 — Devolução de Mercadoria</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">CFOP Principal</Label>
                                    <Input
                                        className="mt-1"
                                        placeholder="Ex: 5102"
                                        value={cfopCode}
                                        onChange={(e) => setCfopCode(e.target.value)}
                                        maxLength={4}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5">Código fiscal da operação (opcional)</p>
                                </div>
                            </div>

                            {loadingPreview && (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                                </div>
                            )}

                            {/* Preview */}
                            {preview && !loadingPreview && (
                                <div className="space-y-4">
                                    {/* Info da proposta */}
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-sm font-semibold text-slate-700">
                                            Proposta {preview.proposal.proposalNumber} — {preview.proposal.title}
                                        </p>
                                        {preview.proposal.client && (
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Cliente: {preview.proposal.client.name} • {preview.proposal.client.document}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Materiais */}
                                        <Card className={`border-2 ${preview.material.canInvoice ? 'border-blue-200' : 'border-slate-200 opacity-60'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Package className="h-5 w-5 text-blue-600" />
                                                    NF-e — Materiais
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                    {preview.material.items.length === 0 ? (
                                                        <p className="text-sm text-slate-400 italic">Sem itens de material</p>
                                                    ) : preview.material.items.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span className="text-slate-600 truncate mr-2">{item.description}</span>
                                                            <span className="font-medium text-slate-800 whitespace-nowrap">R$ {fmt(item.total)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t pt-2 flex justify-between font-semibold">
                                                    <span>Total Material</span>
                                                    <span className="text-blue-700">R$ {fmt(preview.material.total)}</span>
                                                </div>
                                                {preview.material.alreadyInvoiced && (
                                                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-medium">
                                                        ⚠️ Já existe uma NF-e emitida para esta proposta
                                                    </div>
                                                )}
                                                <Button
                                                    className="w-full gap-1.5"
                                                    disabled={
                                                        !preview.material.canInvoice ||
                                                        preview.material.items.length === 0 ||
                                                        preview.material.alreadyInvoiced ||
                                                        emitting
                                                    }
                                                    onClick={() => handleEmitInvoice('nfe')}
                                                >
                                                    {emitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                                                    Emitir NF-e
                                                </Button>
                                                {!preview.material.canInvoice && (
                                                    <p className="text-xs text-slate-400 text-center">Faturamento de material desabilitado</p>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Serviços */}
                                        <Card className={`border-2 ${preview.service.canInvoice ? 'border-purple-200' : 'border-slate-200 opacity-60'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Wrench className="h-5 w-5 text-purple-600" />
                                                    NFS-e — Serviços
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                    {preview.service.items.length === 0 ? (
                                                        <p className="text-sm text-slate-400 italic">Sem itens de serviço</p>
                                                    ) : preview.service.items.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span className="text-slate-600 truncate mr-2">{item.description}</span>
                                                            <span className="font-medium text-slate-800 whitespace-nowrap">R$ {fmt(item.total)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t pt-2 flex justify-between font-semibold">
                                                    <span>Total Serviço</span>
                                                    <span className="text-purple-700">R$ {fmt(preview.service.total)}</span>
                                                </div>
                                                {preview.service.alreadyInvoiced && (
                                                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-medium">
                                                        ⚠️ Já existe uma NFS-e emitida para esta proposta
                                                    </div>
                                                )}
                                                <Button
                                                    className="w-full gap-1.5"
                                                    variant="outline"
                                                    disabled={
                                                        !preview.service.canInvoice ||
                                                        preview.service.items.length === 0 ||
                                                        preview.service.alreadyInvoiced ||
                                                        emitting
                                                    }
                                                    onClick={() => handleEmitInvoice('nfse')}
                                                >
                                                    {emitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                                                    Emitir NFS-e
                                                </Button>
                                                {!preview.service.canInvoice && (
                                                    <p className="text-xs text-slate-400 text-center">Faturamento de serviço desabilitado</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══ ABA: CONFIGURAÇÃO ═══ */}
                <TabsContent value="config" className="space-y-4">
                    {/* Certificado Digital */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-amber-600" />
                                Certificado Digital A1
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {config?.certificateFile ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                                            <div>
                                                <p className="font-medium text-emerald-800">Certificado ativo</p>
                                                <p className="text-sm text-emerald-600">
                                                    {config.certificateOriginalName}
                                                    {config.certificateExpiresAt && (
                                                        <> • Valido até {new Date(config.certificateExpiresAt).toLocaleDateString('pt-BR')}</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleRemoveCert}>
                                            <Trash2 className="h-4 w-4 mr-1" /> Remover
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
                                    <div className="text-center space-y-3">
                                        <Shield className="h-10 w-10 text-slate-300 mx-auto" />
                                        <p className="text-sm text-slate-500">Envie seu certificado digital A1 (.pfx ou .p12)</p>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm">Arquivo do Certificado</Label>
                                            <div className="mt-1 flex items-center gap-2">
                                                <input
                                                    id="cert-file-input"
                                                    type="file"
                                                    accept=".pfx,.p12"
                                                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => document.getElementById('cert-file-input')?.click()}
                                                    className="gap-1.5 whitespace-nowrap"
                                                >
                                                    <FileCode className="h-4 w-4" />
                                                    Escolher Arquivo
                                                </Button>
                                                <span className="text-sm text-slate-500 truncate">
                                                    {certFile ? certFile.name : 'Nenhum arquivo selecionado'}
                                                </span>
                                                {certFile && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            setCertFile(null);
                                                            const input = document.getElementById('cert-file-input') as HTMLInputElement;
                                                            if (input) input.value = '';
                                                        }}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm">Senha do Certificado</Label>
                                            <Input
                                                type="password"
                                                placeholder="Informe a senha"
                                                value={certPassword}
                                                onChange={(e) => setCertPassword(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="mt-3 gap-1.5"
                                        onClick={handleUploadCert}
                                        disabled={!certFile || !certPassword || uploadingCert}
                                    >
                                        {uploadingCert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        Enviar Certificado
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dados da Empresa */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-amber-600" />
                                Dados Fiscais da Empresa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm">Razão Social</Label>
                                    <Input value={configForm.companyName} onChange={(e) => setConfigForm({ ...configForm, companyName: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm">CNPJ</Label>
                                    <Input value={configForm.cnpj} onChange={(e) => setConfigForm({ ...configForm, cnpj: e.target.value })} onBlur={handleCnpjLookup} className="mt-1" placeholder="00.000.000/0000-00" />
                                    <p className="text-[10px] text-blue-500 mt-0.5">Ao sair do campo, busca automática dos dados da empresa</p>
                                </div>
                                <div>
                                    <Label className="text-sm">Inscrição Estadual</Label>
                                    <Input value={configForm.stateRegistration} onChange={(e) => setConfigForm({ ...configForm, stateRegistration: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm">Inscrição Municipal</Label>
                                    <Input value={configForm.municipalRegistration} onChange={(e) => setConfigForm({ ...configForm, municipalRegistration: e.target.value })} className="mt-1" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="text-sm">Endereço</Label>
                                    <Input value={configForm.companyAddress} onChange={(e) => setConfigForm({ ...configForm, companyAddress: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm">Cidade</Label>
                                    <Input value={configForm.companyCity} onChange={(e) => setConfigForm({ ...configForm, companyCity: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm">UF</Label>
                                    <Input value={configForm.companyState} onChange={(e) => setConfigForm({ ...configForm, companyState: e.target.value })} className="mt-1" maxLength={2} placeholder="SP" />
                                </div>
                                <div>
                                    <Label className="text-sm">CEP</Label>
                                    <Input value={configForm.companyCep} onChange={(e) => setConfigForm({ ...configForm, companyCep: e.target.value })} onBlur={handleCepLookup} className="mt-1" placeholder="00000-000" />
                                    <p className="text-[10px] text-blue-500 mt-0.5">Ao sair do campo, busca automática do endereço</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configuração Tributária */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-green-600" />
                                Configuração Tributária
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Regime Tributário */}
                            <div>
                                <h4 className="font-medium text-sm text-slate-700 mb-3">Regime Tributário</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm">Regime</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                                            value={configForm.regimeTributario || '1'}
                                            onChange={(e) => setConfigForm({ ...configForm, regimeTributario: e.target.value })}
                                        >
                                            <option value="1">Simples Nacional</option>
                                            <option value="2">Simples Nacional - Exc. Sublimite</option>
                                            <option value="3">Lucro Presumido</option>
                                            <option value="4">Lucro Real</option>
                                        </select>
                                    </div>
                                    {(configForm.regimeTributario === '1' || configForm.regimeTributario === '2') && (
                                        <div>
                                            <Label className="text-sm">Anexo do Simples</Label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                                                value={configForm.simplesAnexo || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, simplesAnexo: e.target.value })}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="I">Anexo I — Comércio</option>
                                                <option value="II">Anexo II — Indústria</option>
                                                <option value="III">Anexo III — Serviços (ISS)</option>
                                                <option value="IV">Anexo IV — Construção / Vigilância</option>
                                                <option value="V">Anexo V — Serviços (intelectuais)</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-sm">CRT (Código Regime Trib.)</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                                            value={configForm.crt || 1}
                                            onChange={(e) => setConfigForm({ ...configForm, crt: Number(e.target.value) })}
                                        >
                                            <option value={1}>1 — Simples Nacional</option>
                                            <option value={2}>2 — Simples Excesso Sublimite</option>
                                            <option value={3}>3 — Regime Normal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Impostos NFS-e */}
                            <div>
                                <h4 className="font-medium text-sm text-slate-700 mb-3">Impostos sobre Serviço (NFS-e)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm">Alíquota ISS (%)</Label>
                                        <Input
                                            type="number" step="0.01" min="0" max="10"
                                            value={configForm.aliquotaIss ?? 5}
                                            onChange={(e) => setConfigForm({ ...configForm, aliquotaIss: Number(e.target.value) })}
                                            className="mt-1"
                                            placeholder="5.00"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Código Serviço (LC 116)</Label>
                                        <Input
                                            value={configForm.codigoServico || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, codigoServico: e.target.value })}
                                            className="mt-1"
                                            placeholder="14.01"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Código Trib. Nacional</Label>
                                        <Input
                                            value={configForm.codigoTribNacional || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, codigoTribNacional: e.target.value })}
                                            className="mt-1"
                                            placeholder="01.01.01"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">CNAE Principal</Label>
                                        <Input
                                            value={configForm.cnae || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, cnae: e.target.value })}
                                            className="mt-1"
                                            placeholder="4321500"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Cód. Município (IBGE)</Label>
                                        <Input
                                            value={configForm.codigoMunicipio || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, codigoMunicipio: e.target.value })}
                                            className="mt-1"
                                            placeholder="2611606"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Preenchido ao buscar CEP</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm">CNO (Cód. Nacional de Obra)</Label>
                                        <Input
                                            value={configForm.cno || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, cno: e.target.value })}
                                            className="mt-1"
                                            placeholder="CNO da obra (construção civil)"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Obrigatório para serviços de construção civil</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm">Regime Especial de Tributação</Label>
                                        <select
                                            value={configForm.regEspTrib || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, regEspTrib: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="">Nenhum</option>
                                            <option value="1">1 - ME/EPP Simples Nacional</option>
                                            <option value="2">2 - Estimativa</option>
                                            <option value="3">3 - Sociedade de Profissionais</option>
                                            <option value="4">4 - Cooperativa</option>
                                            <option value="5">5 - MEI</option>
                                            <option value="6">6 - ME/EPP ISSQN fixo</option>
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Aplicável para NFS-e</p>
                                    </div>
                                </div>
                            </div>

                            {/* Retenções */}
                            <div>
                                <h4 className="font-medium text-sm text-slate-700 mb-3">Retenções de Impostos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { key: 'retIss', label: 'ISS', aliqKey: 'aliquotaIss', aliq: configForm.aliquotaIss ?? 5 },
                                        { key: 'retIrpj', label: 'IRPJ', aliqKey: 'aliquotaIrpj', aliq: configForm.aliquotaIrpj ?? 1.5 },
                                        { key: 'retCsll', label: 'CSLL', aliqKey: 'aliquotaCsll', aliq: configForm.aliquotaCsll ?? 1.0 },
                                        { key: 'retPis', label: 'PIS', aliqKey: 'aliquotaPis', aliq: configForm.aliquotaPis ?? 0.65 },
                                        { key: 'retCofins', label: 'COFINS', aliqKey: 'aliquotaCofins', aliq: configForm.aliquotaCofins ?? 3.0 },
                                        { key: 'retInss', label: 'INSS', aliqKey: 'aliquotaInss', aliq: configForm.aliquotaInss ?? 11.0 },
                                    ].map(({ key, label, aliqKey, aliq }) => (
                                        <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                                            <Switch
                                                checked={!!configForm[key as keyof typeof configForm]}
                                                onCheckedChange={(v) => setConfigForm({ ...configForm, [key]: v })}
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium">{label}</span>
                                                {key !== 'retIss' && (
                                                    <Input
                                                        type="number" step="0.01" min="0" max="100"
                                                        value={aliq}
                                                        onChange={(e) => setConfigForm({ ...configForm, [aliqKey]: e.target.value })}
                                                        className="mt-1 h-7 text-xs"
                                                        placeholder="%"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissões de Faturamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-amber-600" />
                                Permissões de Faturamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-slate-800">NF-e — Materiais</p>
                                        <p className="text-xs text-slate-500">Habilita emissão de nota fiscal para itens de material</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={configForm.canInvoiceMaterial}
                                    onCheckedChange={(v) => setConfigForm({ ...configForm, canInvoiceMaterial: v })}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Wrench className="h-5 w-5 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-slate-800">NFS-e — Serviços</p>
                                        <p className="text-xs text-slate-500">Habilita emissão de nota fiscal para itens de serviço</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={configForm.canInvoiceService}
                                    onCheckedChange={(v) => setConfigForm({ ...configForm, canInvoiceService: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Nuvem Fiscal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-amber-600" />
                                Integração Nuvem Fiscal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                                <p className="font-medium">A Nuvem Fiscal emite NF-e e NFS-e automaticamente junto ao SEFAZ/Prefeitura.</p>
                                <p className="mt-1 text-xs text-blue-500">Crie sua conta gratuita em console.nuvemfiscal.com.br e coloque as credenciais abaixo.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm">Client ID</Label>
                                    <Input
                                        value={configForm.fiscalApiClientId}
                                        onChange={(e) => setConfigForm({ ...configForm, fiscalApiClientId: e.target.value })}
                                        className="mt-1"
                                        placeholder="Ex: Pjp7R82z0BoY8IPKLdV8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm">Client Secret</Label>
                                    <Input
                                        type="password"
                                        value={configForm.fiscalApiClientSecret}
                                        onChange={(e) => setConfigForm({ ...configForm, fiscalApiClientSecret: e.target.value })}
                                        className="mt-1"
                                        placeholder="Sua chave secreta"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm">Ambiente</Label>
                                    <Select
                                        value={configForm.fiscalApiEnvironment}
                                        onValueChange={(v) => setConfigForm({ ...configForm, fiscalApiEnvironment: v })}
                                    >
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                                            <SelectItem value="production">Produção</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTestConnection}
                                    disabled={testingConnection || !configForm.fiscalApiClientId}
                                    className="gap-1.5"
                                >
                                    {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                    Testar Conexão
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSyncCompany}
                                    disabled={syncing || !configForm.fiscalApiClientId || !configForm.cnpj}
                                    className="gap-1.5"
                                >
                                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    Sincronizar Empresa
                                </Button>
                            </div>
                            {connectionResult && (
                                <div className={`p-3 rounded-lg border text-sm ${connectionResult.success
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-red-50 border-red-200 text-red-700'
                                    }`}>
                                    <p className="font-medium">{connectionResult.message}</p>
                                    {connectionResult.cotas && (
                                        <div className="mt-2 text-xs space-y-1">
                                            {(Array.isArray(connectionResult.cotas) ? connectionResult.cotas : []).map((c: any, i: number) => (
                                                <p key={i}>{c.nome}: {c.consumo}/{c.limite} usado</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveConfig} disabled={savingConfig} className="gap-1.5 px-6">
                            {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Salvar Configuração
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ═══ DIALOG: CANCELAR NF ═══ */}
            <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" /> Cancelar Nota Fiscal
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label className="text-sm">Motivo do Cancelamento</Label>
                        <Input
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Informe o motivo..."
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCancelDialog(false)}>Voltar</Button>
                            <Button variant="destructive" onClick={handleCancel} className="gap-1.5">
                                <XCircle className="h-4 w-4" /> Confirmar Cancelamento
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ DIALOG: DETALHES DA NF ═══ */}
            <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-amber-600" />
                            Detalhes da Nota Fiscal
                        </DialogTitle>
                    </DialogHeader>
                    {detailInvoice && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-400">Tipo</p>
                                    <p className="font-medium">{detailInvoice.type === 'nfe' ? 'NF-e (Material)' : 'NFS-e (Serviço)'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Status</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_CONFIG[detailInvoice.status]?.color}`}>
                                        {STATUS_CONFIG[detailInvoice.status]?.label}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-slate-400">Número</p>
                                    <p className="font-medium">{detailInvoice.invoiceNumber || 'Pendente'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Valor Total</p>
                                    <p className="font-bold text-lg">R$ {fmt(detailInvoice.totalValue)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Destinatário</p>
                                    <p className="font-medium">{detailInvoice.recipientName}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Documento</p>
                                    <p className="font-medium">{detailInvoice.recipientDocument || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-400">Data de Emissão</p>
                                    <p className="font-medium">
                                        {detailInvoice.issueDate ? new Date(detailInvoice.issueDate).toLocaleString('pt-BR') : '—'}
                                    </p>
                                </div>
                            </div>

                            {detailInvoice.items && detailInvoice.items.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Itens Faturados</p>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="text-left px-3 py-2 font-medium text-slate-600">Descrição</th>
                                                    <th className="text-right px-3 py-2 font-medium text-slate-600">Qtd</th>
                                                    <th className="text-right px-3 py-2 font-medium text-slate-600">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailInvoice.items.map((item: any, i: number) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="px-3 py-2 text-slate-700">{item.description}</td>
                                                        <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                                                        <td className="px-3 py-2 text-right font-medium">R$ {fmt(item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {detailInvoice.errorMessage && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-medium text-red-700">Erro:</p>
                                    <p className="text-sm text-red-600">{detailInvoice.errorMessage}</p>
                                </div>
                            )}

                            {detailInvoice.cancellationReason && (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <p className="text-sm font-medium text-slate-700">Motivo do Cancelamento:</p>
                                    <p className="text-sm text-slate-600">{detailInvoice.cancellationReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
