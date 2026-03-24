import { createHttpClient } from './httpClient';

let authToken: string | null = null;

export const setAuthToken = (token: string) => { authToken = token; };
export const clearAuthToken = () => { authToken = null; };
const getToken = async (): Promise<string | null> => authToken;

const httpClient = createHttpClient(getToken);
httpClient.defaults.baseURL = `${process.env.NEXT_PUBLIC_API_URL}/api`;


export interface LoginRequest { email: string; password: string; }
export interface LoginResponse {
  message: string; token: string;
  user: { id: string; email: string; realtor_name: string; subscription_status: string; };
}

export const api = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },
};

export interface CurrentUser {
  id: string;
  realtor_name: string;
  realtor_company: string | null;
  realtor_phone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  agent_signature: string | null;
  subscription_status: string | null;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await httpClient.get('/auth/me');
  return response.data.user || response.data;
}

export interface Client {
  id: string; realtor_id: string; customer_name: string; email: string;
  phone: string; address: string; document_type: string; property_description: string;
  property_description_other: string | null; compensation_type: string;
  compensation_value: number; expiration_date: string; buyer_initials: string;
  signature_image: string | null; created_at: string;
}

export async function fetchClients(): Promise<{ clients: any[] }> {
  const response = await httpClient.get('/clients');
  return response.data;
}

export const tokenManager = {
  saveToken(_token: string) {}, saveRefreshToken(_refreshToken: string) {},
  saveUser(_user: any) {}, getToken() { return null; },
  getUser() { return null; }, clearAll() {},
};

export async function logout(): Promise<void> {
  try {
    await httpClient.post('/auth/logout');
  } catch {
    // ignore — server may 401 if token already expired
  } finally {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  }
}

export async function resendClientDocument(clientId: string) {
  const response = await httpClient.get(`/clients/${clientId}/resend`);
  return response.data;
}

export async function updateClient(clientId: string, payload: any) {
  const response = await httpClient.put(`/clients/${clientId}`, payload);
  return response.data;
}

export async function deleteClient(clientId: string) {
  const response = await httpClient.delete(`/clients/${clientId}`);
  return response.data;
}

export async function downloadClientPdf(clientId: string): Promise<string> {
  const response = await httpClient.get(`/clients/${clientId}/pdf`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export async function createClient(payload: any) {
  const response = await httpClient.post('/clients', payload);
  return response.data;
}

export interface UserProfile {
  id: string; realtor_name: string | null; realtorname: string | null;
  realtor_company: string | null; realtor_phone: string | null; email: string;
  address: string | null; city: string | null; state: string | null; zip: string | null;
  agent_signature: string | null; buyer_broker_agreement_url: string | null;
  exclusive_employment_agreement_url: string | null; subscription_status: string | null;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await httpClient.get('/auth/me');
  return response.data.user || response.data;
}

export async function updateUserProfile(formData: FormData) {
  const response = await httpClient.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function cancelSubscription() {
  const response = await httpClient.post('/payments/cancel-subscription');
  return response.data;
}

export interface ContractField {
  id: string; field_type: string; label: string; placeholder: string | null;
  is_required: boolean; signer_index: number; page_number: number;
  x_percent: number; y_percent: number; width_percent: number; height_percent: number;
  dropdown_options: string[] | null; sort_order: number; field_source: string | null;
}

export interface ContractTemplate {
  id: string; name: string; pdf_storage_path: string; contract_fields: ContractField[];
}

export async function fetchCompanyTemplates(): Promise<{ templates: ContractTemplate[] }> {
  const response = await httpClient.get('/contracts/templates');
  return response.data;
}

export interface CreateContractPayload {
  template_id: string; signing_mode: 'in_person' | 'remote';
  transaction_coordinator_email?: string;
  signers: { name: string; email: string; phone?: string; signer_index: number }[];
  field_values: { contract_field_id: string; signer_id?: string; field_label: string; field_type: string; value?: string; }[];
}

export async function createClientContract(clientId: string, payload: CreateContractPayload) {
  const response = await httpClient.post(`/clients/${clientId}/contracts`, payload);
  return response.data;
}

export async function submitClientContract(clientId: string, contractId: string, payload: { field_values: any[] }) {
  const response = await httpClient.post(`/clients/${clientId}/contracts/${contractId}/submit`, payload);
  return response.data;
}

export async function fetchClientContracts(clientId: string) {
  const response = await httpClient.get(`/clients/${clientId}/contracts`);
  return response.data;
}

export async function deleteClientContract(clientId: string, contractId: string) {
  const response = await httpClient.delete(`/clients/${clientId}/contracts/${contractId}`);
  return response.data;
}

export async function resendClientContract(clientId: string, contractId: string) {
  const response = await httpClient.post(`/clients/${clientId}/contracts/${contractId}/resend`, {});
  return response.data;
}

export async function completeClientContract(clientId: string, contractId: string) {
  const response = await httpClient.post(`/clients/${clientId}/contracts/${contractId}/complete`, {});
  return response.data;
}

export async function rejectClientContract(clientId: string, contractId: string, rejection_comment: string) {
  const response = await httpClient.post(`/clients/${clientId}/contracts/${contractId}/reject`, { rejection_comment });
  return response.data;
}

export async function fetchPublicContract(token: string) {
  const response = await httpClient.get(`/sign/${token}`);
  return response.data;
}

export async function submitPublicSignature(token: string, payload: { field_values: any[] }) {
  const response = await httpClient.post(`/sign/${token}`, payload);
  return response.data;
}

export interface UpdateContractPayload {
  transaction_coordinator_email?: string;
  signers: { id: string; name: string; email: string; phone?: string; signer_index: number }[];
  field_values: { contract_field_id: string; signer_id: string; field_label: string; field_type: string; value?: string; }[];
}

export async function updateClientContract(clientId: string, contractId: string, payload: UpdateContractPayload) {
  const response = await httpClient.put(`/clients/${clientId}/contracts/${contractId}`, payload);
  return response.data;
}

export async function fetchClientContract(clientId: string, contractId: string) {
  const response = await httpClient.get(`/clients/${clientId}/contracts/${contractId}`);
  return response.data;
}

export const searchAllClients = async (search?: string) => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await httpClient.get(`/clients/search${params}`);
  return res.data;
};
export async function downloadContractPDF(clientId: string, contractId: string, contractName?: string): Promise<void> {
  const response = await httpClient.get(
    `/clients/${clientId}/contracts/${contractId}/download-pdf`,
    { responseType: 'blob' }
  );
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contractName?.replace(/\s+/g, '_') || 'Contract'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

