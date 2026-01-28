export interface User {
  id: string;
  email: string;
  name: string;
  title?: string | null;
  role: 'global_admin' | 'company_admin' | 'manager';
  company_id?: string | null;
  company?: Company | null;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  subdomain: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  company_id: string;
  manager_id: string;
  agent_email: string;
  agent_name: string;
  agent_phone?: string | null;
  status: 'pending' | 'active' | 'inactive';
  bbsynr_user_id?: string | null;
  invitation_sent_at: string;
  reminder_count: number;
  removed: boolean;
  company?: {
    company_name: string;
  };
  manager?: {
    name: string;
    email: string;
  };
}

export interface Invitation {
  id: string;
  email: string;
  name?: string | null;
  role: 'company_admin' | 'manager';
  token: string;
  expires_at: string;
  accepted: boolean;
}

export interface Analytics {
  overall: {
    total_agents: number;
    total_contracts: number;
    buyer_broker_agreements: number;
    exclusive_employment_agreements: number;
    exclusive_buyer_broker_agreements: number; 
  };
  agents: AgentStats[];
  filters: {
    start_date: string | null;
    end_date: string | null;
    document_type: string;
    manager_id: string | null;
  };
}

export interface AgentStats {
  agent_id: string;
  agent_name: string;
  agent_email: string;
  total_contracts: number;
  buyer_broker_agreements: number;
  exclusive_employment_agreements: number;
  exclusive_buyer_broker_agreements: number;
}

export interface Client {
  id: string;
  customer_name: string;
  email: string;
  phone?: string | null;
  document_type: 'buyer_broker_agreement' | 'exclusive_employment_agreement';
  document_url?: string | null;
  created_at: string;
  updated_at: string;
}
