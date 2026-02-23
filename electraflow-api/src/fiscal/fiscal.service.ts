import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { FiscalConfig, FiscalInvoice, InvoiceType, InvoiceStatus } from './fiscal.entity';
import { Proposal } from '../proposals/proposal.entity';
import { NuvemFiscalService, NuvemFiscalConfig } from './nuvem-fiscal.service';

@Injectable()
export class FiscalService {
    private readonly logger = new Logger(FiscalService.name);

    constructor(
        @InjectRepository(FiscalConfig)
        private configRepo: Repository<FiscalConfig>,
        @InjectRepository(FiscalInvoice)
        private invoiceRepo: Repository<FiscalInvoice>,
        @InjectRepository(Proposal)
        private proposalRepo: Repository<Proposal>,
        private nuvemFiscal: NuvemFiscalService,
    ) { }

    // ═══════════════════════════════════════════════════════════════
    // HELPER: Obter config da Nuvem Fiscal
    // ═══════════════════════════════════════════════════════════════

    private getNuvemConfig(config: FiscalConfig): NuvemFiscalConfig {
        if (!config.fiscalApiClientId || !config.fiscalApiClientSecret) {
            throw new BadRequestException(
                'Client ID e Client Secret da Nuvem Fiscal não configurados. Vá em Configuração Fiscal.',
            );
        }
        return {
            clientId: config.fiscalApiClientId,
            clientSecret: config.fiscalApiClientSecret,
            sandbox: config.fiscalApiEnvironment !== 'production',
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO FISCAL
    // ═══════════════════════════════════════════════════════════════

    async getConfig(): Promise<FiscalConfig> {
        const configs = await this.configRepo.find();
        if (configs.length === 0) {
            const newConfig = this.configRepo.create({
                canInvoiceMaterial: false,
                canInvoiceService: false,
                fiscalApiProvider: 'nuvem_fiscal',
                fiscalApiEnvironment: 'sandbox',
            });
            return this.configRepo.save(newConfig);
        }
        return configs[0];
    }

    async updateConfig(data: Partial<FiscalConfig>): Promise<FiscalConfig> {
        const config = await this.getConfig();
        Object.assign(config, data);
        return this.configRepo.save(config);
    }

    async uploadCertificate(
        filename: string,
        originalName: string,
        password: string,
    ): Promise<FiscalConfig> {
        const config = await this.getConfig();
        config.certificateFile = filename;
        config.certificateOriginalName = originalName;
        config.certificatePassword = password;
        config.certificateUploadedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        config.certificateExpiresAt = expiresAt;
        const saved = await this.configRepo.save(config);

        // Sincronizar certificado com Nuvem Fiscal se configurado
        if (config.fiscalApiProvider === 'nuvem_fiscal' && config.fiscalApiClientId && config.cnpj) {
            try {
                const nuvemConfig = this.getNuvemConfig(config);
                const filePath = path.join('./uploads/certificates', filename);
                await this.nuvemFiscal.cadastrarCertificadoFromFile(
                    nuvemConfig,
                    config.cnpj.replace(/\D/g, ''),
                    filePath,
                    password,
                );
                this.logger.log('Certificado sincronizado com Nuvem Fiscal');
            } catch (error) {
                this.logger.warn('Não foi possível sincronizar certificado com Nuvem Fiscal:', error.message);
            }
        }

        return saved;
    }

    async removeCertificate(): Promise<FiscalConfig> {
        const config = await this.getConfig();
        config.certificateFile = null;
        config.certificateOriginalName = null;
        config.certificatePassword = null;
        config.certificateExpiresAt = null;
        config.certificateUploadedAt = null;
        return this.configRepo.save(config);
    }

    // ═══════════════════════════════════════════════════════════════
    // CADASTRAR EMPRESA NA NUVEM FISCAL
    // ═══════════════════════════════════════════════════════════════

    async syncCompanyToNuvemFiscal(): Promise<any> {
        const config = await this.getConfig();
        const nuvemConfig = this.getNuvemConfig(config);

        if (!config.cnpj) {
            throw new BadRequestException('CNPJ da empresa não configurado');
        }

        const cnpjLimpo = config.cnpj.replace(/\D/g, '');

        // Tenta consultar se a empresa já está cadastrada
        try {
            const existing = await this.nuvemFiscal.consultarEmpresa(nuvemConfig, cnpjLimpo);
            this.logger.log('Empresa já cadastrada na Nuvem Fiscal, atualizando...');
            return this.nuvemFiscal.alterarEmpresa(nuvemConfig, cnpjLimpo, {
                cpf_cnpj: cnpjLimpo,
                inscricao_estadual: config.stateRegistration || '',
                inscricao_municipal: config.municipalRegistration || '',
                nome_razao_social: config.companyName || '',
                endereco: {
                    logradouro: config.companyAddress || '',
                    cidade: config.companyCity || '',
                    uf: config.companyState || '',
                    cep: (config.companyCep || '').replace(/\D/g, ''),
                },
            });
        } catch {
            // Empresa não existe, cadastrar
            this.logger.log('Cadastrando empresa na Nuvem Fiscal...');
            return this.nuvemFiscal.cadastrarEmpresa(nuvemConfig, {
                cpf_cnpj: cnpjLimpo,
                inscricao_estadual: config.stateRegistration || '',
                inscricao_municipal: config.municipalRegistration || '',
                nome_razao_social: config.companyName || '',
                endereco: {
                    logradouro: config.companyAddress || '',
                    cidade: config.companyCity || '',
                    uf: config.companyState || '',
                    cep: (config.companyCep || '').replace(/\D/g, ''),
                },
            });
        }
    }

    async configureNuvemFiscalServices(): Promise<any> {
        const config = await this.getConfig();
        const nuvemConfig = this.getNuvemConfig(config);
        const cnpjLimpo = config.cnpj.replace(/\D/g, '');
        const ambiente = config.fiscalApiEnvironment === 'production' ? 'producao' : 'homologacao';
        const results: any = {};

        if (config.canInvoiceMaterial) {
            try {
                results.nfe = await this.nuvemFiscal.configurarNfe(nuvemConfig, cnpjLimpo, {
                    serie: 1,
                    numero: 1,
                    ambiente,
                });
                this.logger.log('NF-e configurada na Nuvem Fiscal');
            } catch (e) {
                results.nfeError = e.message;
            }
        }

        if (config.canInvoiceService) {
            try {
                results.nfse = await this.nuvemFiscal.configurarNfse(nuvemConfig, cnpjLimpo, {
                    rps: { lote: 1, serie: 'NF', numero: 1 },
                    ambiente,
                });
                this.logger.log('NFS-e configurada na Nuvem Fiscal');
            } catch (e) {
                results.nfseError = e.message;
            }
        }

        return results;
    }

    // ═══════════════════════════════════════════════════════════════
    // NOTAS FISCAIS
    // ═══════════════════════════════════════════════════════════════

    async findAllInvoices(filters?: {
        type?: InvoiceType;
        status?: InvoiceStatus;
        proposalId?: string;
    }): Promise<FiscalInvoice[]> {
        const query = this.invoiceRepo.createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.proposal', 'proposal')
            .leftJoinAndSelect('proposal.client', 'client')
            .orderBy('invoice.createdAt', 'DESC');

        if (filters?.type) {
            query.andWhere('invoice.type = :type', { type: filters.type });
        }
        if (filters?.status) {
            query.andWhere('invoice.status = :status', { status: filters.status });
        }
        if (filters?.proposalId) {
            query.andWhere('invoice.proposalId = :proposalId', { proposalId: filters.proposalId });
        }

        return query.getMany();
    }

    async findOneInvoice(id: string): Promise<FiscalInvoice> {
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: ['proposal', 'proposal.client', 'proposal.items'],
        });
        if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');
        return invoice;
    }

    async getProposalPreview(proposalId: string) {
        const proposal = await this.proposalRepo.findOne({
            where: { id: proposalId },
            relations: ['items', 'client'],
        });
        if (!proposal) throw new NotFoundException('Proposta não encontrada');

        const config = await this.getConfig();

        const materialItems = proposal.items.filter(
            (item) => item.serviceType === 'material',
        );
        const serviceItems = proposal.items.filter(
            (item) => item.serviceType === 'service' || item.serviceType === 'servico',
        );

        const materialTotal = materialItems.reduce(
            (sum, item) => sum + Number(item.total || 0), 0,
        );
        const serviceTotal = serviceItems.reduce(
            (sum, item) => sum + Number(item.total || 0), 0,
        );

        const existingInvoices = await this.invoiceRepo.find({
            where: { proposalId },
        });

        const hasNfe = existingInvoices.some(
            (inv) => inv.type === InvoiceType.NFE && inv.status !== InvoiceStatus.CANCELLED,
        );
        const hasNfse = existingInvoices.some(
            (inv) => inv.type === InvoiceType.NFSE && inv.status !== InvoiceStatus.CANCELLED,
        );

        return {
            proposal: {
                id: proposal.id,
                proposalNumber: proposal.proposalNumber,
                title: proposal.title,
                status: proposal.status,
                client: proposal.client ? {
                    id: proposal.client.id,
                    name: proposal.client.name,
                    document: proposal.client.document,
                    address: proposal.client.address,
                    city: proposal.client.city,
                    state: proposal.client.state,
                    zipCode: proposal.client.zipCode,
                } : null,
            },
            material: {
                items: materialItems,
                total: materialTotal,
                canInvoice: config.canInvoiceMaterial,
                alreadyInvoiced: hasNfe,
            },
            service: {
                items: serviceItems,
                total: serviceTotal,
                canInvoice: config.canInvoiceService,
                alreadyInvoiced: hasNfse,
            },
            existingInvoices,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // EMISSÃO DE NOTA FISCAL (COM NUVEM FISCAL)
    // ═══════════════════════════════════════════════════════════════

    async createInvoice(
        proposalId: string,
        type: InvoiceType,
        fiscalOptions?: {
            naturezaOperacao?: string;
            finalidadeNfe?: number;
            cfopCode?: string;
        },
    ): Promise<FiscalInvoice> {
        const config = await this.getConfig();

        if (type === InvoiceType.NFE && !config.canInvoiceMaterial) {
            throw new BadRequestException('Empresa não habilitada para NF-e (materiais)');
        }
        if (type === InvoiceType.NFSE && !config.canInvoiceService) {
            throw new BadRequestException('Empresa não habilitada para NFS-e (serviços)');
        }
        if (!config.certificateFile) {
            throw new BadRequestException('Certificado digital não configurado');
        }

        const proposal = await this.proposalRepo.findOne({
            where: { id: proposalId },
            relations: ['items', 'client'],
        });
        if (!proposal) throw new NotFoundException('Proposta não encontrada');

        const invoiceItems = proposal.items.filter((item) => {
            if (type === InvoiceType.NFE) return item.serviceType === 'material';
            return item.serviceType === 'service' || item.serviceType === 'servico';
        });

        if (invoiceItems.length === 0) {
            throw new BadRequestException(
                `A proposta não possui itens do tipo ${type === InvoiceType.NFE ? 'material' : 'serviço'}`,
            );
        }

        const totalValue = invoiceItems.reduce(
            (sum, item) => sum + Number(item.total || 0), 0,
        );

        const description = invoiceItems
            .map((item) => `${item.description} - Qtd: ${item.quantity} x R$ ${Number(item.unitPrice).toFixed(2)}`)
            .join('; ');

        // Criar registro local
        const invoice = this.invoiceRepo.create({
            proposalId,
            type,
            status: InvoiceStatus.PROCESSING,
            totalValue,
            description,
            issueDate: new Date(),
            recipientName: proposal.client?.name || '',
            recipientDocument: proposal.client?.document || '',
            recipientAddress: proposal.client?.address || '',
            items: invoiceItems.map((item) => ({
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
            })),
            naturezaOperacao: fiscalOptions?.naturezaOperacao || 'Venda de mercadoria',
            finalidadeNfe: fiscalOptions?.finalidadeNfe || 1,
            cfopCode: fiscalOptions?.cfopCode || '',
        });

        const saved = await this.invoiceRepo.save(invoice);

        // Emitir via Nuvem Fiscal
        if (config.fiscalApiProvider === 'nuvem_fiscal' && config.fiscalApiClientId) {
            try {
                const nuvemConfig = this.getNuvemConfig(config);
                const cnpjLimpo = config.cnpj?.replace(/\D/g, '') || '';
                const ambiente = config.fiscalApiEnvironment === 'production' ? 'producao' : 'homologacao';

                let result: any;

                if (type === InvoiceType.NFE) {
                    result = await this.emitirNfeViaNuvem(nuvemConfig, config, proposal, invoiceItems, totalValue, cnpjLimpo, ambiente, saved.id, saved.naturezaOperacao, saved.finalidadeNfe);
                } else {
                    result = await this.emitirNfseViaNuvem(nuvemConfig, config, proposal, invoiceItems, totalValue, cnpjLimpo, ambiente, saved.id);
                }

                // Atualizar invoice com dados da Nuvem Fiscal
                saved.externalId = result.id;
                saved.status = result.status === 'autorizado'
                    ? InvoiceStatus.AUTHORIZED
                    : result.status === 'rejeitado' || result.status === 'erro'
                        ? InvoiceStatus.ERROR
                        : InvoiceStatus.PROCESSING;
                saved.externalResponse = JSON.stringify(result);

                if (result.chave_acesso) saved.accessKey = result.chave_acesso;
                if (result.numero) saved.invoiceNumber = String(result.numero);

                await this.invoiceRepo.save(saved);
                this.logger.log(`NF emitida via Nuvem Fiscal — ID: ${result.id}, Status: ${result.status}`);
            } catch (error) {
                saved.status = InvoiceStatus.ERROR;
                saved.errorMessage = error.message || JSON.stringify(error);
                await this.invoiceRepo.save(saved);
                this.logger.error('Erro ao emitir NF via Nuvem Fiscal:', error);
            }
        } else {
            // Sem API, fica como rascunho
            saved.status = InvoiceStatus.DRAFT;
            await this.invoiceRepo.save(saved);
        }

        return saved;
    }

    private async emitirNfeViaNuvem(
        nuvemConfig: NuvemFiscalConfig,
        config: FiscalConfig,
        proposal: Proposal,
        items: any[],
        total: number,
        cnpj: string,
        ambiente: string,
        refInterna: string,
        naturezaOperacao?: string,
        finalidadeNfe?: number,
    ) {
        const detItems = items.map((item, index) => ({
            nItem: index + 1,
            prod: {
                cProd: String(index + 1).padStart(3, '0'),
                cEAN: 'SEM GTIN',
                xProd: item.description,
                NCM: item.ncm || '85444900', // NCM do produto ou padrão
                CFOP: item.cfopInterno || '5102',
                uCom: item.unit || 'UN',
                qCom: Number(item.quantity),
                vUnCom: Number(item.unitPrice),
                vProd: Number(item.total),
                cEANTrib: 'SEM GTIN',
                uTrib: item.unit || 'UN',
                qTrib: Number(item.quantity),
                vUnTrib: Number(item.unitPrice),
                indTot: 1,
            },
            imposto: {
                ICMS: { ICMSSN102: { orig: item.origem ?? 0, CSOSN: '102' } },
                PIS: { PISNT: { CST: '07' } },
                COFINS: { COFINSNT: { CST: '07' } },
            },
        }));

        const clientDoc = proposal.client?.document?.replace(/\D/g, '') || '';
        const isClientCnpj = clientDoc.length === 14;

        const nfeData = {
            ambiente: ambiente === 'producao' ? 'producao' : 'homologacao',
            referencia: `nfe-${refInterna}`,
            infNFe: {
                versao: '4.00',
                ide: {
                    cUF: 26, // TODO: derivar da UF do config
                    natOp: naturezaOperacao || 'Venda de mercadoria',
                    mod: 55,
                    serie: 1,
                    dhEmi: new Date().toISOString(),
                    tpNF: 1,
                    idDest: 1,
                    cMunFG: config.codigoMunicipio || '2611606',
                    tpImp: 1,
                    tpEmis: 1,
                    finNFe: finalidadeNfe || 1,
                    indFinal: 1,
                    indPres: 1,
                    procEmi: 0,
                    verProc: '1.0',
                },
                emit: {
                    CNPJ: cnpj,
                    xNome: config.companyName || '',
                    enderEmit: {
                        xLgr: config.companyAddress || '',
                        xBairro: 'Centro',
                        cMun: config.codigoMunicipio || '2611606',
                        xMun: config.nomeMunicipio || config.companyCity || 'Recife',
                        UF: config.companyState || 'PE',
                        CEP: (config.companyCep || '').replace(/\D/g, ''),
                        cPais: '1058',
                        xPais: 'Brasil',
                    },
                    IE: config.stateRegistration || '',
                    CRT: config.crt || 1,
                },
                dest: {
                    ...(isClientCnpj ? { CNPJ: clientDoc } : { CPF: clientDoc }),
                    xNome: proposal.client?.name || 'Consumidor',
                    enderDest: {
                        xLgr: proposal.client?.address || '',
                        xBairro: 'Centro',
                        cMun: config.codigoMunicipio || '2611606',
                        xMun: proposal.client?.city || config.nomeMunicipio || 'Recife',
                        UF: proposal.client?.state || 'PE',
                        CEP: (proposal.client?.zipCode || '').replace(/\D/g, ''),
                        cPais: '1058',
                        xPais: 'Brasil',
                    },
                    indIEDest: 9,
                },
                det: detItems,
                total: {
                    ICMSTot: {
                        vBC: 0, vICMS: 0, vICMSDeson: 0, vFCP: 0,
                        vBCST: 0, vST: 0, vFCPST: 0, vFCPSTRet: 0,
                        vProd: total, vFrete: 0, vSeg: 0, vDesc: 0,
                        vII: 0, vIPI: 0, vIPIDevol: 0, vPIS: 0,
                        vCOFINS: 0, vOutro: 0, vNF: total,
                    },
                },
                transp: { modFrete: 9 },
                pag: { detPag: [{ tPag: '01', vPag: total }] },
                infRespTec: {
                    CNPJ: cnpj,
                    xContato: 'Suporte ERP',
                    email: 'suporte@erp.com.br',
                    fone: '81999999999',
                },
            },
        };

        return this.nuvemFiscal.emitirNfe(nuvemConfig, nfeData);
    }

    private async emitirNfseViaNuvem(
        nuvemConfig: NuvemFiscalConfig,
        config: FiscalConfig,
        proposal: Proposal,
        items: any[],
        total: number,
        cnpj: string,
        ambiente: string,
        refInterna: string,
    ) {
        const clientDoc = proposal.client?.document?.replace(/\D/g, '') || '';
        const isClientCnpj = clientDoc.length === 14;
        const descricaoServicos = items.map(i => `${i.description} (Qtd: ${i.quantity})`).join('; ');

        const aliquotaIss = Number(config.aliquotaIss || 5);
        const vIss = total * (aliquotaIss / 100);
        const cMun = config.codigoMunicipio || '2611606';
        const xMun = config.nomeMunicipio || config.companyCity || 'Recife';

        // Calcula retenções
        const retencoes: any = {};
        let totalRetencoes = 0;

        if (config.retIss) {
            retencoes.vRetISS = vIss;
            totalRetencoes += vIss;
        }
        if (config.retIrpj) {
            const vRetIr = total * (Number(config.aliquotaIrpj || 1.5) / 100);
            retencoes.vRetIR = vRetIr;  // IRRF (Imposto de Renda Retido na Fonte)
            totalRetencoes += vRetIr;
        }
        if (config.retCsll) {
            const vRetCsll = total * (Number(config.aliquotaCsll || 1.0) / 100);
            retencoes.vRetCSLL = vRetCsll;
            totalRetencoes += vRetCsll;
        }
        if (config.retPis) {
            const vRetPis = total * (Number(config.aliquotaPis || 0.65) / 100);
            retencoes.vRetPIS = vRetPis;
            totalRetencoes += vRetPis;
        }
        if (config.retCofins) {
            const vRetCofins = total * (Number(config.aliquotaCofins || 3.0) / 100);
            retencoes.vRetCOFINS = vRetCofins;
            totalRetencoes += vRetCofins;
        }
        if (config.retInss) {
            const vRetInss = total * (Number(config.aliquotaInss || 11.0) / 100);
            retencoes.vRetINSS = vRetInss;
            totalRetencoes += vRetInss;
        }

        const nfseData = {
            ambiente: ambiente === 'producao' ? 'producao' : 'homologacao',
            referencia: `nfse-${refInterna}`,
            DPS: {
                infDPS: {
                    tpAmb: ambiente === 'producao' ? 1 : 2,
                    dhEmi: new Date().toISOString(),
                    verAplic: '1.0',
                    serie: 'NF',
                    nDPS: 1,
                    dCompet: new Date().toISOString().split('T')[0],
                    prest: {
                        CNPJ: cnpj,
                        IM: config.municipalRegistration || '',
                    },
                    toma: {
                        ...(isClientCnpj ? { CNPJ: clientDoc } : { CPF: clientDoc }),
                        xNome: proposal.client?.name || 'Consumidor',
                        end: {
                            xLgr: proposal.client?.address || '',
                            xBairro: 'Centro',
                            cMun: proposal.client?.ibgeCode || cMun,  // Código IBGE do município do TOMADOR (fallback: emitente)
                            UF: proposal.client?.state || config.companyState || 'PE',
                            CEP: (proposal.client?.zipCode || '').replace(/\D/g, ''),
                        },
                        email: '',
                    },
                    serv: {
                        cServ: {
                            cTribNac: config.codigoTribNacional || '01.01.01',
                            cTribMun: config.codigoServico || undefined,
                            CNAE: config.cnae || undefined,
                            xDescServ: descricaoServicos,
                        },
                        vServ: total,
                        vDesc: 0,
                        vLiq: total - totalRetencoes,
                    },
                    valores: {
                        vCalcDR: total,
                        tpBM: 1,
                        vBC: total,
                        pAliqAplic: aliquotaIss,
                        vISS: vIss,
                        tpRet: config.retIss ? 2 : 1, // 1=Não retido, 2=Retido
                        ...retencoes,
                    },
                    // Construção civil — CNO (obrigatório quando aplicável)
                    ...(config.cno ? { obra: { CNO: config.cno } } : {}),
                    // Regime Especial de Tributação
                    ...(config.regEspTrib != null ? { regEspTrib: config.regEspTrib } : {}),
                },
            },
        };

        return this.nuvemFiscal.emitirNfse(nuvemConfig, nfseData);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONSULTA DE STATUS (Polling)
    // ═══════════════════════════════════════════════════════════════

    async checkInvoiceStatus(id: string): Promise<FiscalInvoice> {
        const invoice = await this.findOneInvoice(id);
        if (!invoice.externalId) return invoice;
        if (invoice.status === InvoiceStatus.AUTHORIZED || invoice.status === InvoiceStatus.CANCELLED) {
            return invoice; // Status final, não precisa consultar
        }

        const config = await this.getConfig();
        if (config.fiscalApiProvider !== 'nuvem_fiscal' || !config.fiscalApiClientId) return invoice;

        const nuvemConfig = this.getNuvemConfig(config);

        try {
            let result: any;
            if (invoice.type === InvoiceType.NFE) {
                result = await this.nuvemFiscal.consultarNfe(nuvemConfig, invoice.externalId);
            } else {
                result = await this.nuvemFiscal.consultarNfse(nuvemConfig, invoice.externalId);
            }

            invoice.externalResponse = JSON.stringify(result);

            if (result.status === 'autorizado') {
                invoice.status = InvoiceStatus.AUTHORIZED;
                if (result.chave_acesso) invoice.accessKey = result.chave_acesso;
                if (result.numero) invoice.invoiceNumber = String(result.numero);
            } else if (result.status === 'rejeitado' || result.status === 'erro') {
                invoice.status = InvoiceStatus.ERROR;
                invoice.errorMessage = result.motivo || result.mensagem_sefaz || 'Rejeitada pela SEFAZ/Prefeitura';
            }

            await this.invoiceRepo.save(invoice);
        } catch (error) {
            this.logger.error('Erro ao consultar status:', error);
        }

        return invoice;
    }

    // ═══════════════════════════════════════════════════════════════
    // DOWNLOAD XML / PDF
    // ═══════════════════════════════════════════════════════════════

    async downloadXml(id: string): Promise<string> {
        const invoice = await this.findOneInvoice(id);
        if (!invoice.externalId) throw new BadRequestException('Nota fiscal não emitida via API fiscal');

        const config = await this.getConfig();
        const nuvemConfig = this.getNuvemConfig(config);

        if (invoice.type === InvoiceType.NFE) {
            return this.nuvemFiscal.downloadXmlNfe(nuvemConfig, invoice.externalId);
        }
        return this.nuvemFiscal.downloadXmlNfse(nuvemConfig, invoice.externalId);
    }

    async downloadPdf(id: string): Promise<Buffer> {
        const invoice = await this.findOneInvoice(id);
        if (!invoice.externalId) throw new BadRequestException('Nota fiscal não emitida via API fiscal');

        const config = await this.getConfig();
        const nuvemConfig = this.getNuvemConfig(config);

        if (invoice.type === InvoiceType.NFE) {
            return this.nuvemFiscal.downloadPdfNfe(nuvemConfig, invoice.externalId);
        }
        return this.nuvemFiscal.downloadPdfNfse(nuvemConfig, invoice.externalId);
    }

    // ═══════════════════════════════════════════════════════════════
    // CANCELAMENTO
    // ═══════════════════════════════════════════════════════════════

    async cancelInvoice(id: string, reason: string): Promise<FiscalInvoice> {
        const invoice = await this.findOneInvoice(id);
        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw new BadRequestException('Nota fiscal já está cancelada');
        }

        // Cancelar na Nuvem Fiscal se houver ID externo
        if (invoice.externalId) {
            const config = await this.getConfig();
            if (config.fiscalApiProvider === 'nuvem_fiscal' && config.fiscalApiClientId) {
                const nuvemConfig = this.getNuvemConfig(config);
                try {
                    if (invoice.type === InvoiceType.NFE) {
                        await this.nuvemFiscal.cancelarNfe(nuvemConfig, invoice.externalId, reason);
                    } else {
                        await this.nuvemFiscal.cancelarNfse(nuvemConfig, invoice.externalId, reason);
                    }
                } catch (error) {
                    this.logger.error('Erro ao cancelar na Nuvem Fiscal:', error);
                    throw new BadRequestException(error.message || 'Erro ao cancelar na Nuvem Fiscal');
                }
            }
        }

        invoice.status = InvoiceStatus.CANCELLED;
        invoice.cancelledAt = new Date();
        invoice.cancellationReason = reason;
        return this.invoiceRepo.save(invoice);
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTAR CONEXÃO
    // ═══════════════════════════════════════════════════════════════

    async testConnection(): Promise<any> {
        const config = await this.getConfig();

        if (!config.fiscalApiClientId || !config.fiscalApiClientSecret) {
            return {
                success: false,
                message: 'Client ID e Client Secret não configurados. Configure as credenciais da Nuvem Fiscal primeiro.',
                environment: config.fiscalApiEnvironment,
            };
        }

        try {
            const nuvemConfig = this.getNuvemConfig(config);

            // Tenta obter token para validar credenciais
            await this.nuvemFiscal.getToken(nuvemConfig);

            // Busca cotas
            const cotas = await this.nuvemFiscal.consultarCotas(nuvemConfig);

            return {
                success: true,
                message: 'Conexão com Nuvem Fiscal estabelecida com sucesso!',
                environment: config.fiscalApiEnvironment,
                cotas: cotas?.data || cotas,
            };
        } catch (error: any) {
            this.logger.error('Falha no teste de conexão com Nuvem Fiscal:', error?.message);
            return {
                success: false,
                message: error?.response?.data?.message
                    || error?.message
                    || 'Falha ao conectar com a Nuvem Fiscal. Verifique Client ID, Client Secret e ambiente.',
                environment: config.fiscalApiEnvironment,
            };
        }
    }
}
