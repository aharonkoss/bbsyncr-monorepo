// Auth Types
export interface User {
  id: string;
  email: string;
  realtorName: string;
  realtorCompany: string;
  realtorPhone: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  realtorName: string;
  realtorCompany: string;
  email: string;
  realtorPhone: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Client Types - UPDATED TO CAMELCASE
export interface Client {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  documentType: string;
  signatureImage?: string | null;
  createdAt: string;
    property_description?: string;
  property_description_other?: string;
  compensation_type?: string;
  compensation_value?: string;
  expiration_date?: string;
  retainer_fee?: string;
  days_of_execution?: string;
  buyer_initials?: string;
  signature_image?: string;
}

export interface ClientFormData {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  documentType: string;
  property_description?: string;
  property_description_other?: string;
  compensation_type?: string;
  compensation_value?: string;
  expiration_date?: string;
  retainer_fee?: string;
  days_of_execution?: string;
  buyer_initials?: string;
}

export interface CreateClientRequest extends ClientFormData {
  signature_image?: string;
}

export interface GetClientsResponse {
  clients: Client[];
}
