import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Pen, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import SignatureCanvas from 'react-signature-canvas';

const API_URL = 'http://localhost:5000/api';

interface Document {
  _id: string;
  originalName: string;
  url: string;
  status: 'draft' | 'under-review' | 'signed';
  signatureUrl: string | null;
  metadata: { size: number; mimetype: string };
  createdAt: string;
}

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const token = localStorage.getItem('business_nexus_token');

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSuccess('Document uploaded successfully!');
      fetchDocuments();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSign = async (docId: string) => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      setError('Please draw your signature first');
      return;
    }

    const signatureUrl = sigCanvasRef.current.toDataURL('image/png');

    try {
      const res = await fetch(`${API_URL}/documents/${docId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signatureUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signing failed');

      setSuccess('Document signed successfully!');
      setSigningDocId(null);
      fetchDocuments();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleStatusUpdate = async (docId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/documents/${docId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Status update failed');
      fetchDocuments();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess('Document deleted');
      fetchDocuments();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getStatusVariant = (status: string) => {
    if (status === 'signed') return 'success';
    if (status === 'under-review') return 'warning';
    return 'gray';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Upload, preview and sign your documents</p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <Button
            leftIcon={<Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploading}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-screen overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Document Preview</h2>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <iframe
              src={`http://localhost:5000${previewUrl}`}
              className="w-full"
              style={{ height: '70vh' }}
              title="Document Preview"
            />
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signingDocId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-medium mb-4">Draw Your Signature</h2>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: 'w-full',
                }}
                backgroundColor="white"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleSign(signingDocId)}>
                <CheckCircle size={16} className="mr-2" />
                Confirm Signature
              </Button>
              <Button
                variant="outline"
                onClick={() => sigCanvasRef.current?.clear()}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => setSigningDocId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading documents...</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No documents yet — upload your first one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div
                  key={doc._id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="p-2 bg-primary-50 rounded-lg mr-4">
                    <FileText size={24} className="text-primary-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {doc.originalName}
                      </h3>
                      <Badge variant={getStatusVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{formatSize(doc.metadata?.size)}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                    {doc.signatureUrl && (
                      <div className="mt-2">
                        <img
                          src={doc.signatureUrl}
                          alt="Signature"
                          className="h-8 border border-gray-200 rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">

                    {/* Preview */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewUrl(doc.url)}
                    >
                      Preview
                    </Button>

                    {/* Download */}
                    <a
                      href={`http://localhost:5000${doc.url}`}
                      download={doc.originalName}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <Download size={16} />
                      </Button>
                    </a>

                    {/* Status update */}
                    {doc.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(doc._id, 'under-review')}
                      >
                        Send for Review
                      </Button>
                    )}

                    {/* Sign */}
                    {doc.status !== 'signed' && (
                      <Button
                        size="sm"
                        leftIcon={<Pen size={14} />}
                        onClick={() => setSigningDocId(doc._id)}
                      >
                        Sign
                      </Button>
                    )}

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc._id)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};