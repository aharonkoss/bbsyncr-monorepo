import { apiClient } from './client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  title: string;
  profile_picture_url: string | null;
  company_id: string;
  created_at: string;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdatePasswordData {
  newPassword: string;
}

export const profileApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/api/portal/profile');
    return response.data.user;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.put('/api/portal/profile', data);
    return response.data.user;
  },

  /**
   * Update password
   */
  updatePassword: async (data: UpdatePasswordData): Promise<void> => {
    await apiClient.put('/api/portal/profile/password', data);
  },

  /**
   * Upload profile picture
   */
  uploadProfilePicture: async (file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await apiClient.post('/api/portal/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.user;
  },

  /**
   * Delete profile picture
   */
  deleteProfilePicture: async (): Promise<void> => {
    await apiClient.delete('/api/portal/profile/picture');
  },
};
