// types/invitation.ts
export interface Invitation {
  id: string;
  email: string;
  name: string | null;
  role: 'company_admin' | 'manager';
  token: string;
  invited_by: string;
  expires_at: string;
  accepted: boolean;
  accepted_at: string | null;
  last_sent_at: string;
  send_count: number;
  created_at: string;
  company: {
    company_name: string;
    subdomain: string;
  };
  status: 'pending' | 'expired' | 'accepted';
}

export interface InvitationsResponse {
  invitations: Invitation[];
}
