import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('electraflow_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('electraflow_token');
          localStorage.removeItem('electraflow_user');
          window.location.href = '/login';
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (error.response?.status === 403) {
          toast.error('Você não tem permissão para realizar esta ação.');
        } else if (error.response?.status === 500) {
          toast.error('Erro no servidor. Tente novamente mais tarde.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: { name: string; email: string; password: string; role?: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Users
  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  async createUser(data: any) {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: any) {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // Clients
  async getClients() {
    const response = await this.client.get('/clients');
    return response.data;
  }

  async getClient(id: string) {
    const response = await this.client.get(`/clients/${id}`);
    return response.data;
  }

  async createClient(data: any) {
    const response = await this.client.post('/clients', data);
    return response.data;
  }

  async updateClient(id: string, data: any) {
    const response = await this.client.put(`/clients/${id}`, data);
    return response.data;
  }

  async addClientDocument(clientId: string, data: any) {
    const response = await this.client.post(`/clients/${clientId}/documents`, data);
    return response.data;
  }

  async updateClientDocument(id: string, data: any) {
    const response = await this.client.put(`/clients/documents/${id}`, data);
    return response.data;
  }

  async removeClientDocument(id: string) {
    const response = await this.client.delete(`/clients/documents/${id}`);
    return response.data;
  }

  async fetchCnpjData(cnpj: string) {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    return response.data;
  }

  async deleteClient(id: string) {
    const response = await this.client.delete(`/clients/${id}`);
    return response.data;
  }

  // Works
  async getWorks() {
    const response = await this.client.get('/works');
    return response.data;
  }

  async getActiveWorks() {
    const response = await this.client.get('/works/active');
    return response.data;
  }

  async getMyWorks() {
    const response = await this.client.get('/works/my-works');
    return response.data;
  }

  async getWork(id: string) {
    const response = await this.client.get(`/works/${id}`);
    return response.data;
  }

  async createWork(data: any) {
    const response = await this.client.post('/works', data);
    return response.data;
  }

  async updateWork(id: string, data: any) {
    const response = await this.client.put(`/works/${id}`, data);
    return response.data;
  }

  async updateWorkProgress(id: string, progress: number) {
    const response = await this.client.post(`/works/${id}/progress`, { progress });
    return response.data;
  }

  async deleteWork(id: string) {
    const response = await this.client.delete(`/works/${id}`);
    return response.data;
  }

  async getWorkUpdates(id: string) {
    const response = await this.client.get(`/works/${id}/updates`);
    return response.data;
  }

  async createWorkUpdate(id: string, formData: FormData) {
    const response = await this.client.post(`/works/${id}/updates`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Tasks
  async getTasks() {
    const response = await this.client.get('/tasks');
    return response.data;
  }

  async getMyTasks() {
    const response = await this.client.get('/tasks/my-tasks');
    return response.data;
  }

  async getMyPendingTasks() {
    const response = await this.client.get('/tasks/my-pending');
    return response.data;
  }

  async getTasksByWork(workId: string) {
    const response = await this.client.get(`/tasks/by-work/${workId}`);
    return response.data;
  }

  async getTask(id: string) {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(data: any) {
    const response = await this.client.post('/tasks', data);
    return response.data;
  }

  async updateTask(id: string, data: any) {
    const response = await this.client.put(`/tasks/${id}`, data);
    return response.data;
  }

  async updateTaskProgress(id: string, progress: number) {
    const response = await this.client.put(`/tasks/${id}/progress`, { progress });
    return response.data;
  }

  async updateTaskChecklist(id: string, checklist: any[]) {
    const response = await this.client.put(`/tasks/${id}/checklist`, { checklist });
    return response.data;
  }

  async deleteTask(id: string) {
    const response = await this.client.delete(`/tasks/${id}`);
    return response.data;
  }
  // Opportunities
  async getOpportunities(stage?: string) {
    const params = stage ? { stage } : {};
    const response = await this.client.get('/opportunities', { params });
    return response.data;
  }

  async getOpportunity(id: string) {
    const response = await this.client.get(`/opportunities/${id}`);
    return response.data;
  }

  async createOpportunity(data: any) {
    const response = await this.client.post('/opportunities', data);
    return response.data;
  }

  async updateOpportunity(id: string, data: any) {
    const response = await this.client.put(`/opportunities/${id}`, data);
    return response.data;
  }

  async moveOpportunityStage(id: string, stage: string) {
    const response = await this.client.post(`/opportunities/${id}/move`, { stage });
    return response.data;
  }

  async deleteOpportunity(id: string) {
    const response = await this.client.delete(`/opportunities/${id}`);
    return response.data;
  }

  // Documents
  async getDocuments(filters?: { workId?: string; type?: string; folderId?: string; proposalId?: string }) {
    const response = await this.client.get('/documents', { params: filters });
    return response.data;
  }

  async getDocumentsByWork(workId: string) {
    const response = await this.client.get(`/documents/by-work/${workId}`);
    return response.data;
  }

  async getDocument(id: string) {
    const response = await this.client.get(`/documents/${id}`);
    return response.data;
  }

  async createDocument(data: any) {
    const response = await this.client.post('/documents', data);
    return response.data;
  }

  async updateDocument(id: string, data: any) {
    const response = await this.client.put(`/documents/${id}`, data);
    return response.data;
  }

  async uploadDocuments(files: File[], data?: { workId?: string; taskId?: string; type?: string; folderId?: string }) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (data?.workId) formData.append('workId', data.workId);
    if (data?.taskId) formData.append('taskId', data.taskId);
    if (data?.type) formData.append('type', data.type);
    if (data?.folderId) formData.append('folderId', data.folderId);

    const response = await this.client.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async downloadDocument(id: string) {
    const response = await this.client.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteDocument(id: string) {
    const response = await this.client.delete(`/documents/${id}`);
    return response.data;
  }

  // Document Folders
  async getDocumentFolders(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/documents/folders/list', { params });
    return response.data;
  }

  async getRootFolders(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/documents/folders/root', { params });
    return response.data;
  }

  async getDocumentFolder(id: string) {
    const response = await this.client.get(`/documents/folders/${id}`);
    return response.data;
  }

  async createDocumentFolder(data: { name: string; workId?: string; parentId?: string }) {
    const response = await this.client.post('/documents/folders', data);
    return response.data;
  }

  async updateDocumentFolder(id: string, data: any) {
    const response = await this.client.put(`/documents/folders/${id}`, data);
    return response.data;
  }

  async deleteDocumentFolder(id: string) {
    const response = await this.client.delete(`/documents/folders/${id}`);
    return response.data;
  }

  // Workflow Config
  async getWorkflowConfigs() {
    const response = await this.client.get('/workflow-config');
    return response.data;
  }

  async getWorkflowConfig(id: string) {
    const response = await this.client.get(`/workflow-config/${id}`);
    return response.data;
  }

  async getWorkflowByType(workType: string) {
    const response = await this.client.get(`/workflow-config/by-type/${workType}`);
    return response.data;
  }

  async getWorkflowTemplate(workType: string) {
    const response = await this.client.get(`/workflow-config/template/${workType}`);
    return response.data;
  }

  async createWorkflowConfig(data: any) {
    const response = await this.client.post('/workflow-config', data);
    return response.data;
  }

  async updateWorkflowConfig(id: string, data: any) {
    const response = await this.client.put(`/workflow-config/${id}`, data);
    return response.data;
  }

  async deleteWorkflowConfig(id: string) {
    const response = await this.client.delete(`/workflow-config/${id}`);
    return response.data;
  }

  async validateDeadline(data: { workType: string; stage: string; stepName: string; proposedDays: number }) {
    const response = await this.client.post('/workflow-config/validate-deadline', data);
    return response.data;
  }

  // Deadline Approvals
  async getDeadlineApprovals() {
    const response = await this.client.get('/deadline-approvals');
    return response.data;
  }

  async getPendingAdminApprovals() {
    const response = await this.client.get('/deadline-approvals/pending-admin');
    return response.data;
  }

  async getPendingClientApprovals() {
    const response = await this.client.get('/deadline-approvals/pending-client');
    return response.data;
  }

  async getMyDeadlineRequests() {
    const response = await this.client.get('/deadline-approvals/my-requests');
    return response.data;
  }

  async getDeadlineApprovalsByWork(workId: string) {
    const response = await this.client.get(`/deadline-approvals/by-work/${workId}`);
    return response.data;
  }

  async createDeadlineApproval(data: any) {
    const response = await this.client.post('/deadline-approvals', data);
    return response.data;
  }

  async adminApprove(id: string, data: { status: 'approved' | 'rejected'; adminNotes?: string }) {
    const response = await this.client.put(`/deadline-approvals/${id}/admin-approve`, data);
    return response.data;
  }

  async clientApprove(id: string, data: { approved: boolean; clientNotes?: string }) {
    const response = await this.client.put(`/deadline-approvals/${id}/client-approve`, data);
    return response.data;
  }

  async cancelDeadlineApproval(id: string) {
    const response = await this.client.delete(`/deadline-approvals/${id}`);
    return response.data;
  }

  // Dashboard
  async getAdminDashboard() {
    const response = await this.client.get('/dashboard/admin');
    return response.data;
  }

  async getEmployeeDashboard() {
    const response = await this.client.get('/dashboard/employee');
    return response.data;
  }

  async getClientDashboard() {
    const response = await this.client.get('/dashboard/client');
    return response.data;
  }

  // Proposals
  async getProposals(status?: string) {
    const params = status ? { status } : {};
    const response = await this.client.get('/proposals', { params });
    return response.data;
  }

  async getProposal(id: string) {
    const response = await this.client.get(`/proposals/${id}`);
    return response.data;
  }

  async createProposal(data: { proposal: any; items: any[] }) {
    const response = await this.client.post('/proposals', data);
    return response.data;
  }

  async updateProposal(id: string, data: any) {
    const response = await this.client.put(`/proposals/${id}`, data);
    return response.data;
  }

  async updateProposalItems(id: string, items: any[]) {
    const response = await this.client.put(`/proposals/${id}/items`, { items });
    return response.data;
  }

  async sendProposal(id: string) {
    const response = await this.client.post(`/proposals/${id}/send`);
    return response.data;
  }

  async acceptProposal(id: string) {
    const response = await this.client.post(`/proposals/${id}/accept`);
    return response.data;
  }

  async rejectProposal(id: string, reason?: string) {
    const response = await this.client.post(`/proposals/${id}/reject`, { reason });
    return response.data;
  }

  async deleteProposal(id: string) {
    const response = await this.client.delete(`/proposals/${id}`);
    return response.data;
  }

  // Catalog
  async getCatalogCategories(type?: string) {
    const params = type ? { type } : {};
    const response = await this.client.get('/catalog/categories', { params });
    return response.data;
  }

  async getCatalogCategoryTree(type?: string) {
    const params = type ? { type } : {};
    const response = await this.client.get('/catalog/categories/tree', { params });
    return response.data;
  }

  async createCatalogCategory(data: any) {
    const response = await this.client.post('/catalog/categories', data);
    return response.data;
  }

  async updateCatalogCategory(id: string, data: any) {
    const response = await this.client.put(`/catalog/categories/${id}`, data);
    return response.data;
  }

  async deleteCatalogCategory(id: string) {
    const response = await this.client.delete(`/catalog/categories/${id}`);
    return response.data;
  }

  async getCatalogItems(filters?: { type?: string; categoryId?: string }) {
    const response = await this.client.get('/catalog/items', { params: filters });
    return response.data;
  }

  async getCatalogCategoryItems(categoryId: string) {
    const response = await this.client.get(`/catalog/categories/${categoryId}/items`);
    return response.data;
  }

  async searchCatalogItems(query: string, type?: string): Promise<any[]> {
    const params: any = { q: query };
    if (type) params.type = type;
    const response = await this.client.get('/catalog/search', { params });
    return response.data;
  }

  async createCatalogItem(data: any) {
    const response = await this.client.post('/catalog/items', data);
    return response.data;
  }

  async updateCatalogItem(id: string, data: any) {
    const response = await this.client.put(`/catalog/items/${id}`, data);
    return response.data;
  }

  async deleteCatalogItem(id: string) {
    const response = await this.client.delete(`/catalog/items/${id}`);
    return response.data;
  }

  // Protocols
  async getProtocols(status?: string) {
    const params = status ? { status } : {};
    const response = await this.client.get('/protocols', { params });
    return response.data;
  }

  async getProtocol(id: string) {
    const response = await this.client.get(`/protocols/${id}`);
    return response.data;
  }

  async findOneProtocol(id: string) {
    const response = await this.client.get(`/protocols/${id}`);
    return response.data;
  }

  async createProtocol(data: any) {
    const response = await this.client.post('/protocols', data);
    return response.data;
  }

  async updateProtocol(id: string, data: any) {
    const response = await this.client.put(`/protocols/${id}`, data);
    return response.data;
  }

  async addProtocolEvent(id: string, data: any) {
    const response = await this.client.post(`/protocols/${id}/events`, data);
    return response.data;
  }

  async updateProtocolEvent(eventId: string, data: any) {
    const response = await this.client.put(`/protocols/events/${eventId}`, data);
    return response.data;
  }

  async addProtocolAttachment(eventId: string, data: any) {
    const response = await this.client.post(`/protocols/attachment/${eventId}`, data);
    return response.data;
  }

  async deleteProtocol(id: string) {
    const response = await this.client.delete(`/protocols/${id}`);
    return response.data;
  }

  // Employees
  async getEmployees() {
    const response = await this.client.get('/employees');
    return response.data;
  }

  async getEmployee(id: string) {
    const response = await this.client.get(`/employees/${id}`);
    return response.data;
  }

  async createEmployee(data: any) {
    const response = await this.client.post('/employees', data);
    return response.data;
  }

  async updateEmployee(id: string, data: any) {
    const response = await this.client.put(`/employees/${id}`, data);
    return response.data;
  }

  async deleteEmployee(id: string) {
    const response = await this.client.delete(`/employees/${id}`);
    return response.data;
  }

  async addEmployeeDocument(employeeId: string, data: any) {
    const response = await this.client.post(`/employees/${employeeId}/documents`, data);
    return response.data;
  }

  async updateEmployeeDocument(id: string, data: any) {
    const response = await this.client.put(`/employees/documents/${id}`, data);
    return response.data;
  }

  async removeEmployeeDocument(id: string) {
    const response = await this.client.delete(`/employees/documents/${id}`);
    return response.data;
  }

  // Finance
  async getFinanceSummary() {
    const response = await this.client.get('/finance/summary');
    return response.data;
  }

  async getDREReport(startDate: string, endDate: string) {
    const response = await this.client.get('/finance/dre', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getPayments(status?: string, workId?: string) {
    const params: any = {};
    if (status) params.status = status;
    if (workId) params.workId = workId;
    const response = await this.client.get('/finance/payments', { params });
    return response.data;
  }

  async createPayment(data: any) {
    const response = await this.client.post('/finance/payments', data);
    return response.data;
  }

  async updatePayment(id: string, data: any) {
    const response = await this.client.put(`/finance/payments/${id}`, data);
    return response.data;
  }

  async deletePayment(id: string) {
    const response = await this.client.post(`/finance/payments/${id}/delete`);
    return response.data;
  }

  async registerPayment(id: string, data: { amount: number; method: string; transactionId?: string }) {
    const response = await this.client.post(`/finance/payments/${id}/register`, data);
    return response.data;
  }

  // Measurements
  async getMeasurements(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/measurements', { params });
    return response.data;
  }

  async getMeasurement(id: string) {
    const response = await this.client.get(`/measurements/${id}`);
    return response.data;
  }

  async createMeasurement(data: any) {
    const response = await this.client.post('/measurements', data);
    return response.data;
  }

  async calculateMeasurement(id: string) {
    const response = await this.client.post(`/measurements/${id}/calculate`);
    return response.data;
  }

  async approveMeasurement(id: string) {
    const response = await this.client.post(`/measurements/${id}/approve`);
    return response.data;
  }
}

export const api = new ApiService();
