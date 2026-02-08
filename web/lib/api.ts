import { ApiClient, createHttpClient } from '@my-real-estate-app/shared';

const httpClient = createHttpClient();

export const api = new ApiClient(httpClient);

// ---------- Current user ----------

export interface CurrentUser {
  id: string;
  realtorname: string;
  realtorcompany: string | null;
  realtorphone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await httpClient.get('/auth/me');
  return response.data as CurrentUser;
}

// ---------- Clients ----------

export interface Client {
  id: string;
  realtor_id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  document_type: string;
  property_description: string;
  property_description_other: string | null;
  compensation_type: string;
  compensation_value: number;
  expiration_date: string;
  buyer_initials: string;
  signature_image: string | null;
  created_at: string;
  // add any other columns you use
}

export async function fetchClients(): Promise<Client[]> {
  const response = await httpClient.get('/clients'); // hits routes/clients.js
  // clientController.getClients returns { clients: [...] }
  return response.data.clients as Client[];
}

// ---------- Token manager (no-ops) ----------

export const tokenManager = {
  saveToken(_token: string) {},
  saveRefreshToken(_refreshToken: string) {},
  saveUser(_user: any) {},
  getToken() {
    return null;
  },
  getUser() {
    return null;
  },
  clearAll() {},
};
export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout');
}
export async function resendClientDocument(clientId: string) {
  // GET /clients/:id/resend
  const response = await httpClient.get(`/clients/${clientId}/resend`);
  return response.data;
}

export async function updateClient(
  clientId: string,
  payload: any
) {
  // PUT /clients/:clientId
  const response = await httpClient.put(`/clients/${clientId}`, payload);
  // clientController.updateClient returns the updated client as data[0]
  return response.data;
}
export async function deleteClient(clientId: string) {
  // DELETE /clients/:clientId
  const response = await httpClient.delete(`/clients/${clientId}`);
  return response.data;
}

export async function downloadClientPdf(clientId: string): Promise<string> {
  // GET /clients/:id/pdf, returns a PDF blob
  const response = await httpClient.get(`/clients/${clientId}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  return url;
}
export async function createClient(payload: any) {
  const response = await httpClient.post('/clients', payload);
  return response.data;
}
// ========== Profile Helpers ==========
export interface UserProfile {
  id: string;
  realtor_name: string | null;
  realtorname: string | null;  // for compatibility
  realtor_company: string | null;
  realtor_phone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  agent_signature: string | null;
  buyer_broker_agreement_url: string | null;
  exclusive_employment_agreement_url: string | null;
  subscription_status: string | null;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await httpClient.get('/auth/me');
  return response.data.user || response.data;
}

export async function updateUserProfile(formData: FormData) {
  // FormData requires special handling; httpClient should support it
  const response = await httpClient.put('/auth/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function cancelSubscription() {
  const response = await httpClient.post('/payments/cancel-subscription');
  return response.data;
}
