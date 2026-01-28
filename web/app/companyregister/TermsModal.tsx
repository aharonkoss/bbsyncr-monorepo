'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;  // ✅ Add this optional prop
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
        <div className="p-6 overflow-y-auto flex-1">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-500 mb-4">Last Updated: January 16, 2026</p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h3>
            <p className="text-gray-700 mb-4">
              By accessing and using BBsynr ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use the Service.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Description of Service</h3>
            <p className="text-gray-700 mb-4">
              BBsynr provides a buyer-broker synchronization platform for real estate professionals. The Service allows agents to manage client relationships, track buyer agreements, and collaborate with company managers.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. User Accounts and Registration</h3>
            <p className="text-gray-700 mb-4">
              You must register for an account to use certain features of the Service. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Company and Manager Accounts</h3>
            <p className="text-gray-700 mb-4">
              Company accounts allow managers to invite and oversee real estate agents. Managers are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Verifying the identity and credentials of invited agents</li>
              <li>Ensuring agents comply with applicable real estate laws and regulations</li>
              <li>Maintaining accurate information about their company and agents</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Subscription and Payment</h3>
            <p className="text-gray-700 mb-4">
              Access to the Service requires a paid subscription. You agree that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Subscription fees are charged monthly or annually as selected</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>We may modify subscription fees with 30 days notice</li>
              <li>Failure to pay may result in suspension or termination of access</li>
              <li>Payment processing is handled securely through Stripe</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6. Data Privacy and Security</h3>
            <p className="text-gray-700 mb-4">
              We take data privacy seriously. By using the Service, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>We collect and store information as described in our Privacy Policy</li>
              <li>You are responsible for maintaining confidentiality of client information</li>
              <li>You must comply with all applicable data protection laws</li>
              <li>We use industry-standard security measures to protect your data</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7. Acceptable Use</h3>
            <p className="text-gray-700 mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe the rights of others or BBsynr</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Use the Service to spam or harass others</li>
              <li>Scrape, copy, or download content without permission</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8. Intellectual Property</h3>
            <p className="text-gray-700 mb-4">
              The Service and its original content, features, and functionality are owned by BBsynr and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">9. Termination</h3>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. You may cancel your subscription at any time through your account settings.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">10. Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, BBsynr shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">11. Disclaimer of Warranties</h3>
            <p className="text-gray-700 mb-4">
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">12. Changes to Terms</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance of the modified Terms.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">13. Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">14. Contact Information</h3>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-700 mb-4">
              Email: <a href="mailto:support@bbsynr.com" className="text-blue-600 hover:underline">support@bbsynr.com</a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
}
