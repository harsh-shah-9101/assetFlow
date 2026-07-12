import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, ArrowRightLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Allocations: React.FC = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>('');
  
  // Forms
  const [allocateData, setAllocateData] = useState({ assetId: '', userId: '', expectedReturnDate: '' });
  const [transferData, setTransferData] = useState({ assetId: '', targetUserId: '', expectedReturnDate: '' });
  const [returnCondition, setReturnCondition] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allocRes, assetsRes, usersRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/assets'),
        api.get('/users')
      ]);
      setAllocations(allocRes.data);
      setAssets(assetsRes.data.filter((a: any) => a.status === 'AVAILABLE')); // only available for direct allocate
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/allocations', allocateData);
      setIsAllocateOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to allocate asset");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/allocations/transfer', transferData);
      setIsTransferOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to request transfer");
    }
  };

  const handleApproveTransfer = async (id: string) => {
    try {
      await api.post(`/allocations/${id}/approve-transfer`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/allocations/${selectedAllocationId}/return`, { conditionCheckIn: returnCondition });
      setIsReturnOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const canManage = user?.role === 'ASSET_MANAGER' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Allocations & Transfers</h1>
          <p className="text-[var(--color-text-muted)]">Manage who holds what asset.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2" onClick={() => setIsTransferOpen(true)}>
            <ArrowRightLeft size={18} /> Request Transfer
          </Button>
          {canManage && (
            <Button className="gap-2" onClick={() => setIsAllocateOpen(true)}>
              <Plus size={18} /> Direct Allocate
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Asset</th>
                  <th className="p-4 font-medium">Assigned To</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Expected Return</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                ) : allocations.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-[var(--color-text-muted)]">No allocations found.</td></tr>
                ) : (
                  allocations.map(alloc => (
                    <tr key={alloc.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                      <td className="p-4 font-medium text-[var(--color-primary)]">{alloc.asset?.name || 'Unknown'}</td>
                      <td className="p-4">{alloc.user?.name || 'Department'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${alloc.status === 'APPROVED' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : alloc.status === 'REQUESTED' ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]' : 'bg-[var(--color-success-bg)] text-[var(--color-success)]'}`}>
                          {alloc.status}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--color-text-muted)]">
                        {alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        {canManage && alloc.status === 'REQUESTED' && (
                          <Button size="sm" onClick={() => handleApproveTransfer(alloc.id)}>Approve</Button>
                        )}
                        {canManage && alloc.status === 'APPROVED' && (
                          <Button variant="secondary" size="sm" onClick={() => { setSelectedAllocationId(alloc.id); setIsReturnOpen(true); }}>Return</Button>
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

      <Modal isOpen={isAllocateOpen} onClose={() => setIsAllocateOpen(false)} title="Direct Allocate Asset">
        <form onSubmit={handleAllocate} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Asset</label>
            <select className="input-field" required value={allocateData.assetId} onChange={e => setAllocateData({...allocateData, assetId: e.target.value})}>
              <option value="">Select Available Asset...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">User</label>
            <select className="input-field" required value={allocateData.userId} onChange={e => setAllocateData({...allocateData, userId: e.target.value})}>
              <option value="">Select User...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <Input label="Expected Return Date" type="date" value={allocateData.expectedReturnDate} onChange={e => setAllocateData({...allocateData, expectedReturnDate: e.target.value})} />
          <div className="flex justify-end mt-4"><Button type="submit">Allocate</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Request Transfer">
        <form onSubmit={handleTransfer} className="space-y-4">
          <Input label="Asset ID (UUID)" required value={transferData.assetId} onChange={e => setTransferData({...transferData, assetId: e.target.value})} placeholder="Paste Asset ID here" />
          <div className="input-group">
            <label className="input-label">Transfer To User</label>
            <select className="input-field" required value={transferData.targetUserId} onChange={e => setTransferData({...transferData, targetUserId: e.target.value})}>
              <option value="">Select User...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <Input label="Expected Return Date" type="date" value={transferData.expectedReturnDate} onChange={e => setTransferData({...transferData, expectedReturnDate: e.target.value})} />
          <div className="flex justify-end mt-4"><Button type="submit">Request Transfer</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)} title="Process Return">
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Condition Notes</label>
            <textarea className="input-field min-h-[100px]" required value={returnCondition} onChange={e => setReturnCondition(e.target.value)} placeholder="e.g. Returned in good working condition" />
          </div>
          <div className="flex justify-end mt-4"><Button type="submit">Complete Return</Button></div>
        </form>
      </Modal>
    </div>
  );
};
