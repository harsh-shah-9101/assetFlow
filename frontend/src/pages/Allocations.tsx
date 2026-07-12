import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Allocations: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'allocate' | 'list'>('allocate');
  
  const [allocations, setAllocations] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Workflow State
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [detailedAsset, setDetailedAsset] = useState<any>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allocRes, assetsRes, usersRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/assets'),
        api.get('/users')
      ]);
      setAllocations(allocRes.data);
      setAssets(assetsRes.data); // Fetch all assets for the dropdown
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

  useEffect(() => {
    if (selectedAssetId) {
      api.get(`/assets/${selectedAssetId}`).then(res => setDetailedAsset(res.data)).catch(console.error);
    } else {
      setDetailedAsset(null);
    }
    // reset form when asset changes
    setTargetUserId('');
    setExpectedReturnDate('');
    setReason('');
  }, [selectedAssetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !targetUserId) return;

    const isCurrentlyAllocated = detailedAsset?.status === 'ALLOCATED' || detailedAsset?.status === 'RESERVED';

    try {
      if (isCurrentlyAllocated) {
        // Submit Transfer Request
        await api.post('/allocations/transfer', {
          assetId: selectedAssetId,
          targetUserId: targetUserId,
          expectedReturnDate: expectedReturnDate || undefined,
        });
        alert("Transfer request submitted successfully!");
      } else {
        // Direct Allocation
        await api.post('/allocations', {
          assetId: selectedAssetId,
          userId: targetUserId,
          expectedReturnDate: expectedReturnDate || undefined,
        });
        alert("Asset allocated successfully!");
      }
      // Refresh Data
      fetchData();
      api.get(`/assets/${selectedAssetId}`).then(res => setDetailedAsset(res.data)).catch(console.error);
    } catch (error) {
      console.error(error);
      alert("Failed to process request");
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

  const handleReturn = async (id: string) => {
    const condition = prompt("Enter return condition notes (e.g. Good, Damaged):");
    if (condition === null) return; // cancelled
    try {
      await api.post(`/allocations/${id}/return`, { conditionCheckIn: condition });
      fetchData();
      if (selectedAssetId) {
        api.get(`/assets/${selectedAssetId}`).then(res => setDetailedAsset(res.data)).catch(console.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const canManage = user?.role === 'ASSET_MANAGER' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN';

  const activeAllocation = detailedAsset?.allocations?.find((a: any) => a.status === 'APPROVED');
  const pastAllocations = detailedAsset?.allocations?.filter((a: any) => a.status !== 'REQUESTED') || [];
  
  // Sort past allocations descending by creation date
  pastAllocations.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Allocations & Transfers</h1>
          <p className="text-[var(--color-text-muted)]">Manage who holds what asset.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[var(--color-border)] pb-2">
        <button 
          className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'allocate' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          onClick={() => setActiveTab('allocate')}
        >
          Allocate & Transfer Workflow
        </button>
        <button 
          className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'list' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          onClick={() => setActiveTab('list')}
        >
          All Allocations Log
        </button>
      </div>

      {activeTab === 'allocate' && (
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Asset</label>
                <Select 
                  className="w-full text-lg" 
                  value={selectedAssetId} 
                  onChange={setSelectedAssetId} 
                  placeholder="Search and select asset..."
                  options={[{ value: '', label: 'Select Asset...' }, ...assets.map(a => ({ value: a.id, label: `${a.assetTag} - ${a.name}` }))]}
                />
              </div>

              {detailedAsset && activeAllocation && (
                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl p-4 flex gap-4 items-start">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h4 className="text-red-500 font-bold text-lg mb-1">
                      Already Allocated to {activeAllocation.user?.name} {activeAllocation.department?.name ? `(${activeAllocation.department.name})` : ''}
                    </h4>
                    <p className="text-red-400/90 text-sm font-medium">Direct re-allocation is blocked - submit a transfer request below</p>
                  </div>
                </div>
              )}

              {detailedAsset && (
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                  <h3 className="text-lg font-bold border-b border-[var(--color-border)] pb-2">
                    {activeAllocation ? 'Transfer Request' : 'Direct Allocation'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {activeAllocation && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[var(--color-text-muted)]">From</label>
                        <input 
                          type="text"
                          className="input-field w-full bg-[var(--color-background)] opacity-70 cursor-not-allowed"
                          value={activeAllocation.user?.name || 'Unknown'}
                          disabled
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--color-text-muted)]">{activeAllocation ? 'To' : 'Assign To'}</label>
                      <Select 
                        className="w-full" 
                        value={targetUserId} 
                        onChange={setTargetUserId} 
                        options={[{ value: '', label: 'Select Employee...' }, ...users.map(u => ({ value: u.id, label: u.name }))]}
                      />
                    </div>
                  </div>
                  
                  {activeAllocation && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--color-text-muted)]">Reason</label>
                      <textarea 
                        className="input-field w-full min-h-[100px]" 
                        placeholder="Why is this transfer needed?" 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                  )}

                  {!activeAllocation && (
                    <div className="space-y-2 max-w-xs">
                      <Input 
                        label="Expected Return Date" 
                        type="date" 
                        value={expectedReturnDate} 
                        onChange={(e) => setExpectedReturnDate(e.target.value)} 
                      />
                    </div>
                  )}

                  <div>
                    <Button type="submit" disabled={!targetUserId}>
                      {activeAllocation ? 'Submit Request' : 'Allocate Asset'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {detailedAsset && pastAllocations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-[var(--color-border)] pb-2">Allocation history</h3>
              <div className="space-y-3">
                {pastAllocations.map((alloc: any) => (
                  <div key={alloc.id} className="text-sm text-[var(--color-text-muted)]">
                    {alloc.status === 'APPROVED' ? (
                      <span>
                        {new Date(alloc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                        <strong className="text-[var(--color-text)] font-medium mx-1">Allocated to {alloc.user?.name}</strong> 
                        {alloc.department ? `- ${alloc.department.name}` : ''}
                      </span>
                    ) : alloc.status === 'RETURNED' ? (
                      <span>
                        {new Date(alloc.actualReturnDate || alloc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                        <strong className="text-[var(--color-text)] font-medium mx-1">Returned by {alloc.user?.name}</strong> 
                        - condition: {alloc.conditionCheckIn || 'good'}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Asset</th>
                    <th className="p-4 font-medium">Assigned To</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>
                  ) : allocations.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-[var(--color-text-muted)]">No allocations found.</td></tr>
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
                        <td className="p-4 text-right">
                          {canManage && alloc.status === 'REQUESTED' && (
                            <Button size="sm" onClick={() => handleApproveTransfer(alloc.id)}>Approve</Button>
                          )}
                          {canManage && alloc.status === 'APPROVED' && (
                            <Button variant="secondary" size="sm" onClick={() => handleReturn(alloc.id)}>Return</Button>
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
      )}
    </div>
  );
};
