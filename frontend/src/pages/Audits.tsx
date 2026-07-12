import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export const Audits: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/audits');
      setAudits(response.data);
      // If we are currently in an active workspace, update its local state too
      if (selectedAudit) {
        const refreshed = response.data.find((a: any) => a.id === selectedAudit.id);
        if (refreshed) setSelectedAudit(refreshed);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/audits', formData);
      setIsStartOpen(false);
      setFormData({ name: '', startDate: '', endDate: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to start audit cycle.");
    }
  };

  const handleCloseAudit = async (id: string) => {
    try {
      await api.post(`/audits/${id}/close`);
      fetchData();
      setSelectedAudit(null);
    } catch (error) {
      console.error(error);
    }
  };

  const updateItemStatus = async (itemId: string, status: string) => {
    try {
      await api.put(`/audits/items/${itemId}`, { status });
      // Refresh local state instantly for snappy UI
      const updatedItems = selectedAudit.auditItems.map((item: any) => 
        item.id === itemId ? { ...item, status } : item
      );
      setSelectedAudit({ ...selectedAudit, auditItems: updatedItems });
      // Fire background fetch to sync
      api.get('/audits').then(response => setAudits(response.data));
    } catch (error) {
      console.error("Failed to update item", error);
    }
  };

  // If selectedAudit is set, render the Active Audit Workspace (Screen 8)
  if (selectedAudit) {
    const flaggedCount = selectedAudit.auditItems?.filter((i: any) => i.status === 'MISSING' || i.status === 'DAMAGED').length || 0;
    
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="secondary" className="gap-2 mb-4" onClick={() => setSelectedAudit(null)}>
          <ArrowLeft size={16} /> Back to Audits
        </Button>

        {/* Top Header Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          <div className="text-[var(--color-text)] font-semibold text-lg mb-1">
            {selectedAudit.name} - {new Date(selectedAudit.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to {new Date(selectedAudit.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
          <div className="text-[var(--color-text-muted)] text-sm">
            Auditors: Asset Management Team
          </div>
        </div>

        {/* Verification Table */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm">
                <th className="p-4 font-medium">Asset</th>
                <th className="p-4 font-medium">Expected location</th>
                <th className="p-4 font-medium text-right">Verification</th>
              </tr>
            </thead>
            <tbody>
              {selectedAudit.auditItems?.map((item: any) => (
                <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)]">
                  <td className="p-4">
                    <span className="font-medium text-[var(--color-text)] mr-2">{item.asset?.assetTag}</span>
                    <span className="text-[var(--color-text-muted)]">{item.asset?.name}</span>
                  </td>
                  <td className="p-4 text-[var(--color-text)]">{item.asset?.location || 'Unknown'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => updateItemStatus(item.id, 'VERIFIED')}
                        disabled={selectedAudit.isClosed}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                          ${item.status === 'VERIFIED' 
                            ? 'bg-[rgba(16,185,129,0.1)] border-green-500 text-green-500' 
                            : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-green-500 hover:text-green-500'}`}
                      >
                        Verified
                      </button>
                      <button 
                        onClick={() => updateItemStatus(item.id, 'MISSING')}
                        disabled={selectedAudit.isClosed}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                          ${item.status === 'MISSING' 
                            ? 'bg-[rgba(239,68,68,0.1)] border-red-500 text-red-500' 
                            : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-red-500 hover:text-red-500'}`}
                      >
                        Missing
                      </button>
                      <button 
                        onClick={() => updateItemStatus(item.id, 'DAMAGED')}
                        disabled={selectedAudit.isClosed}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                          ${item.status === 'DAMAGED' 
                            ? 'bg-[var(--color-border)] border-[var(--color-text-muted)] text-[var(--color-text)]' 
                            : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text)] hover:text-[var(--color-text)]'}`}
                      >
                        Damaged
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Discrepancy Banner */}
        {flaggedCount > 0 && (
          <div className="bg-[rgba(217,119,6,0.15)] border border-[rgba(217,119,6,0.5)] rounded-xl p-4 text-[rgba(251,191,36,1)] font-medium text-sm">
            {flaggedCount} asset{flaggedCount !== 1 ? 's' : ''} flagged - discrepancy report generated automatically
          </div>
        )}

        {/* Action Button */}
        {!selectedAudit.isClosed && (
          <div className="pt-2">
            <button 
              onClick={() => handleCloseAudit(selectedAudit.id)}
              className="px-6 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-background)] transition-colors"
            >
              Close audit cycle
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render the default Audit List View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Asset Audits</h1>
          <p className="text-[var(--color-text-muted)]">Run verification cycles for your assets.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsStartOpen(true)}>
          <Plus size={18} /> Start New Cycle
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Start Date</th>
                  <th className="p-4 font-medium">End Date</th>
                  <th className="p-4 font-medium">Progress</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
                ) : audits.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">No audit cycles found.</td></tr>
                ) : (
                  audits.map(audit => {
                    const total = audit.auditItems?.length || 0;
                    const verified = audit.auditItems?.filter((i: any) => i.status !== 'PENDING').length || 0;
                    
                    return (
                      <tr key={audit.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                        <td className="p-4 font-medium text-[var(--color-text)]">{audit.name}</td>
                        <td className="p-4 text-[var(--color-text-muted)]">{new Date(audit.startDate).toLocaleDateString()}</td>
                        <td className="p-4 text-[var(--color-text-muted)]">{new Date(audit.endDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-[var(--color-border)] rounded-full h-2 max-w-[100px]">
                              <div className="bg-[var(--color-primary)] h-2 rounded-full" style={{ width: `${total ? (verified/total)*100 : 0}%` }}></div>
                            </div>
                            <span className="text-xs font-medium text-[var(--color-text-muted)]">{verified}/{total}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${audit.isClosed ? 'bg-gray-100 text-gray-700' : 'bg-[var(--color-success-bg)] text-[var(--color-success)]'}`}>
                            {audit.isClosed ? 'CLOSED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button size="sm" onClick={() => setSelectedAudit(audit)}>
                            {audit.isClosed ? 'View Results' : 'Continue Audit'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isStartOpen} onClose={() => setIsStartOpen(false)} title="Start Audit Cycle">
        <form onSubmit={handleStart} className="space-y-4">
          <Input label="Cycle Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Q3 audit: Engineering dept" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            <Input label="End Date" type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
          </div>
          <div className="flex justify-end mt-4"><Button type="submit">Generate Checklist</Button></div>
        </form>
      </Modal>
    </div>
  );
};
