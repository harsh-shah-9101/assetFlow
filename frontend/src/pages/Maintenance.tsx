import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  
  const [formData, setFormData] = useState({ assetId: '', issue: '', priority: 'MEDIUM', photoUrl: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [maintRes, assetsRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/assets')
      ]);
      setRequests(maintRes.data);
      setAssets(assetsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', formData);
      setIsRaiseOpen(false);
      setFormData({ assetId: '', issue: '', priority: 'MEDIUM', photoUrl: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to raise request.");
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.put(`/maintenance/${id}/status`, { status });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const canManage = user?.role === 'ASSET_MANAGER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Maintenance</h1>
          <p className="text-[var(--color-text-muted)]">Report issues and track repairs.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsRaiseOpen(true)}>
          <Plus size={18} /> Raise Request
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Asset</th>
                  <th className="p-4 font-medium">Issue</th>
                  <th className="p-4 font-medium">Priority</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Requester</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">No maintenance requests found.</td></tr>
                ) : (
                  requests.map(req => (
                    <tr key={req.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                      <td className="p-4 font-medium text-[var(--color-primary)]">{req.asset?.name || 'Unknown'}</td>
                      <td className="p-4">{req.issue}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${req.priority === 'HIGH' ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]' : req.priority === 'MEDIUM' ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]' : 'bg-[var(--color-background)] text-[var(--color-text-muted)]'}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${req.status === 'PENDING' ? 'bg-gray-100 text-gray-700' : req.status === 'APPROVED' ? 'bg-[var(--color-info-bg)] text-[var(--color-info)]' : req.status === 'IN_PROGRESS' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : req.status === 'RESOLVED' ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--color-text-muted)]">{req.requester?.name}</td>
                      <td className="p-4 text-right">
                        {canManage && req.status === 'PENDING' && (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" onClick={() => handleStatusUpdate(req.id, 'APPROVED')}>Approve</Button>
                            <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(req.id, 'REJECTED')}>Reject</Button>
                          </div>
                        )}
                        {canManage && req.status === 'APPROVED' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(req.id, 'IN_PROGRESS')}>Start Work</Button>
                        )}
                        {canManage && req.status === 'IN_PROGRESS' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(req.id, 'RESOLVED')}>Resolve</Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isRaiseOpen} onClose={() => setIsRaiseOpen(false)} title="Raise Maintenance Request">
        <form onSubmit={handleRaise} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Asset</label>
            <select className="input-field" required value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})}>
              <option value="">Select Asset...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Describe the Issue</label>
            <textarea className="input-field min-h-[100px]" required value={formData.issue} onChange={e => setFormData({...formData, issue: e.target.value})} placeholder="What is broken?" />
          </div>
          <div className="input-group">
            <label className="input-label">Priority</label>
            <select className="input-field" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <Input label="Photo URL (Optional)" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} />
          <div className="flex justify-end mt-4"><Button type="submit">Submit Request</Button></div>
        </form>
      </Modal>
    </div>
  );
};
