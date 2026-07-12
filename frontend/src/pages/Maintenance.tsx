import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus } from 'lucide-react';
import api from '../services/api';

const COLUMNS = [
  { id: 'PENDING', title: 'Pending' },
  { id: 'APPROVED', title: 'Approved' },
  { id: 'TECHNICIAN_ASSIGNED', title: 'Technician Assigned' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'RESOLVED', title: 'Resolved' }
];

export const Maintenance: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [formData, setFormData] = useState({ assetId: '', issue: '', priority: 'MEDIUM' });

  // Technician Assignment State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/maintenance');
      setRequests(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    api.get('/assets').then(res => setAssets(res.data)).catch(console.error);
    api.get('/users').then(res => setUsers(res.data)).catch(console.error);
  }, []);

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
  };

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', formData);
      setIsRaiseOpen(false);
      setFormData({ assetId: '', issue: '', priority: 'MEDIUM' });
      fetchRequests();
    } catch (error) {
      console.error(error);
      alert('Failed to raise maintenance request.');
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (!ticketId) return;

    if (targetStatus === 'TECHNICIAN_ASSIGNED') {
      setPendingTicketId(ticketId);
      setIsAssignOpen(true);
      return;
    }

    // Optimistically update UI
    setRequests(prev => prev.map(req => 
      req.id === ticketId ? { ...req, status: targetStatus } : req
    ));

    try {
      await api.put(`/maintenance/${ticketId}/status`, { status: targetStatus });
      fetchRequests(); // Re-fetch to ensure sync
    } catch (error) {
      console.error(error);
      alert('Failed to update status.');
      fetchRequests(); // Revert on failure
    }
  };

  const handleAssignTech = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Optimistically update UI
    const assignedUser = users.find(u => u.id === selectedTechId);
    setRequests(prev => prev.map(req => 
      req.id === pendingTicketId ? { 
        ...req, 
        status: 'TECHNICIAN_ASSIGNED', 
        assignedTech: { name: assignedUser?.name || 'Unknown' } 
      } : req
    ));
    setIsAssignOpen(false);

    try {
      await api.put(`/maintenance/${pendingTicketId}/status`, { 
        status: 'TECHNICIAN_ASSIGNED',
        assignedTechId: selectedTechId 
      });
      fetchRequests(); // Re-fetch to ensure sync
    } catch (error) {
      console.error(error);
      alert('Failed to assign technician.');
      fetchRequests();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Maintenance Management</h1>
          <p className="text-[var(--color-text-muted)]">Approval workflow as a Kanban board.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsRaiseOpen(true)}>
          <Plus size={18} /> Raise Request
        </Button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {COLUMNS.map(column => (
          <div 
            key={column.id}
            className="flex-1 min-w-[250px] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex flex-col gap-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="font-semibold text-[var(--color-text-muted)] tracking-wide uppercase text-sm border-b border-[var(--color-border)] pb-2 text-center">
              {column.title}
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
              {isLoading && requests.length === 0 ? (
                <div className="text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
              ) : null}
              
              {requests
                .filter(r => r.status === column.id)
                .map(req => (
                  <div
                    key={req.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, req.id)}
                    className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-md transition-all
                      ${req.status === 'RESOLVED' 
                        ? 'bg-[rgba(16,185,129,0.1)] border-green-500 text-green-400' 
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                      }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${req.status === 'RESOLVED' ? 'text-green-500' : 'text-[var(--color-text-muted)]'}`}>
                      {req.asset?.assetTag || 'UNKNOWN'}
                    </div>
                    <div className="text-sm font-medium leading-snug">
                      {req.issue}
                    </div>
                    {req.assignedTech && (
                      <div className="text-xs text-[var(--color-text-muted)] mt-2 font-medium">
                        tech: {req.assignedTech.name}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center text-sm text-[var(--color-text-muted)] shrink-0">
        Approving a card moves the asset to under maintenance, resolving returns it to available.
      </div>

      <Modal isOpen={isRaiseOpen} onClose={() => setIsRaiseOpen(false)} title="Raise Maintenance Request">
        <form onSubmit={handleRaise} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--color-text-muted)]">Asset</label>
            <Select 
              className="w-full"
              required 
              value={formData.assetId} 
              onChange={val => setFormData({...formData, assetId: val})}
              options={[{ value: '', label: 'Select Asset...' }, ...assets.map(a => ({ value: a.id, label: `${a.assetTag} - ${a.name}` }))]}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--color-text-muted)]">Issue Description</label>
            <textarea 
              className="input-field min-h-[100px] py-2" 
              required 
              placeholder="E.g., Screen flickering continuously"
              value={formData.issue} 
              onChange={e => setFormData({...formData, issue: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--color-text-muted)]">Priority</label>
            <Select 
              className="w-full"
              value={formData.priority} 
              onChange={val => setFormData({...formData, priority: val})}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' }
              ]}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Technician">
        <form onSubmit={handleAssignTech} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--color-text-muted)]">Select Technician</label>
            <Select 
              className="w-full"
              required 
              value={selectedTechId} 
              onChange={val => setSelectedTechId(val)}
              options={[{ value: '', label: 'Select Employee...' }, ...users.map(u => ({ value: u.id, label: u.name }))]}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">Assign & Move Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
