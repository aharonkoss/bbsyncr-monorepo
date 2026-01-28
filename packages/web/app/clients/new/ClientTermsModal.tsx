'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ClientTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export default function ClientTermsModal({ isOpen, onClose, onAgree }: ClientTermsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset scroll state when modal opens
    if (isOpen) {
      setHasScrolledToBottom(false);
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // Check if scrolled to bottom (within 10px threshold)
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleAgree = () => {
    onAgree();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">BBsynr Terms of Use</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Terms of Use Section */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">BBsynr Terms of Use</h3>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900">1. Acceptance of Terms</h4>
                <p>By accessing or using BBsynr, you agree to be bound by these Terms of Use.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">2. Platform Purpose</h4>
                <p>BBsynr is a neutral electronic signature and document-routing platform. It does not supply, review, alter, or validate real estate forms.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">3. Copyright Ownership</h4>
                <p>Users must upload only documents they are licensed, authorized, or permitted to use through associations, brokerages, or form providers.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">4. User Responsibilities</h4>
                <p>Users agree to comply with all REALTOR®, MLS, brokerage, state, and federal rules regarding document use and electronic signatures.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">5. Prohibited Activities</h4>
                <p>Users may not upload copyrighted forms without permission, attempt to reverse engineer the app, or misuse signatures.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">6. Electronic Signature Validity</h4>
                <p>BBsynr complies with ESIGN, UETA, and applicable digital signature laws.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">7. Limitation of Liability</h4>
                <p>BBsynr is not liable for damages, disputes, or losses resulting from improper form use or unauthorized uploads.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">8. Arbitration Clause</h4>
                <p>Any disputes shall be resolved through binding arbitration.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">9. Broker Compliance</h4>
                <p>Users must follow their broker's rules governing document selection, execution, and retention.</p>
              </div>
            </div>
          </section>

          {/* Privacy Policy Section */}
          <section className="pt-6 border-t">
            <h3 className="text-xl font-bold text-gray-900 mb-4">BBsynr Privacy Policy</h3>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900">1. Information We Collect</h4>
                <p>BBsynr may collect: name, email, uploaded documents, signature data, and device identifiers.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">2. How Information Is Used</h4>
                <p>We use data to deliver signature services, maintain security, and improve app performance.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">3. Data Storage</h4>
                <p>Document and signature data is encrypted and stored securely.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">4. Sharing of Information</h4>
                <p>We do not sell user data. We may share information only when required by law or with explicit user permission.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">5. User Rights</h4>
                <p>Users may request deletion of personal data. Certain transaction records may be legally required to be retained.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">6. Compliance With Apple, Google, CCPA, CPA, VCDPA</h4>
                <p>This policy satisfies app store privacy requirements and major U.S. consumer privacy regulations.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">7. Cookies and Tracking</h4>
                <p>Minimal analytics may be used for performance monitoring only.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">8. International Users</h4>
                <p>All data is processed in the United States.</p>
              </div>
            </div>
          </section>

          {/* Copyright Disclosure Section */}
          <section className="pt-6 border-t">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nationwide Document Upload & Copyright Disclosure</h3>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900">1. Copyright Responsibility</h4>
                <p>Users confirm they have lawful rights to upload documents from any state association, MLS, brokerage, or private provider.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">2. No Form Modification</h4>
                <p>BBsynr does not modify or generate forms.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">3. Neutral Technology Platform</h4>
                <p>BBsynr provides electronic signature tools only.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">4. No Legal or Brokerage Advice</h4>
                <p>Users must consult their broker or legal counsel for compliance matters.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">5. Association & Jurisdiction Compliance</h4>
                <p>Users must adhere to all applicable real estate regulations nationwide.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">6. Upload Authorization Statement</h4>
                <p>Users affirm: "I am legally authorized to upload and use this document."</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">7. Hold Harmless</h4>
                <p>Users indemnify BBsynr from claims arising from unauthorized uploads or misuse.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">8. Nationwide Coverage</h4>
                <p>This disclosure applies across all U.S. associations and territories.</p>
              </div>
            </div>
          </section>

          {/* User Onboarding Agreement */}
          <section className="pt-6 border-t">
            <h3 className="text-xl font-bold text-gray-900 mb-4">User Onboarding Agreement Summary</h3>
            <p className="text-gray-700 mb-4">By continuing, you acknowledge and agree that:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>You are authorized to upload any documents you provide</li>
              <li>BBsynr does not supply or modify forms</li>
              <li>You are responsible for compliance with your association, state laws, and your broker</li>
              <li>BBsynr provides electronic signatures only and offers no legal advice</li>
            </ul>
          </section>

          {/* Document Upload Confirmation */}
          <section className="pt-6 border-t">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Document Upload Confirmation</h3>
            <p className="text-gray-700">
              "I confirm that I am authorized to upload this document and have all necessary rights or licenses."
            </p>
            <p className="text-sm text-gray-600 mt-2">This confirmation appears each time a document is uploaded.</p>
          </section>

          {/* Scroll indicator at bottom */}
          {!hasScrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4 text-center">
              <p className="text-sm text-gray-500 animate-bounce">
                ↓ Scroll to bottom to continue ↓
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAgree}
              disabled={!hasScrolledToBottom}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                hasScrolledToBottom
                  ? 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              I Agree
            </button>
          </div>
          {!hasScrolledToBottom && (
            <p className="text-sm text-red-600 text-right mt-2">
              Please scroll to the bottom to enable the "I Agree" button
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
