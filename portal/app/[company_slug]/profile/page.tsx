'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UserCircleIcon, CameraIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { profileApi, UserProfile } from '@/lib/api/profile';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.company_slug as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const user = await profileApi.getProfile();
      setProfile(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        title: user.title || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedUser = await profileApi.updateProfile(formData);
      setProfile(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);

    try {
      await profileApi.updatePassword({
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Please upload a JPEG or PNG image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);

    try {
      const updatedUser = await profileApi.uploadProfilePicture(file);
      setProfile(updatedUser);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading picture:', error);
      toast.error(error.response?.data?.error || 'Failed to upload picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDeletePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setUploadingPicture(true);

    try {
      await profileApi.deleteProfilePicture();
      setProfile((prev) => (prev ? { ...prev, profile_picture_url: null } : null));
      toast.success('Profile picture removed successfully');
    } catch (error: any) {
      console.error('Error deleting picture:', error);
      toast.error(error.response?.data?.error || 'Failed to delete picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/${companySlug}/dashboard`)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account information and preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Picture Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h2>
          
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center">
                  <UserCircleIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="text-center">
                  <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPicture}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {uploadingPicture ? 'Uploading...' : 'Upload a photo'}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                </div>
              </div>

              {profile?.profile_picture_url && (
                <button
                  type="button"
                  onClick={handleDeletePicture}
                  disabled={uploadingPicture}
                  className="mt-3 text-sm text-red-600 hover:text-red-500"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title / Position
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={formData.title ? '' : 'e.g., Senior Manager, Team Lead'}
              />
              {!formData.title && (
                <p className="mt-1 text-xs text-amber-600">⚠️ No title on file</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={formData.phone ? '' : 'Not provided - Click to add'}
              />
              {!formData.phone && (
                <p className="mt-1 text-xs text-amber-600">⚠️ No phone number on file</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  required
                  minLength={8}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="block w-full px-4 py-3 pr-12 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="block w-full px-4 py-3 pr-12 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Re-enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Member Since</dt>
              <dd className="text-sm text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
