import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/maintenance-requests');
      setRequests(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (!ticketId) return;

    // Optimistically update UI
    setRequests(prev => prev.map(req => 
      req.id === ticketId ? { ...req, status: targetStatus } : req
    ));

    try {
      await api.put(`/maintenance-requests/${ticketId}/status`, { status: targetStatus });
      fetchRequests(); // Re-fetch to ensure sync
    } catch (error) {
      console.error(error);
      alert('Failed to update status.');
      fetchRequests(); // Revert on failure
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
        <Button className="gap-2">
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
                    className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-lg transition-all
                      ${req.status === 'RESOLVED' 
                        ? 'bg-[rgba(16,185,129,0.1)] border-green-500 text-green-400' 
                        : 'bg-[var(--color-background)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                      }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${req.status === 'RESOLVED' ? 'text-green-500' : 'text-[var(--color-primary-light)]'}`}>
                      {req.asset?.assetTag || 'UNKNOWN'}
                    </div>
                    <div className="text-sm font-medium leading-snug">
                      {req.issue}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center text-sm text-[var(--color-text-muted)] shrink-0">
        Approving a card moves the asset to under maintenance, resolving returns it to available.
      </div>
    </div>
  );
};
