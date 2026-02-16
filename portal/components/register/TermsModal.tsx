'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  if (!isOpen) return null;

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Terms of Service</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-500">Last Updated: January 16, 2026</p>

              <h3 className="text-lg font-semibold mt-6">1. Acceptance of Terms</h3>
              <p>
                By accessing and using BBsynr ("the Service"), you accept and agree to be bound by
                the terms and provision of this agreement. If you do not agree to these terms,
                please do not use the Service.
              </p>

              <h3 className="text-lg font-semibold mt-6">2. Description of Service</h3>
              <p>
                BBsynr provides a buyer-broker synchronization platform for real estate
                professionals. The Service allows agents to manage client relationships, track buyer
                agreements, and collaborate with company managers.
              </p>

              <h3 className="text-lg font-semibold mt-6">3. User Registration</h3>
              <p>You must register for an account to use certain features of the Service. You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your registration information</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">4. Company Accounts</h3>
              <p>
                Company accounts allow managers to invite and oversee real estate agents. Managers
                are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Managing team members and their access</li>
                <li>Ensuring compliance with all applicable real estate regulations</li>
                <li>Maintaining accurate client and transaction information</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">5. Subscription and Payment</h3>
              <p>
                Access to the Service requires a paid subscription. You agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All fees are in U.S. dollars and are non-refundable</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You are responsible for all charges incurred under your account</li>
                <li>We may change pricing with 30 days notice to active subscribers</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">6. Privacy and Data Usage</h3>
              <p>We take data privacy seriously. By using the Service, you acknowledge that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We collect and process data as described in our Privacy Policy</li>
                <li>You are responsible for maintaining confidentiality of client information</li>
                <li>We use industry-standard security measures to protect your data</li>
                <li>You grant us the right to use anonymized data for service improvements</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">7. Prohibited Activities</h3>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any laws, regulations, or third-party rights</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Impersonate any person or entity</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">8. Intellectual Property</h3>
              <p>
                The Service and its original content, features, and functionality are owned by
                BBsynr and are protected by international copyright, trademark, and other
                intellectual property laws.
              </p>

              <h3 className="text-lg font-semibold mt-6">9. Termination</h3>
              <p>
                We may terminate or suspend your account and access to the Service immediately,
                without prior notice, for any reason, including breach of these Terms. You may
                cancel your subscription at any time through your account settings.
              </p>

              <h3 className="text-lg font-semibold mt-6">10. Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, BBsynr shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages resulting from
                your use of or inability to use the Service.
              </p>

              <h3 className="text-lg font-semibold mt-6">11. Disclaimer of Warranties</h3>
              <p>
                The Service is provided "as is" and "as available" without warranties of any kind,
                either express or implied. We do not warrant that the Service will be uninterrupted,
                secure, or error-free.
              </p>

              <h3 className="text-lg font-semibold mt-6">12. Changes to Terms</h3>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of
                material changes via email or through the Service. Continued use after changes
                constitutes acceptance of the modified Terms.
              </p>

              <h3 className="text-lg font-semibold mt-6">13. Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the
                United States, without regard to conflict of law provisions.
              </p>

              <h3 className="text-lg font-semibold mt-6">14. Contact Information</h3>
              <p>If you have any questions about these Terms, please contact us at:</p>
              <p className="font-medium">Email: support@bbsynr.com</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
            {onAccept && (
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Accept Terms
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
