import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Loader2, Plus, Trash2, Search, ChevronDown, Box, Layers, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface NewProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProposalCreated: () => void;
    initialData?: any; // For editing
    prefillData?: { // For pre-filling from Pipeline
        title?: string;
        clientId?: string;
        opportunityId?: string;
    };
}

interface ClientOption {
    id: string;
    name: string;
}

interface ActivityItem {
    id?: string;
    description: string;
    serviceType: string;
    unitPrice: string;
    quantity: string;
    isBundleParent?: boolean;
    parentId?: string;
    showDetailedPrices?: boolean;
}

const serviceTypes: Record<string, string> = {
    service: 'Serviço',
    material: 'Material',
};

const emptyItem: ActivityItem = {
    description: '',
    serviceType: 'service',
    unitPrice: '',
    quantity: '1',
};

export default function NewProposalDialog({
    open,
    onOpenChange,
    onProposalCreated,
    initialData,
    prefillData,
}: NewProposalDialogProps) {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        clientId: '',
        opportunityId: '',
        validUntil: '',
        discount: '',
        scope: '',
        deadline: '',
        paymentConditions: '',
        obligations: '',
        notes: '',
    });

    const [items, setItems] = useState<ActivityItem[]>([{ ...emptyItem }]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            if (clients.length === 0) loadClients();

            if (initialData) {
                // Edit Mode
                setFormData({
                    title: initialData.title || '',
                    clientId: initialData.clientId || initialData.client?.id || '',
                    opportunityId: initialData.opportunityId || '',
                    validUntil: initialData.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
                    discount: String(initialData.discount || ''),
                    scope: initialData.scope || '',
                    deadline: initialData.deadline || '',
                    paymentConditions: initialData.paymentConditions || '',
                    obligations: initialData.obligations || '',
                    notes: initialData.notes || '',
                });
                if (initialData.items && initialData.items.length > 0) {
                    setItems(initialData.items.map((it: any) => ({
                        id: it.id,
                        description: it.description,
                        serviceType: it.serviceType === 'material' ? 'material' : 'service',
                        unitPrice: String(it.unitPrice),
                        quantity: String(it.quantity),
                        isBundleParent: it.isBundleParent || false,
                        parentId: it.parentId || undefined,
                        showDetailedPrices: it.showDetailedPrices !== undefined ? it.showDetailedPrices : true,
                    })));
                }
            } else if (prefillData) {
                // Pre-fill Mode (from Pipeline)
                setFormData(prev => ({
                    ...prev,
                    title: prefillData.title || prev.title,
                    clientId: prefillData.clientId || prev.clientId,
                    opportunityId: prefillData.opportunityId || prev.opportunityId,
                }));
            }
        }
    }, [open, initialData, prefillData]);

    const loadClients = async () => {
        setLoadingClients(true);
        try {
            const data = await api.getClients();
            const clientList = Array.isArray(data) ? data : (data?.data ?? []);
            setClients(clientList.map((c: any) => ({ id: c.id, name: c.name })));
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const addItem = () => {
        setItems([...items, { ...emptyItem }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        const itemToRemove = items[index];
        let newItems = [...items];

        if (itemToRemove.isBundleParent) {
            // Remover pai e todos os filhos
            const parentId = itemToRemove.id;
            newItems = newItems.filter((it, i) => i !== index && it.parentId !== parentId);
        } else {
            newItems = newItems.filter((_, i) => i !== index);
        }

        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof ActivityItem, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value === 'true' ? true : value === 'false' ? false : value };
        setItems(updated);
    };

    const getItemTotal = (item: ActivityItem): number => {
        // Se for um pai de bundle, o total é a soma dos filhos
        if (item.isBundleParent) {
            return items
                .filter(i => i.parentId === item.id)
                .reduce((sum, i) => sum + (Number(i.unitPrice || 0) * Number(i.quantity || 1)), 0);
        }
        return Number(item.unitPrice || 0) * Number(item.quantity || 1);
    };

    const subtotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);
    const discount = Number(formData.discount || 0);
    const total = subtotal - discount;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.clientId) newErrors.clientId = 'Selecione um cliente';

        const hasValidItem = items.some(
            (item) => item.description.trim() && getItemTotal(item) > 0
        );
        if (!hasValidItem) newErrors.items = 'Adicione ao menos uma atividade com descrição e valor';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setFormData({
            title: '',
            clientId: '',
            opportunityId: '',
            validUntil: '',
            discount: '',
            scope: '',
            deadline: '',
            paymentConditions: '',
            obligations: '',
            notes: ''
        });
        setItems([{ ...emptyItem }]);
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const validItems = items
                .filter((item) => item.description.trim() && Number(item.unitPrice) > 0)
                .map((item) => ({
                    id: item.id,
                    description: item.description,
                    serviceType: item.serviceType,
                    parentId: item.parentId,
                    isBundleParent: item.isBundleParent,
                    showDetailedPrices: item.showDetailedPrices,
                    unitPrice: Number(item.unitPrice || 0),
                    quantity: Number(item.quantity || 1),
                    total: getItemTotal(item),
                }));

            const payload = {
                proposal: {
                    title: formData.title,
                    clientId: formData.clientId,
                    opportunityId: formData.opportunityId || null,
                    validUntil: formData.validUntil || null,
                    discount: discount,
                    scope: formData.scope || null,
                    deadline: formData.deadline || null,
                    paymentConditions: formData.paymentConditions || null,
                    obligations: formData.obligations || null,
                    notes: formData.notes || null,
                },
                items: validItems,
            };

            if (initialData?.id) {
                await api.updateProposal(initialData.id, payload);
                toast.success('Proposta atualizada com sucesso!');
            } else {
                await api.createProposal(payload);
                toast.success('Proposta criada com sucesso!');
            }

            resetForm();
            onOpenChange(false);
            onProposalCreated();
        } catch (error: any) {
            console.error('Erro ao salvar proposta:', error);
            toast.error(
                error?.response?.data?.message || 'Erro ao salvar proposta. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">
                                {initialData ? 'Editar Proposta' : 'Nova Proposta'}
                            </DialogTitle>
                            <DialogDescription>
                                {initialData
                                    ? 'Atualize os dados e itens desta proposta comercial.'
                                    : 'Crie uma proposta comercial com atividades e valores.'
                                }
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                    {/* Informações da Proposta */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Informações da Proposta
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Label htmlFor="prop-title">Título *</Label>
                                <Input
                                    id="prop-title"
                                    placeholder="Ex: Instalação Residencial Completa"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && (
                                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                                )}
                            </div>

                            <div>
                                <Label>Cliente *</Label>
                                {loadingClients ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Carregando clientes...
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.clientId}
                                        onValueChange={(v) =>
                                            setFormData({ ...formData, clientId: v })
                                        }
                                    >
                                        <SelectTrigger
                                            className={errors.clientId ? 'border-red-500' : ''}
                                        >
                                            <SelectValue placeholder="Selecione um cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                            {clients.length === 0 && (
                                                <div className="px-3 py-2 text-sm text-slate-400">
                                                    Nenhum cliente cadastrado
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                                {errors.clientId && (
                                    <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="prop-validUntil">Validade</Label>
                                <Input
                                    id="prop-validUntil"
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={(e) =>
                                        setFormData({ ...formData, validUntil: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Atividades / Itens */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                Atividades / Serviços
                            </h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size="sm">
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        Adicionar
                                        <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => addItem()}>
                                        <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                        Item Avulso
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        addItem();
                                        // A pequena demora garante que o novo campo exista no DOM
                                        setTimeout(() => {
                                            const inputs = document.querySelectorAll('input[placeholder="Pesquisar material ou serviço..."]');
                                            const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
                                            if (lastInput) lastInput.focus();
                                        }, 100);
                                    }}>
                                        <Search className="w-4 h-4 mr-2 text-slate-400" />
                                        Item do Catálogo
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {errors.items && (
                            <p className="text-red-500 text-xs">{errors.items}</p>
                        )}

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[35%]">Descrição</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Preço Unit.</TableHead>
                                        <TableHead>Qtd</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => {
                                        // Se for um filho, verificar se o pai está configurado para mostrar detalhes
                                        if (item.parentId) {
                                            const parent = items.find(it => it.id === item.parentId || (it.isBundleParent && 'temp-' + items.indexOf(it) === item.parentId));
                                            if (parent && !parent.showDetailedPrices) {
                                                return null;
                                            }
                                        }

                                        return (
                                            <TableRow key={index} className={item.isBundleParent ? 'bg-slate-50/50' : item.parentId ? 'bg-white' : ''}>
                                                <TableCell className="relative">
                                                    <div className={`space-y-1 ${item.parentId ? 'pl-6 border-l-2 border-slate-100 ml-2' : ''}`}>
                                                        <div className="flex items-center gap-2">
                                                            {item.isBundleParent && <Layers className="w-4 h-4 text-amber-500 shrink-0" />}
                                                            <Input
                                                                placeholder={item.isBundleParent ? "Nome do Kit..." : "Pesquisar material ou serviço..."}
                                                                value={item.description}
                                                                onChange={async (e) => {
                                                                    const val = e.target.value;
                                                                    updateItem(index, 'description', val);

                                                                    if (val.length >= 2) {
                                                                        try {
                                                                            const suggestions = await api.searchCatalogItems(val);
                                                                            (window as any)[`suggestions_${index}`] = suggestions;
                                                                            // Forçando re-render simplificado para este exemplo
                                                                            setItems([...items]);
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                        }
                                                                    } else {
                                                                        (window as any)[`suggestions_${index}`] = [];
                                                                    }
                                                                }}
                                                                className="h-8 text-sm"
                                                            />
                                                            {(window as any)[`suggestions_${index}`]?.length > 0 && (
                                                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                                    {(window as any)[`suggestions_${index}`].map((suggestion: any) => (
                                                                        <div
                                                                            key={suggestion.id}
                                                                            className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                                                                            onClick={async () => {
                                                                                const newItems = [...items];
                                                                                if (suggestion.dataType === 'category') {
                                                                                    // Inserir Bundle
                                                                                    const parentTempId = 'temp-' + Date.now();
                                                                                    // Transformar a linha atual no Pai do Bundle
                                                                                    newItems[index] = {
                                                                                        ...newItems[index],
                                                                                        description: suggestion.name,
                                                                                        isBundleParent: true,
                                                                                        id: parentTempId, // Usado apenas localmente para vincular filhos
                                                                                        showDetailedPrices: true,
                                                                                        unitPrice: '0',
                                                                                        quantity: '1',
                                                                                        serviceType: 'material' // Default to Material for Kits
                                                                                    };

                                                                                    try {
                                                                                        const catItems = await api.getCatalogCategoryItems(suggestion.id);
                                                                                        const childItems = catItems.map((ci: any) => ({
                                                                                            description: ci.name,
                                                                                            unitPrice: String(ci.unitPrice),
                                                                                            quantity: '1',
                                                                                            serviceType: ci.type === 'service' ? 'service' : 'material',
                                                                                            parentId: parentTempId
                                                                                        }));
                                                                                        newItems.splice(index + 1, 0, ...childItems);
                                                                                    } catch (err) {
                                                                                        console.error('Erro ao buscar itens da categoria:', err);
                                                                                        toast.error('Erro ao carregar itens do kit.');
                                                                                    }
                                                                                } else {
                                                                                    // Item normal
                                                                                    const mappedType = suggestion.type === 'service' ? 'service' : 'material';
                                                                                    newItems[index] = {
                                                                                        ...newItems[index],
                                                                                        description: suggestion.name,
                                                                                        unitPrice: String(suggestion.unitPrice),
                                                                                        serviceType: mappedType
                                                                                    };
                                                                                }
                                                                                (window as any)[`suggestions_${index}`] = [];
                                                                                setItems(newItems);
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex flex-col">
                                                                                    <div className="font-medium flex items-center gap-2">
                                                                                        {suggestion.dataType === 'category' ? (
                                                                                            <Layers className="w-3.5 h-3.5 text-amber-500" />
                                                                                        ) : (
                                                                                            <Box className="w-3.5 h-3.5 text-slate-400" />
                                                                                        )}
                                                                                        {suggestion.name}
                                                                                    </div>
                                                                                    <div className="text-xs text-slate-500">
                                                                                        {suggestion.dataType === 'category'
                                                                                            ? 'Kit'
                                                                                            : `R$ ${Number(suggestion.unitPrice).toLocaleString('pt-BR')} • ${suggestion.type === 'material' ? 'Material' : 'Serviço'}`}
                                                                                    </div>
                                                                                </div>
                                                                                {suggestion.dataType === 'category' && (
                                                                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">KIT</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={item.serviceType}
                                                        onValueChange={(v) =>
                                                            updateItem(index, 'serviceType', v)
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(serviceTypes).map(
                                                                ([k, l]) => (
                                                                    <SelectItem key={k} value={k}>
                                                                        {l}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0,00"
                                                        value={item.unitPrice}
                                                        onChange={(e) =>
                                                            updateItem(index, 'unitPrice', e.target.value)
                                                        }
                                                        className="h-8 text-sm w-24"
                                                        disabled={item.isBundleParent}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        disabled={item.isBundleParent}
                                                        onChange={(e) =>
                                                            updateItem(index, 'quantity', e.target.value)
                                                        }
                                                        className="h-8 text-sm w-16"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-sm font-medium ${item.isBundleParent ? 'text-amber-700 font-bold' : ''}`}>
                                                            R$ {getItemTotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        {item.isBundleParent && (
                                                            <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                                                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Exibir Detalhes:</span>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-8 p-0 hover:bg-amber-100"
                                                                    onClick={() => updateItem(index, 'showDetailedPrices', !item.showDetailedPrices)}
                                                                >
                                                                    {item.showDetailedPrices ? (
                                                                        <Eye className="w-4 h-4 text-amber-600" />
                                                                    ) : (
                                                                        <EyeOff className="w-4 h-4 text-slate-400" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-400 hover:text-red-600"
                                                        onClick={() => removeItem(index)}
                                                        disabled={items.length <= 1}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {/* Totais */}
                        <div className="flex flex-col items-end gap-1 text-sm">
                            <div className="flex gap-4">
                                <span className="text-slate-500">Subtotal:</span>
                                <span className="font-medium w-28 text-right">
                                    R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex gap-4 items-center">
                                <span className="text-slate-500">Desconto:</span>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={formData.discount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, discount: e.target.value })
                                    }
                                    className="h-7 text-sm w-28 text-right"
                                />
                            </div>
                            <div className="flex gap-4 pt-1 border-t">
                                <span className="text-slate-700 font-semibold">Total:</span>
                                <span className="font-bold text-amber-600 w-28 text-right">
                                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detalhes Profissionais */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Detalhes do Contrato / Proposta
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="prop-scope">Escopo do Serviço</Label>
                                <Textarea
                                    id="prop-scope"
                                    placeholder="Descreva o que está incluso no serviço..."
                                    value={formData.scope}
                                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prop-deadline">Prazo de Execução</Label>
                                <Input
                                    id="prop-deadline"
                                    placeholder="Ex: 15 dias úteis após aprovação"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prop-payment">Condições de Pagamento</Label>
                                <Textarea
                                    id="prop-payment"
                                    placeholder="Ex: 50% entrada e 50% na entrega..."
                                    value={formData.paymentConditions}
                                    onChange={(e) => setFormData({ ...formData, paymentConditions: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prop-obligations">Obrigações das Partes</Label>
                                <Textarea
                                    id="prop-obligations"
                                    placeholder="Responsabilidades do cliente e da empresa..."
                                    value={formData.obligations}
                                    onChange={(e) => setFormData({ ...formData, obligations: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                        <Label htmlFor="prop-notes">Observações</Label>
                        <Textarea
                            id="prop-notes"
                            placeholder="Condições, prazos de execução, garantias..."
                            rows={3}
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {loading
                                ? (initialData ? 'Salvando...' : 'Criando...')
                                : (initialData ? 'Salvar Alterações' : 'Criar Proposta')
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
