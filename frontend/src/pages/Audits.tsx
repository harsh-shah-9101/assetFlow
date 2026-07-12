import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const Audits: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/audits');
      setAudits(response.data);
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
      setIsItemsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const updateItemStatus = async (itemId: string, status: string) => {
    try {
      await api.put(`/audits/items/${itemId}`, { status });
      // Refresh local state without closing modal
      const updatedItems = selectedAudit.auditItems.map((item: any) => 
        item.id === itemId ? { ...item, status } : item
      );
      setSelectedAudit({ ...selectedAudit, auditItems: updatedItems });
      fetchData(); // sync background list
    } catch (error) {
      console.error("Failed to update item", error);
    }
  };

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
                          <Button size="sm" onClick={() => { setSelectedAudit(audit); setIsItemsOpen(true); }}>
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
          <Input label="Cycle Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Q1 Laptop Audit" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            <Input label="End Date" type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
          </div>
          <div className="flex justify-end mt-4"><Button type="submit">Generate Checklist</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isItemsOpen} onClose={() => setIsItemsOpen(false)} title={`Audit: ${selectedAudit?.name}`}>
        {selectedAudit && (
          <div className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 bg-[var(--color-surface)]">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="py-2">Asset Tag</th>
                    <th className="py-2">Name</th>
                    <th className="py-2 text-right">Verify Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAudit.auditItems?.map((item: any) => (
                    <tr key={item.id} className="border-b border-[var(--color-border)]">
                      <td className="py-3 font-medium text-[var(--color-primary)]">{item.asset?.assetTag}</td>
                      <td className="py-3">{item.asset?.name}</td>
                      <td className="py-3 text-right">
                        {selectedAudit.isClosed ? (
                           <span className={`px-2 py-1 text-xs rounded-full font-semibold ${item.status === 'VERIFIED' ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'}`}>{item.status}</span>
                        ) : (
                          <div className="flex justify-end gap-1">
                            {item.status === 'PENDING' ? (
                              <>
                                <Button size="sm" variant="secondary" className="px-2" onClick={() => updateItemStatus(item.id, 'VERIFIED')} title="Mark Verified"><CheckCircle2 size={16} className="text-[var(--color-success)]"/></Button>
                                <Button size="sm" variant="secondary" className="px-2" onClick={() => updateItemStatus(item.id, 'MISSING')} title="Mark Missing"><span className="text-[var(--color-danger)] font-bold">!</span></Button>
                              </>
                            ) : (
                              <span className={`px-2 py-1 text-xs rounded-full font-semibold ${item.status === 'VERIFIED' ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'}`}>{item.status}</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {!selectedAudit.isClosed && (
              <div className="border-t border-[var(--color-border)] pt-4 flex justify-between items-center mt-4">
                <span className="text-sm text-[var(--color-text-muted)]">Closing will mark unverified items as LOST.</span>
                <Button variant="danger" onClick={() => handleCloseAudit(selectedAudit.id)}>Close Audit</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
