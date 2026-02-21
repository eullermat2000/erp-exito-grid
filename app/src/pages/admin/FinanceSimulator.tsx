import { useState, useMemo, useCallback } from 'react';
import {
    AlertTriangle, Eye, EyeOff, Calculator, TrendingUp,
    Star, Award, Filter, ChevronDown, ChevronUp,
    Sliders, Mail, MessageSquare, Printer, Download, CheckSquare,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SimInputs {
    serviceDescription: string;
    operationalCost: number;
    profitMargin: number;
    quantity: number;
    correctionIndex: 'IPCA' | 'CDI' | 'SELIC' | 'fixed';
    customRate: number;
    atSightDiscount: number;  // % sobre o lucro
    leasingSpread: number;    // % extra sobre o índice no leasing
    customEntry: number;
    customInstallments: number;
}

interface Condition {
    id: string;
    type: 'avista' | 'entrada' | 'total' | 'leasing' | 'personalizado';
    label: string;
    detail: string;
    entry: number;
    installmentAmount: number;
    installments: number;
    totalClient: number;
    // Internal
    costRecovered: number;
    totalProfit: number;
    immediateProfit: number;
    deferredProfit: number;
    effectiveMargin: number;
    correctionAmount: number;
    cashFlow: { month: number; value: number; cumulative: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const INDEX_RATES: Record<string, number> = { IPCA: 0.38, CDI: 0.87, SELIC: 0.87 };

const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pmt = (rate: number, nper: number, pv: number): number => {
    if (rate === 0) return pv / nper;
    const factor = Math.pow(1 + rate / 100, nper);
    return (pv * (rate / 100) * factor) / (factor - 1);
};

const buildCashFlow = (
    entry: number,
    installment: number,
    n: number,
    cost: number,
): { month: number; value: number; cumulative: number }[] => {
    const rows: { month: number; value: number; cumulative: number }[] = [];
    let cum = -cost; // empresa desembolsa o custo operacional imediatamente
    for (let m = 0; m <= n; m++) {
        const inflow = m === 0 ? entry : installment;
        cum += inflow;
        rows.push({ month: m, value: inflow, cumulative: cum });
    }
    return rows;
};

// ─── Simulation Engine ────────────────────────────────────────────────────────
function simulate(inputs: SimInputs): Condition[] {
    const rate =
        inputs.correctionIndex === 'fixed'
            ? inputs.customRate
            : INDEX_RATES[inputs.correctionIndex];

    const qty = inputs.quantity;
    const unitCost = inputs.operationalCost;
    const totalCost = unitCost * qty;
    const marginFactor = 1 - inputs.profitMargin / 100;
    const basePrice = totalCost / marginFactor;
    const grossProfit = basePrice - totalCost;

    const conditions: Condition[] = [];

    // 1. À Vista ──────────────────────────────────────────────────────────────
    const avistaProfitAfterDiscount = grossProfit * (1 - inputs.atSightDiscount / 100);
    const aVistaTotal = totalCost + avistaProfitAfterDiscount;
    const avistaDiscount = basePrice - aVistaTotal;
    const avistaMargin = (avistaProfitAfterDiscount / aVistaTotal) * 100;
    conditions.push({
        id: 'avista',
        type: 'avista',
        label: 'À Vista',
        detail: `Desconto de ${inputs.atSightDiscount}% sobre o lucro`,
        entry: aVistaTotal,
        installmentAmount: 0,
        installments: 0,
        totalClient: aVistaTotal,
        costRecovered: totalCost,
        totalProfit: avistaProfitAfterDiscount,
        immediateProfit: avistaProfitAfterDiscount,
        deferredProfit: 0,
        effectiveMargin: avistaMargin,
        correctionAmount: 0,
        cashFlow: buildCashFlow(aVistaTotal, 0, 0, totalCost),
    });

    // 2. Entrada + Parcelas do Lucro ──────────────────────────────────────────
    for (const n of [3, 6, 10, 12]) {
        const installment = pmt(rate, n, grossProfit);
        const totalPaid = totalCost + installment * n;
        const correctionAmt = totalPaid - basePrice;
        const totalProfit = totalPaid - totalCost;
        conditions.push({
            id: `entrada_${n}`,
            type: 'entrada',
            label: `Entrada + ${n}x`,
            detail: `Entrada cobre custo • lucro em ${n}x c/${INDEX_RATES['fixed'] ?? rate}% a.m.`,
            entry: totalCost,
            installmentAmount: installment,
            installments: n,
            totalClient: totalPaid,
            costRecovered: totalCost,
            totalProfit,
            immediateProfit: 0,
            deferredProfit: totalProfit,
            effectiveMargin: (totalProfit / totalPaid) * 100,
            correctionAmount: correctionAmt,
            cashFlow: buildCashFlow(totalCost, installment, n, totalCost),
        });
    }

    // 3. Parcelamento Total (Tabela Price) ────────────────────────────────────
    for (const n of [6, 10, 12, 18, 24]) {
        const installment = pmt(rate, n, basePrice);
        const totalPaid = installment * n;
        const totalProfit = totalPaid - totalCost;
        conditions.push({
            id: `price_${n}`,
            type: 'total',
            label: `Tabela Price ${n}x`,
            detail: `Parcelamento total • Taxa ${rate}% a.m.`,
            entry: 0,
            installmentAmount: installment,
            installments: n,
            totalClient: totalPaid,
            costRecovered: totalCost,
            totalProfit,
            immediateProfit: 0,
            deferredProfit: totalProfit,
            effectiveMargin: (totalProfit / totalPaid) * 100,
            correctionAmount: totalPaid - basePrice,
            cashFlow: buildCashFlow(0, installment, n, totalCost),
        });
    }

    // 4. Leasing Mensal ────────────────────────────────────────────────────────
    const leasingRate = rate + inputs.leasingSpread;
    for (const months of [12, 24, 36]) {
        const monthly = pmt(leasingRate, months, basePrice);
        const totalPaid = monthly * months;
        const totalProfit = totalPaid - totalCost;
        conditions.push({
            id: `leasing_${months}`,
            type: 'leasing',
            label: `Leasing ${months}m`,
            detail: `Mensalidade fixa • ${leasingRate.toFixed(2)}% a.m. (spread de ${inputs.leasingSpread}%)`,
            entry: 0,
            installmentAmount: monthly,
            installments: months,
            totalClient: totalPaid,
            costRecovered: totalCost,
            totalProfit,
            immediateProfit: 0,
            deferredProfit: totalProfit,
            effectiveMargin: (totalProfit / totalPaid) * 100,
            correctionAmount: totalPaid - basePrice,
            cashFlow: buildCashFlow(0, monthly, months, totalCost),
        });
    }

    // 5. Personalizado ────────────────────────────────────────────────────────
    const minEntry = totalCost * 0.5;
    const safeEntry = Math.max(inputs.customEntry, minEntry);
    const remaining = basePrice - safeEntry;
    const n = inputs.customInstallments;
    const customInstallment = remaining <= 0 ? 0 : pmt(rate, n, remaining);
    const customTotal = safeEntry + customInstallment * n;
    const customProfit = customTotal - totalCost;
    conditions.push({
        id: 'personalizado',
        type: 'personalizado',
        label: 'Personalizado',
        detail: `Entrada R$ ${fmt(safeEntry)} + ${n}x ${rate}% a.m.`,
        entry: safeEntry,
        installmentAmount: customInstallment,
        installments: n,
        totalClient: customTotal,
        costRecovered: Math.min(safeEntry, totalCost),
        totalProfit: customProfit,
        immediateProfit: Math.max(0, safeEntry - totalCost),
        deferredProfit: customInstallment * n,
        effectiveMargin: (customProfit / customTotal) * 100,
        correctionAmount: customTotal - basePrice,
        cashFlow: buildCashFlow(safeEntry, customInstallment, n, totalCost),
    });

    return conditions;
}

// ─── Gauge Component ──────────────────────────────────────────────────────────
function MarginGauge({ value }: { value: number }) {
    const color = value >= 30 ? '#22c55e' : value >= 15 ? '#eab308' : '#ef4444';
    const label = value >= 30 ? 'Excelente' : value >= 15 ? 'Aceitável' : 'Baixa';
    const pct = Math.min(Math.max(value, 0), 60);
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-24 h-12">
                <svg viewBox="0 0 100 55" className="w-full h-full">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" stroke="#374151" strokeWidth="10" fill="none" />
                    <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        stroke={color}
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${(pct / 60) * 125.6} 125.6`}
                    />
                </svg>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-mono font-bold" style={{ color }}>
                    {value.toFixed(1)}%
                </span>
            </div>
            <span className="text-xs" style={{ color }}>{label}</span>
        </div>
    );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: { month: number; cumulative: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="cumulative" stroke="#06b6d4" strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ─── Select helper ────────────────────────────────────────────────────────────
function DarkSelect({ value, onChange, children }: {
    value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
        >
            {children}
        </select>
    );
}

function DarkInput({ label, value, onChange, prefix, step = '1', min = '0' }: {
    label: string; value: number; onChange: (v: number) => void;
    prefix?: string; step?: string; min?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
                <input
                    type="number"
                    step={step}
                    min={min}
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value) || 0)}
                    className={`bg-gray-800 border border-gray-600 text-cyan-300 font-mono rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full ${prefix ? 'pl-8 pr-3' : 'px-3'}`}
                />
            </div>
        </div>
    );
}

// ─── Type badges ─────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
    avista: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    entrada: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    total: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    leasing: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    personalizado: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const TYPE_LABEL: Record<string, string> = {
    avista: 'À Vista',
    entrada: 'Entrada',
    total: 'Tabela Price',
    leasing: 'Leasing',
    personalizado: 'Custom',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinanceSimulator() {
    const [inputs, setInputs] = useState<SimInputs>({
        serviceDescription: 'Locação de Munck — Serviço Elétrico',
        operationalCost: 8500,
        profitMargin: 35,
        quantity: 1,
        correctionIndex: 'CDI',
        customRate: 1.0,
        atSightDiscount: 5,
        leasingSpread: 0.5,
        customEntry: 4500,
        customInstallments: 6,
    });

    const [viewMode, setViewMode] = useState<'internal' | 'client'>('internal');
    const [selectedId, setSelectedId] = useState<string | null>('avista');
    const [filterType, setFilterType] = useState<string>('all');
    const [showInputs, setShowInputs] = useState(true);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const toggleChecked = useCallback((id: string) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const upd = useCallback(<K extends keyof SimInputs>(key: K, val: SimInputs[K]) => {
        setInputs(prev => ({ ...prev, [key]: val }));
    }, []);

    const conditions = useMemo(() => simulate(inputs), [inputs]);

    const filteredConditions = useMemo(() =>
        filterType === 'all' ? conditions : conditions.filter(c => c.type === filterType),
        [conditions, filterType]);

    const bestClientTotal = useMemo(() =>
        Math.min(...conditions.map(c => c.totalClient)), [conditions]);

    const bestMarginId = useMemo(() => {
        const best = conditions.reduce((a, b) => a.effectiveMargin > b.effectiveMargin ? a : b);
        return best.id;
    }, [conditions]);

    const selectedCondition = conditions.find(c => c.id === selectedId);

    const basePrice = inputs.operationalCost * inputs.quantity / (1 - inputs.profitMargin / 100);
    const grossProfit = basePrice - inputs.operationalCost * inputs.quantity;

    const checkedConditions = useMemo(() =>
        conditions.filter(c => checkedIds.has(c.id)), [conditions, checkedIds]);

    const buildCommercialText = useCallback(() => {
        const conds = checkedConditions.length > 0 ? checkedConditions : (selectedCondition ? [selectedCondition] : []);
        if (conds.length === 0) return '';
        const lines = [
            `PROPOSTA COMERCIAL — SIMULADOR DE INVESTIMENTO`,
            `${inputs.serviceDescription}`,
            ``,
            `Prezado(a) Cliente,`,
            ``,
            `Agradecemos o seu interesse em nossos serviços. Conforme solicitado, seguem as condições de investimento disponíveis para o serviço de ${inputs.serviceDescription}:`,
            ``,
            ...conds.map((c, i) => [
                `━━━ OPÇÃO ${i + 1}: ${c.label} ━━━`,
                c.entry > 0 ? `  • Entrada: R$ ${fmt(c.entry)}` : null,
                c.installmentAmount > 0 ? `  • ${c.installments}x parcelas de: R$ ${fmt(c.installmentAmount)}` : null,
                `  • Valor Total: R$ ${fmt(c.totalClient)}`,
                c.type === 'avista' ? `  • Desconto especial para pagamento à vista` : null,
                c.type === 'leasing' ? `  • Mensalidade fixa com taxa competitiva` : null,
                ``,
            ].filter(Boolean)).flat(),
            `Condições válidas por 15 dias a partir desta data.`,
            `Para mais informações ou para formalizar a contratação, entre em contato conosco.`,
            ``,
            `Atenciosamente,`,
            `Equipe Comercial — EXITO Engenharia`,
            `${new Date().toLocaleDateString('pt-BR')}`,
        ];
        return lines.join('\n');
    }, [checkedConditions, selectedCondition, inputs.serviceDescription]);

    const handlePrint = useCallback(() => {
        const text = buildCommercialText();
        if (!text) return;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<html><head><title>Proposta - ${inputs.serviceDescription}</title>
            <style>body{font-family:'Segoe UI',sans-serif;padding:40px;line-height:1.8;color:#1a1a1a;max-width:700px;margin:0 auto}
            h1{font-size:18px;border-bottom:2px solid #0891b2;padding-bottom:8px;color:#0891b2}
            pre{white-space:pre-wrap;font-family:inherit;font-size:14px}</style>
            </head><body><h1>PROPOSTA COMERCIAL</h1><pre>${text}</pre></body></html>`);
        w.document.close();
        w.print();
    }, [buildCommercialText, inputs.serviceDescription]);

    const handleSavePDF = useCallback(() => { handlePrint(); }, [handlePrint]);

    const handleWhatsApp = useCallback(() => {
        const text = buildCommercialText();
        if (!text) return;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }, [buildCommercialText]);

    const handleEmail = useCallback(() => {
        const text = buildCommercialText();
        if (!text) return;
        const subject = `Proposta Comercial — ${inputs.serviceDescription}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, '_blank');
    }, [buildCommercialText, inputs.serviceDescription]);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 -m-6 p-6">
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Calculator className="w-6 h-6 text-cyan-400" />
                        <h1 className="text-2xl font-bold text-white tracking-tight">Simulador de Investimento</h1>
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-mono rounded-full border border-yellow-500/30">
                            MUNCK ERP
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">{inputs.serviceDescription || 'Configure os inputs abaixo'}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Toggle visão */}
                    <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('internal')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'internal' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <Eye className="w-4 h-4" /> Interna
                        </button>
                        <button
                            onClick={() => setViewMode('client')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'client' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <EyeOff className="w-4 h-4" /> Cliente
                        </button>
                    </div>
                    <button
                        onClick={() => setShowInputs(v => !v)}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                        <Sliders className="w-4 h-4" />
                        {showInputs ? 'Ocultar' : 'Mostrar'} Inputs
                        {showInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* ── Alerta visão interna ───────────────────────────────────────────── */}
            {viewMode === 'internal' && (
                <div className="flex items-center gap-3 bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-5 text-red-300 text-sm">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold uppercase tracking-wide">Visão Interna — NÃO COMPARTILHAR COM O CLIENTE</span>
                    <span className="text-red-400">• Exibe custos, margens e lucros diferenciados</span>
                </div>
            )}

            {/* ── Inputs ─────────────────────────────────────────────────────────── */}
            {showInputs && (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Parâmetros do Serviço</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Descrição do Serviço</label>
                            <input
                                type="text"
                                value={inputs.serviceDescription}
                                onChange={e => upd('serviceDescription', e.target.value)}
                                className="bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Ex: Locação de Munck — Obra XYZ"
                            />
                        </div>
                        <DarkInput label="Quantidade" value={inputs.quantity} onChange={v => upd('quantity', v)} min="1" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <DarkInput label="Custo Operacional" value={inputs.operationalCost} onChange={v => upd('operationalCost', v)} prefix="R$" step="100" />
                        <DarkInput label="Margem de Lucro" value={inputs.profitMargin} onChange={v => upd('profitMargin', Math.min(v, 95))} prefix="%" step="0.5" />
                        <DarkInput label="Desconto À Vista (sobre lucro)" value={inputs.atSightDiscount} onChange={v => upd('atSightDiscount', v)} prefix="%" step="0.5" />
                        <DarkInput label="Spread Leasing" value={inputs.leasingSpread} onChange={v => upd('leasingSpread', v)} prefix="%" step="0.1" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Índice de Correção</label>
                            <DarkSelect value={inputs.correctionIndex} onChange={v => upd('correctionIndex', v as SimInputs['correctionIndex'])}>
                                <option value="CDI">CDI (~0.87% a.m.)</option>
                                <option value="SELIC">SELIC (~0.87% a.m.)</option>
                                <option value="IPCA">IPCA (~0.38% a.m.)</option>
                                <option value="fixed">Taxa Fixa</option>
                            </DarkSelect>
                        </div>
                        {inputs.correctionIndex === 'fixed' && (
                            <DarkInput label="Taxa Fixa (% a.m.)" value={inputs.customRate} onChange={v => upd('customRate', v)} prefix="%" step="0.1" />
                        )}
                        <DarkInput label="Entrada Personalizada" value={inputs.customEntry} onChange={v => upd('customEntry', v)} prefix="R$" step="100" />
                        <DarkInput label="Parcelas (Personalizado)" value={inputs.customInstallments} onChange={v => upd('customInstallments', Math.max(1, v))} min="1" />
                    </div>

                    {/* Summary bar */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
                        <div className="bg-gray-800 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Preço Base</p>
                            <p className="font-mono font-bold text-white text-lg">R$ {fmt(basePrice)}</p>
                        </div>
                        <div className="bg-rose-950/50 border border-rose-800/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Custo Total</p>
                            <p className="font-mono font-bold text-rose-400 text-lg">R$ {fmt(inputs.operationalCost * inputs.quantity)}</p>
                        </div>
                        <div className="bg-emerald-950/50 border border-emerald-800/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Lucro Bruto</p>
                            <p className="font-mono font-bold text-emerald-400 text-lg">R$ {fmt(grossProfit)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter ─────────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-gray-500" />
                {['all', 'avista', 'entrada', 'total', 'leasing', 'personalizado'].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterType === t
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400'
                            }`}
                    >
                        {t === 'all' ? 'Todas' : TYPE_LABEL[t]}
                    </button>
                ))}
                <span className="ml-auto text-xs text-gray-500">{filteredConditions.length} condições</span>
            </div>

            {/* ── Export Action Bar ────────────────────────────────────────────── */}
            {checkedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-4 bg-cyan-950/40 border border-cyan-700/50 rounded-xl px-4 py-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium">
                        <CheckSquare className="w-4 h-4" />
                        {checkedIds.size} condição(ões) selecionada(s)
                    </div>
                    <div className="flex-1" />
                    <button onClick={handleWhatsApp} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <MessageSquare className="w-4 h-4" /> WhatsApp
                    </button>
                    <button onClick={handleEmail} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <Mail className="w-4 h-4" /> E-mail
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    <button onClick={handleSavePDF} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <Download className="w-4 h-4" /> Salvar PDF
                    </button>
                </div>
            )}

            {/* ── Cards Grid + Detail ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredConditions.map(cond => {
                        const isBestClient = cond.totalClient === bestClientTotal;
                        const isBestMargin = cond.id === bestMarginId;
                        const isSelected = selectedId === cond.id;

                        return (
                            <div
                                key={cond.id}
                                className={`text-left bg-gray-900 rounded-xl border transition-all p-4 relative overflow-hidden group cursor-pointer ${isSelected
                                    ? 'border-cyan-500 shadow-cyan-500/20 shadow-lg'
                                    : 'border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleChecked(cond.id); }}
                                    className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-all z-10 ${checkedIds.has(cond.id)
                                        ? 'bg-cyan-500 border-cyan-500 text-white'
                                        : 'border-gray-500 hover:border-cyan-400'
                                        }`}
                                >
                                    {checkedIds.has(cond.id) && <CheckSquare className="w-3.5 h-3.5" />}
                                </button>

                                <div onClick={() => setSelectedId(cond.id)}>
                                    {/* Badges */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                        {viewMode === 'internal' && isBestMargin && (
                                            <span className="flex items-center gap-1 bg-emerald-900/80 border border-emerald-600/50 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                                                <Award className="w-3 h-3" /> Maior Margem
                                            </span>
                                        )}
                                        {viewMode === 'client' && isBestClient && (
                                            <span className="flex items-center gap-1 bg-yellow-900/80 border border-yellow-600/50 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                                                <Star className="w-3 h-3" /> Melhor Condição
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[cond.type]}`}>
                                            {TYPE_LABEL[cond.type]}
                                        </span>
                                    </div>
                                    <p className="font-bold text-white text-base mb-0.5">{cond.label}</p>
                                    <p className="text-xs text-gray-500 mb-3">{cond.detail}</p>

                                    {/* Client view */}
                                    {viewMode === 'client' ? (
                                        <div className="space-y-1">
                                            {cond.entry > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-yellow-400">Entrada</span>
                                                    <span className="font-mono text-yellow-300">R$ {fmt(cond.entry)}</span>
                                                </div>
                                            )}
                                            {cond.installmentAmount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-cyan-400">{cond.installments}x de</span>
                                                    <span className="font-mono text-cyan-300">R$ {fmt(cond.installmentAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-700">
                                                <span className="text-gray-200">Total</span>
                                                <span className="font-mono text-white">R$ {fmt(cond.totalClient)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        // Internal view
                                        <div className="space-y-1">
                                            {cond.entry > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-yellow-400">Entrada</span>
                                                    <span className="font-mono text-yellow-300">R$ {fmt(cond.entry)}</span>
                                                </div>
                                            )}
                                            {cond.installmentAmount > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-cyan-400">{cond.installments}x de</span>
                                                    <span className="font-mono text-cyan-300">R$ {fmt(cond.installmentAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xs">
                                                <span className="text-emerald-400">Lucro</span>
                                                <span className="font-mono text-emerald-300">R$ {fmt(cond.totalProfit)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold border-t border-gray-700 pt-1">
                                                <span className="text-white">Margem Ef.</span>
                                                <span className={`font-mono ${cond.effectiveMargin >= 30 ? 'text-emerald-400' : cond.effectiveMargin >= 15 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                                    {cond.effectiveMargin.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sparkline */}
                                    <div className="mt-2 opacity-70">
                                        <Sparkline data={cond.cashFlow} />
                                    </div>

                                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Detail Panel */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 h-fit sticky top-24">
                    {!selectedCondition ? (
                        <div className="text-center text-gray-500 py-8">
                            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Selecione uma condição para ver detalhes</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-bold text-white text-lg">{selectedCondition.label}</p>
                                    <p className="text-xs text-gray-400">{selectedCondition.detail}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[selectedCondition.type]}`}>
                                    {TYPE_LABEL[selectedCondition.type]}
                                </span>
                            </div>

                            {/* Client section */}
                            <div className="bg-gray-800/60 border border-gray-600 rounded-lg p-4 mb-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> Proposta ao Cliente
                                </p>
                                <div className="space-y-2">
                                    {selectedCondition.entry > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-yellow-400">Entrada</span>
                                            <span className="font-mono font-bold text-yellow-300">R$ {fmt(selectedCondition.entry)}</span>
                                        </div>
                                    )}
                                    {selectedCondition.installmentAmount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-cyan-400">{selectedCondition.installments}x de</span>
                                            <span className="font-mono font-bold text-cyan-300">R$ {fmt(selectedCondition.installmentAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-gray-600 pt-2">
                                        <span className="text-sm font-semibold text-white">Total</span>
                                        <span className="font-mono font-bold text-white text-lg">R$ {fmt(selectedCondition.totalClient)}</span>
                                    </div>
                                    {selectedCondition.type === 'avista' && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-yellow-400">Desconto</span>
                                            <span className="font-mono text-yellow-300">
                                                R$ {fmt(basePrice - selectedCondition.totalClient)} ({((basePrice - selectedCondition.totalClient) / basePrice * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Internal section */}
                            {viewMode === 'internal' && (
                                <>
                                    <div className="bg-red-950/40 border border-red-800/30 rounded-lg p-4 mb-3">
                                        <p className="text-xs text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Eye className="w-3.5 h-3.5" /> Visão Interna
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-rose-400">Custo Recuperado</span>
                                                <span className="font-mono text-rose-300">R$ {fmt(selectedCondition.costRecovered)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-emerald-400">Lucro Total</span>
                                                <span className="font-mono text-emerald-300">R$ {fmt(selectedCondition.totalProfit)}</span>
                                            </div>
                                            {selectedCondition.immediateProfit > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-yellow-400">└ Lucro Imediato</span>
                                                    <span className="font-mono text-yellow-300">R$ {fmt(selectedCondition.immediateProfit)}</span>
                                                </div>
                                            )}
                                            {selectedCondition.deferredProfit > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-purple-400">└ Lucro Diferido</span>
                                                    <span className="font-mono text-purple-300">R$ {fmt(selectedCondition.deferredProfit)}</span>
                                                </div>
                                            )}
                                            {selectedCondition.correctionAmount > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-400">Correção Monetária</span>
                                                    <span className="font-mono text-gray-300">R$ {fmt(selectedCondition.correctionAmount)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gauge */}
                                    <div className="flex items-center justify-between bg-gray-800/60 border border-gray-600 rounded-lg p-4 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Margem Efetiva</p>
                                            <p className="text-2xl font-mono font-bold text-white">{selectedCondition.effectiveMargin.toFixed(1)}%</p>
                                        </div>
                                        <MarginGauge value={selectedCondition.effectiveMargin} />
                                    </div>

                                    {/* Cash flow chart */}
                                    <div className="bg-gray-800/60 border border-gray-600 rounded-lg p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Fluxo de Caixa Acumulado
                                        </p>
                                        <ResponsiveContainer width="100%" height={120}>
                                            <LineChart data={selectedCondition.cashFlow} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `M${v}`} />
                                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                                <Tooltip
                                                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                                                    formatter={(v: number) => [`R$ ${fmt(v)}`, 'Cumulativo']}
                                                    labelFormatter={(l: number) => `Mês ${l}`}
                                                />
                                                <Line type="monotone" dataKey="cumulative" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
