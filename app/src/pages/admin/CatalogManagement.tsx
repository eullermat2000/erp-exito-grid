import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Loader2, Package, Zap, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface Category {
    id: string;
    name: string;
    type: 'material' | 'service';
    parentId: string | null;
    children?: Category[];
}

interface CatalogItem {
    id: string;
    name: string;
    description: string;
    unitPrice: number;
    unit: string;
    categoryId: string;
    type: 'material' | 'service';
    category?: Category;
}

export default function AdminCatalogManagement() {
    const [activeTab, setActiveTab] = useState<'material' | 'service'>('material');
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

    // Form states
    const [categoryForm, setCategoryForm] = useState({ name: '', parentId: '' as string | null });
    const [itemForm, setItemForm] = useState({
        name: '',
        description: '',
        unitPrice: '',
        unit: '',
        categoryId: '',
    });
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [cats, itemList] = await Promise.all([
                api.getCatalogCategoryTree(activeTab),
                api.getCatalogItems({ type: activeTab }),
            ]);
            setCategories(cats);
            setItems(itemList);
        } catch (error) {
            console.error('Erro ao carregar catálogo:', error);
            toast.error('Erro ao carregar dados do catálogo.');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenCategoryDialog = (cat?: Category, parentId?: string) => {
        if (cat) {
            setEditingCategory(cat);
            setCategoryForm({ name: cat.name, parentId: cat.parentId });
        } else {
            setEditingCategory(null);
            setCategoryForm({ name: '', parentId: parentId || null });
        }
        setIsCategoryDialogOpen(true);
    };

    const handleOpenItemDialog = (item?: CatalogItem, categoryId?: string) => {
        if (item) {
            setEditingItem(item);
            setItemForm({
                name: item.name,
                description: item.description,
                unitPrice: String(item.unitPrice),
                unit: item.unit,
                categoryId: item.categoryId,
            });
        } else {
            setEditingItem(null);
            setItemForm({
                name: '',
                description: '',
                unitPrice: '',
                unit: '',
                categoryId: categoryId || (categories.length > 0 ? categories[0].id : ''),
            });
        }
        setIsItemDialogOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name.trim()) return toast.error('Nome é obrigatório');
        setSaving(true);
        try {
            if (editingCategory) {
                await api.updateCatalogCategory(editingCategory.id, categoryForm);
                toast.success('Categoria atualizada!');
            } else {
                await api.createCatalogCategory({ ...categoryForm, type: activeTab });
                toast.success('Categoria criada!');
            }
            setIsCategoryDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('Erro ao salvar categoria.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveItem = async () => {
        if (!itemForm.name.trim() || !itemForm.categoryId) return toast.error('Preencha os campos obrigatórios');
        setSaving(true);
        try {
            const payload = {
                ...itemForm,
                unitPrice: Number(itemForm.unitPrice) || 0,
                type: activeTab,
            };
            if (editingItem) {
                await api.updateCatalogItem(editingItem.id, payload);
                toast.success('Item atualizado!');
            } else {
                await api.createCatalogItem(payload);
                toast.success('Item criado!');
            }
            setIsItemDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('Erro ao salvar item.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Deseja excluir esta categoria? Todos os itens e subcategorias vinculados serão afetados.')) return;
        try {
            await api.deleteCatalogCategory(id);
            toast.success('Categoria excluída');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir categoria');
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Deseja excluir este item?')) return;
        try {
            await api.deleteCatalogItem(id);
            toast.success('Item excluído');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir item');
        }
    };

    const flattenCategories = (cats: Category[], prefix = ''): { id: string, name: string }[] => {
        let result: { id: string, name: string }[] = [];
        cats.forEach(c => {
            result.push({ id: c.id, name: prefix + c.name });
            if (c.children && c.children.length > 0) {
                result = [...result, ...flattenCategories(c.children, prefix + c.name + ' > ')];
            }
        });
        return result;
    };

    const flatCategories = flattenCategories(categories);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Catálogo de Composições</h1>
                    <p className="text-slate-500">Gerencie materiais e serviços cadastrados no sistema</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleOpenCategoryDialog()}>
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Nova Categoria
                    </Button>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={() => handleOpenItemDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Item
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="material" className="data-[state=active]:bg-white">
                        <Package className="w-4 h-4 mr-2" />
                        Materiais
                    </TabsTrigger>
                    <TabsTrigger value="service" className="data-[state=active]:bg-white">
                        <Zap className="w-4 h-4 mr-2" />
                        Serviços
                    </TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                    {/* Categories Sidebar */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm font-semibold uppercase text-slate-500">Categorias</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 space-y-1">
                            {loading && <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>}
                            {!loading && categories.length === 0 && <div className="p-4 text-xs text-slate-400 text-center">Nenhuma categoria</div>}
                            {categories.map(cat => (
                                <div key={cat.id} className="space-y-1">
                                    <div className="flex items-center justify-between group px-2 py-1.5 rounded-md hover:bg-slate-50">
                                        <span className="text-sm font-medium">{cat.name}</span>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenCategoryDialog(undefined, cat.id)}>
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenCategoryDialog(cat)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    {cat.children?.map(sub => (
                                        <div key={sub.id} className="flex items-center justify-between group ml-4 px-2 py-1.5 rounded-md hover:bg-slate-50 border-l border-slate-200">
                                            <span className="text-xs text-slate-600">{sub.name}</span>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleOpenCategoryDialog(sub)}>
                                                    <Pencil className="w-2.5 h-2.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500" onClick={() => handleDeleteCategory(sub.id)}>
                                                    <Trash2 className="w-2.5 h-2.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Items Table */}
                    <Card className="md:col-span-3">
                        <CardHeader className="p-4 border-b">
                            <CardTitle>Itens Cadastrados</CardTitle>
                            <CardDescription>Lista de {activeTab === 'material' ? 'materiais' : 'serviços'} na categoria selecionada</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Unidade</TableHead>
                                        <TableHead>Preço Base</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!loading && items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-sm">
                                                Nenhum item cadastrado nesta categoria.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{item.name}</p>
                                                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{item.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                    {item.category?.name || 'Sem categoria'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">{item.unit || '—'}</TableCell>
                                            <TableCell className="text-sm font-medium">
                                                R$ {Number(item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenItemDialog(item)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteItem(item.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </Tabs>

            {/* Category Dialog */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                        <DialogDescription>
                            Organize seus itens em grupos para facilitar a busca nas propostas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nome da Categoria</Label>
                            <Input
                                placeholder="Ex: Cabos elétricos, Disjuntores..."
                                value={categoryForm.name}
                                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria Pai (Opcional)</Label>
                            <Select
                                value={categoryForm.parentId || 'none'}
                                onValueChange={v => setCategoryForm({ ...categoryForm, parentId: v === 'none' ? null : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria pai" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma (Categoria Principal)</SelectItem>
                                    {flatCategories
                                        .filter(c => !editingCategory || c.id !== editingCategory.id)
                                        .map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={handleSaveCategory} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCategory ? 'Atualizar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Item Dialog */}
            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                        <DialogDescription>
                            Cadastre as especificações e o preço base para este item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nome do Item</Label>
                            <Input
                                placeholder="Ex: Cabo Flexível 2.5mm"
                                value={itemForm.name}
                                onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                value={itemForm.categoryId}
                                onValueChange={v => setItemForm({ ...itemForm, categoryId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {flatCategories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                    {flatCategories.length === 0 && <div className="p-2 text-xs text-slate-400">Crie uma categoria primeiro</div>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Unidade</Label>
                                <Input
                                    placeholder="Ex: m, kg, un, h"
                                    value={itemForm.unit}
                                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Preço Unitário Base</Label>
                                <Input
                                    type="number"
                                    placeholder="0,00"
                                    value={itemForm.unitPrice}
                                    onChange={e => setItemForm({ ...itemForm, unitPrice: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição / Especificações</Label>
                            <Textarea
                                placeholder="Detalhes técnicos, marca sugerida..."
                                value={itemForm.description}
                                onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancelar</Button>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={handleSaveItem} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? 'Atualizar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
