'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  fetchCurrentUser,
  fetchClients,
  resendClientDocument,
  updateClient,
  deleteClient as deleteClientApi,
  downloadClientPdf,
  logout
} from '@/lib/api';
import { Client } from '@my-real-estate-app/shared';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Client> | null>(null);
  const [editError, setEditError] = useState('');
  const [feedback, setFeedback] = useState('');
const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    // Add this helper function to transform database format to camelCase
    const transformClient = (client: any): Client => ({
      id: client.id,
      customerName: client.customer_name || client.customerName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      documentType: client.document_type || client.documentType,
      signatureImage: client.signature_image || client.signatureImage,
      createdAt: client.created_at || client.createdAt,
      property_description: client.property_description,
      property_description_other: client.property_description_other,
      compensation_type: client.compensation_type,
      compensation_value: client.compensation_value,
      expiration_date: client.expiration_date,
      retainer_fee: client.retainer_fee,
      days_of_execution: client.days_of_execution,
      buyer_initials: client.buyer_initials,
      signature_image: client.signature_image,

      });
useEffect(() => {
  let cancelled = false;

  const load = async () => {
    try {
      const me = await fetchCurrentUser();
      const rawClients = await fetchClients();
      console.log('Fetched clients:', rawClients);
      const transformed = rawClients.map(transformClient);  
      if (!cancelled) {
        setCurrentUser(me);
        setClients(transformed);
        setLoading(false);
      }
    } catch (error) {
      console.log('Error fetching data:', error);
      if (!cancelled) {
        setLoading(false);
        router.replace('/login');
      }
    }
  };

  load();
  return () => {
    cancelled = true;
  };
}, [router]);


if (loading) {
  return <div>Loading…</div>;
}
  



const handleLogout = async () => {
  try {
    await logout();              // clears HttpOnly cookies on the server
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      router.push('/login');       // redirect either way
    }
};

  // Download PDF
  const handleDownloadPdf = async (clientId: string, customerName: string) => {
  try {
    const pdfUrl = await downloadClientPdf(clientId);

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${customerName}-document.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(pdfUrl);
  } catch (err) {
    console.error('Error downloading PDF:', err);
    alert('Failed to download PDF');
  }
};

  
  // Start editing
  const handleEditClick = (client: Client) => {
    setEditingId(client.id);
    setEditFormData({
      customerName: client.customerName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      documentType: client.documentType,
      property_description: client.property_description || "",
      property_description_other: client.property_description_other || "",
      compensation_type: client.compensation_type || "$",
      compensation_value: client.compensation_value || "",
      expiration_date: client.expiration_date || "",
      retainer_fee: client.retainer_fee || "",
      days_of_execution: client.days_of_execution || "",
      buyer_initials: client.buyer_initials || "",
      signature_image: client.signatureImage || "",
    });
    setEditError('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
    setEditError('');
  };
  const handleResend = async (clientId: string) => {
  setFeedback('....Please wait, resending email...');
  setLoading(true);

  try {
    console.log(`Resending document for client: ${clientId}`);
    await resendClientDocument(clientId);
  } catch (error) {
    console.error(
      `Failed to resend agreement. Please try again.`,
      error
    );
  } finally {
    setTimeout(() => setFeedback(''), 3500);
    setLoading(false);
  }
};


  // In handleSaveEdit, transform the response back:
const handleSaveEdit = async (clientId: string) => {
  if (!editFormData) {
    setEditError('No data to save');
    return;
  }

  try {
    const payload = {
      customerName: editFormData.customerName?.trim() || '',
      email: editFormData.email?.trim() || '',
      phone: editFormData.phone?.trim() || '',
      address: editFormData.address?.trim() || '',
      document_type: editFormData.documentType,                    // matches req.body.documenttype
      property_description: editFormData.property_description,
      property_description_other: editFormData.property_description_other,
      compensation_type: editFormData.compensation_type,
      compensation_value: editFormData.compensation_value,
      expiration_date: editFormData.expiration_date,
      buyer_initials: editFormData.buyer_initials,
      signature_image: editFormData.signature_image,
      retainer_fee: editFormData.documentType === 'Exclusive Buyer Broker Agreement'
        ? editFormData.retainer_fee
        : null,
      days_of_execution: editFormData.documentType === 'Exclusive Buyer Broker Agreement'
        ? editFormData.days_of_execution
        : null,
    };

    const responseClient = await updateClient(clientId, payload);

    const updatedClient = transformClient(responseClient);
    setClients((prev) => prev.map((c) => (c.id === clientId ? updatedClient : c)));
    setEditingId(null);
    setEditFormData(null);
    setEditError('');
  } catch (err: any) {
    console.error('Error updating client:', err);
    setEditError(err?.response?.data?.error || 'Failed to update client');
  }
};



  // Delete client
  const handleDeleteClient = async (clientId: string, customerName: string) => {
  if (
    !confirm(
      `Are you sure you want to delete ${customerName}? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    await deleteClientApi(clientId);
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  } catch (err: any) {
    console.error('Error deleting client:', err);
    alert(err?.response?.data?.error || 'Failed to delete client');
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{feedback}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
        <div className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-[#0284C7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-4">
                <Image
                src="/logo.png"
                alt="BBSynr Logo"
                width={120}
                height={48}
                className="h-12 w-auto"
                />
                <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Documents</h1>
                <p className="text-xs text-gray-500">Document Management & Signing</p>
                </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
                {/* Add Client Button */}
                <button
                onClick={() => router.push('/clients/new')}
                title="Add new client"
                className="p-3 rounded-full bg-[#0284C7] text-white hover:bg-[#0369A1] transition-colors hover:shadow-lg"
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                </button>
               {/* Profile Button */}
              <button
                onClick={() => router.push('/profile')}
                title="Change Profile"
                className="p-3 rounded-full bg-[#0284C7] text-white hover:bg-[#0369A1] transition-colors hover:shadow-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {/* Head */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
                  />
                  {/* Shoulders / body */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 20c0-2.21 2.69-4 6-4s6 1.79 6 4"
                  />
                </svg>
              </button>
                {/* Logout Button */}
                <button
                onClick={handleLogout}
                title="Logout"
                className="p-3 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors hover:shadow-lg"
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                </button>
            </div>
            </div>
        </div>
        </div>


      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}

        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first client</p>
            <button
              onClick={() => router.push('/clients/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                {editingId === client.id ? (
                  // EDIT MODE
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Client</h3>
                    
                    {editError && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded p-3 text-sm">
                        {editError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={editFormData?.customerName || ''}
                          onChange={(e) => setEditFormData({...editFormData, customerName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editFormData?.email || ''}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editFormData?.phone || ''}
                          onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={editFormData?.address || ''}
                          onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      {/* Property Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Description</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                          value={editFormData?.property_description || ""}
                          onChange={e =>
                            setEditFormData(prev => ({
                              ...prev,
                              property_description: e.target.value,
                              property_description_other:
                                 e.target.value === "Other" ? prev?.property_description_other || "" : "",
                            }))
                          }
                        >
                          <option value="">Select...</option>
                          <option>Residential</option>
                          <option>Land</option>
                          <option>Commercial</option>
                          <option>Other</option>
                        </select>
                      </div>
                      {editFormData?.property_description === "Other" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Other Description</label>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={editFormData.property_description_other || ""}
                            onChange={e =>
                              setEditFormData(prev => ({
                                ...prev,
                                property_description_other: e.target.value,
                              }))
                            }
                            placeholder="Specify property"
                          />
                        </div>
                      )}

                      {/* Compensation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Compensation Type</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={`px-2 py-1 rounded ${editFormData?.compensation_type === "$" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
                            onClick={() => setEditFormData(prev => ({ ...prev, compensation_type: "$" }))}
                          >$</button>
                          <button
                            type="button"
                            className={`px-2 py-1 rounded ${editFormData?.compensation_type === "%" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
                            onClick={() => setEditFormData(prev => ({ ...prev, compensation_type: "%" }))}
                          >%</button>
                        </div>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2 text-gray-900"
                          type="number"
                          min="0"
                          step="0.001"
                          value={editFormData?.compensation_value || ""}
                          onChange={e =>
                            setEditFormData(prev => ({
                              ...prev,
                              compensation_value: e.target.value,
                            }))
                          }
                          placeholder="Enter value"
                        />
                      </div>

                      {/* Expiration Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                          type="date"
                          value={editFormData?.expiration_date ? editFormData.expiration_date.substring(0,10) : ""}
                          onChange={e =>
                            setEditFormData(prev => ({
                              ...prev,
                              expiration_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                      {editFormData?.documentType === "Exclusive Buyer Broker Agreement" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Retainer Fee ($)</label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                              type="number"
                              min="0"
                              step="0.001"
                              value={editFormData.retainer_fee || ""}
                              onChange={e =>
                                setEditFormData(prev => ({
                                  ...prev,
                                  retainer_fee: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Days of Execution</label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              type="number"
                              min="0"
                              value={editFormData?.days_of_execution || ""}
                              onChange={e =>
                                setEditFormData(prev => ({
                                  ...prev,
                                  days_of_execution: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Initials (not editable) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Initials</label>
                        {editFormData?.buyer_initials ? (
                          <img src={editFormData.buyer_initials} alt="Initials" style={{ width: 60, height: 32, border: '1px solid #aaa' }} />
                        ) : <em>No Initials</em>}
                      </div>

                      {/* Signature (not editable) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Signature</label>
                        {editFormData?.signature_image ? (
                          <img src={editFormData.signature_image} alt="Signature" style={{ width: 120, height: 48, border: '1px solid #aaa' }} />
                        ) : <em>No Signature</em>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                    <button
                        onClick={() => handleSaveEdit(client.id)}
                        title="Save changes"
                        className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors hover:shadow-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <button
                        onClick={handleCancelEdit}
                        title="Cancel editing"
                        className="p-2 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors hover:shadow-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleDeleteClient(client.id, client.customerName)}
                        title="Delete client"
                        className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors hover:shadow-lg ml-auto"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{client.customerName}</h3>
                        <p className="text-sm text-gray-500">{client.documentType}</p>
                      </div>
                      {client.signatureImage && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Signed
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600"><strong>Email:</strong> {client.email}</p>
                      <p className="text-sm text-gray-600"><strong>Phone:</strong> {client.phone}</p>
                      <p className="text-sm text-gray-600"><strong>Address:</strong> {client.address}</p>
                      {/* Property description */}
                      <p className="text-sm text-gray-600">
                        <strong>Property Description:</strong> {client.property_description}
                        {client.property_description === "Other" && client.property_description_other && <> ({client.property_description_other})</>}
                      </p>

                      {/* Compensation */}
                      <p className="text-sm text-gray-600">
                        <strong>Compensation:</strong> {client.compensation_type}{client.compensation_value}
                      </p>

                      {/* Expiration Date */}
                      <p className="text-sm text-gray-600">
                        <strong>Expiration:</strong> {client.expiration_date ? client.expiration_date.substring(0,10) : "-"}
                      </p>

                      {/* Buyer initials */}
                      <p className="text-sm text-gray-600">
                        <strong>Buyer Initials:</strong>{" "}
                        {client.buyer_initials ? (
                          <img src={client.buyer_initials} alt="Initials" style={{ width: 60, height: 32, border: '1px solid #aaa', display: 'inline' }} />
                        ) : <em>None</em>}
                      </p>

                      {/* Signature */}
                      <p className="text-sm text-gray-600">
                        <strong>Signature:</strong>{" "}
                        {client.signature_image ? (
                          <img src={client.signature_image} alt="Signature" style={{ width: 120, height: 48, border: '1px solid #aaa', display: 'inline' }} />
                        ) : <em>None</em>}
                      </p>
                      <p className="text-xs text-gray-400">Added: {new Date(client.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* View Mode Buttons */}
                    <div className="flex gap-3">
                     <button
                        title="Resend Agreement"
                        onClick={() => handleResend(client.id)}
                        className="rounded-full p-2 bg-blue-50 hover:bg-blue-100 border border-blue-300"
                        disabled={loading}
                      >
                        <PaperAirplaneIcon className="w-5 h-5 text-blue-600" />
                      </button> 
                    <button
                        onClick={() => handleDownloadPdf(client.id, client.customerName)}
                        title="Download PDF"
                        className="p-2 rounded-full bg-[#0284C7] text-white hover:bg-[#0369A1] transition-colors hover:shadow-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleEditClick(client)}
                        title="Edit client"
                        className="p-2 rounded-full bg-[#0284C7] text-white hover:bg-[#0369A1] transition-colors hover:shadow-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
