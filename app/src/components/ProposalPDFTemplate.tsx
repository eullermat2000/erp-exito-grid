import React from 'react';


interface ProposalPDFTemplateProps {
    proposal: any;
    client: any;
}

export const ProposalPDFTemplate: React.FC<ProposalPDFTemplateProps> = ({ proposal, client }) => {
    const subtotal = proposal.items?.reduce((sum: number, item: any) => sum + Number(item.total), 0) || 0;
    const total = subtotal - Number(proposal.discount || 0);

    return (
        <div id="proposal-pdf-content" className="p-10 bg-white text-slate-800 font-sans max-w-[800px] mx-auto">
            {/* Header / Logo Placeholder */}
            <div className="flex justify-between items-start border-b-2 border-amber-500 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">EPR ÊXITO</h1>
                    <p className="text-sm text-slate-500 font-medium">Engenharia Elétrica & Manutenção</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-amber-600">PROPOSTA COMERCIAL</h2>
                    <p className="text-sm font-semibold text-slate-700">#{proposal.proposalNumber}</p>
                    <p className="text-xs text-slate-400">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h3 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Cliente</h3>
                    <p className="text-lg font-bold text-slate-800">{client?.name || 'Cliente não identificado'}</p>
                    <p className="text-sm text-slate-600">{client?.email}</p>
                    <p className="text-sm text-slate-600">{client?.phone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h3 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Assunto</h3>
                    <p className="text-lg font-bold text-slate-800">{proposal.title}</p>
                    {proposal.validUntil && (
                        <p className="text-sm text-amber-600 font-medium mt-1">
                            Validade até: {new Date(proposal.validUntil).toLocaleDateString('pt-BR')}
                        </p>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <h3 className="text-sm uppercase font-bold text-slate-900 mb-4 border-l-4 border-amber-500 pl-3">Itens e Serviços</h3>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="py-3 px-4 text-xs font-bold uppercase text-slate-600">Descrição</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase text-slate-600 text-center">Qtd</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase text-slate-600 text-right">Preço Unit.</th>
                            <th className="py-3 px-4 text-xs font-bold uppercase text-slate-600 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proposal.items?.filter((it: any) => !it.parentId || it.showDetailedPrices).map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-100">
                                <td className={`py-4 px-4 text-sm ${item.isBundleParent ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                    {item.description}
                                    {item.notes && <p className="text-xs text-slate-400 font-normal mt-1">{item.notes}</p>}
                                </td>
                                <td className="py-4 px-4 text-sm text-center text-slate-600">{item.quantity}</td>
                                <td className="py-4 px-4 text-sm text-right text-slate-600">
                                    {item.isBundleParent ? '—' : `R$ ${Number(item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </td>
                                <td className={`py-4 px-4 text-sm text-right ${item.isBundleParent ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                    R$ {Number(item.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-10">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal:</span>
                        <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {Number(proposal.discount) > 0 && (
                        <div className="flex justify-between text-sm text-rose-500">
                            <span>Desconto:</span>
                            <span>- R$ {Number(proposal.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-slate-900 border-t-2 border-slate-200 pt-2">
                        <span>Total:</span>
                        <span className="text-amber-600">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Professional Sections */}
            <div className="space-y-6 mb-12">
                {proposal.scope && (
                    <div className="bg-slate-50 p-5 rounded-xl">
                        <h4 className="text-xs uppercase font-bold text-amber-600 mb-2 tracking-wider">Escopo do Serviço</h4>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{proposal.scope}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    {proposal.deadline && (
                        <div>
                            <h4 className="text-xs uppercase font-bold text-amber-600 mb-2 tracking-wider">Prazo de Execução</h4>
                            <p className="text-sm text-slate-700 font-medium">{proposal.deadline}</p>
                        </div>
                    )}
                    {proposal.paymentConditions && (
                        <div>
                            <h4 className="text-xs uppercase font-bold text-amber-600 mb-2 tracking-wider">Condições de Pagamento</h4>
                            <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{proposal.paymentConditions}</p>
                        </div>
                    )}
                </div>

                {proposal.obligations && (
                    <div>
                        <h4 className="text-xs uppercase font-bold text-amber-600 mb-2 tracking-wider">Obrigações das Partes</h4>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{proposal.obligations}</p>
                    </div>
                )}

                {proposal.notes && (
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Observações Adicionais</h4>
                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{proposal.notes}</p>
                    </div>
                )}
            </div>

            {/* Footer / Signature */}
            <div className="mt-20 pt-10 border-t border-slate-200">
                <div className="flex justify-between items-end">
                    <div className="text-xs text-slate-400">
                        <p className="font-bold text-slate-500 mb-1 italic">EPR ÊXITO - Engenharia e Serviços LTDA</p>
                        <p>CNPJ: 00.000.000/0001-00</p>
                        <p>Contato: contato@eprexito.com.br | (00) 0000-0000</p>
                    </div>
                    <div className="text-center w-64">
                        <div className="border-t border-slate-400 pt-2">
                            <p className="text-xs font-bold text-slate-600">Assinatura do Responsável</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">EPR ÊXITO Engenharia</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
