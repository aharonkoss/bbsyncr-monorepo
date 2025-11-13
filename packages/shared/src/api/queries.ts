import { AxiosInstance } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  Client,
  CreateClientRequest,
} from '../types';

export class ApiClient {
  constructor(private httpClient: AxiosInstance) {}

  // ===== Auth Endpoints =====

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.httpClient.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  }

  async register(data: any): Promise<any> {
    const response = await this.httpClient.post('/api/auth/register', data);
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await this.httpClient.post('/api/auth/forgot-password', data);
    return response.data;
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await this.httpClient.post('/api/auth/reset-password', data);
    return response.data;
  }

  // ===== Client Endpoints =====

  async getClients(): Promise<Client[]> {
    const response = await this.httpClient.get<{ clients: Client[] }>('/api/clients');
    return response.data.clients;
  }

  async createClient(data: CreateClientRequest): Promise<Client> {
    // Map to API expected format
    const payload = {
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      document_type: data.documentType,  // Changed from documentType to document_type
      signature_image: data.signature_image,
      property_description: data.property_description,
      property_description_other: data.property_description_other,
      compensation_type: data.compensation_type,
      compensation_value: data.compensation_value,
      expiration_date: data.expiration_date,
      buyer_initials: data.buyer_initials,
      retainer_fee: data.retainer_fee,
      days_of_execution: data.days_of_execution,
    };
    
    const response = await this.httpClient.post<Client>('/api/clients', payload);
    return response.data;
  }
  // UPDATE client - NEW
    async updateClient(clientId: string, data: Partial<CreateClientRequest>): Promise<Client> {
      const payload = {
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        document_type: data.documentType,
        property_description: data.property_description,
        property_description_other: data.property_description_other,
        compensation_type: data.compensation_type,
        compensation_value: data.compensation_value,
        expiration_date: data.expiration_date,
        buyer_initials: data.buyer_initials,
        retainer_fee: data.retainer_fee,
        days_of_execution: data.days_of_execution,
      };
      
      const response = await this.httpClient.put<Client>(`/api/clients/${clientId}`, payload);
      return response.data;
    }

    // DELETE client - NEW
    async deleteClient(clientId: string): Promise<{ message: string }> {
      const response = await this.httpClient.delete<{ message: string }>(`/api/clients/${clientId}`);
      return response.data;
    }
  async getClientPdf(clientId: string): Promise<Blob> {
    console.log(`Requesting PDF for client: ${clientId}`);
    console.log(`Request URL: /api/clients/${clientId}/pdf`);
    
    try {
      const response = await this.httpClient.get(`/api/clients/${clientId}/pdf`, {
        responseType: 'blob',
      });
      
      console.log('PDF Response received:');
      console.log('- Content-Type:', response.headers['content-type']);
      console.log('- Blob size:', response.data.size, 'bytes');
      console.log('- Blob type:', response.data.type);
      
      return response.data;
    } catch (error) {
      console.error('Error getting PDF:', error);
      throw error;
    }
  }


  async downloadClientPdf(clientId: string): Promise<string> {
    const blob = await this.getClientPdf(clientId);
    return URL.createObjectURL(blob);
  }
  
}
