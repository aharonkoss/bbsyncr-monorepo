'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAgentModal({ isOpen, onClose, onSuccess }: AddAgentModalProps) {
  const [formData, setFormData] = useState({
    agent_email: '',
    agent_name: '',
    agent_phone: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/api/portal/agents', formData);
      const data = response.data || response; // Handle both wrapped and unwrapped responses
      
      if (data.status === 'joined') {
        toast.success(data.message || 'Agent added successfully!');
      } else if (data.status === 'pending') {
        toast.success(data.message || 'Invitation sent successfully!');
      }

      setFormData({ agent_email: '', agent_name: '', agent_phone: '' });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New Agent</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Agent Name */}
            <div>
              <label htmlFor="agent_name" className="block text-sm font-medium text-gray-700">
                Agent Name
              </label>
              <input
                id="agent_name"
                name="agent_name"
                type="text"
                required
                value={formData.agent_name}
                onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Enter agent's full name"
              />
            </div>

            {/* Agent Email */}
            <div>
              <label htmlFor="agent_email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="agent_email"
                name="agent_email"
                type="email"
                required
                value={formData.agent_email}
                onChange={(e) => setFormData({ ...formData, agent_email: e.target.value })}
                className="mt-1 block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="agent@example.com"
              />
            </div>

            {/* Agent Phone */}
            <div>
              <label htmlFor="agent_phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="agent_phone"
                name="agent_phone"
                type="tel"
                required
                value={formData.agent_phone}
                onChange={(e) => setFormData({ ...formData, agent_phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
