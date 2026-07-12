import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Bookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookOpen, setIsBookOpen] = useState(false);
  
  const [formData, setFormData] = useState({ assetId: '', startDate: '', startTime: '', endDate: '', endTime: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookRes, assetsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/assets')
      ]);
      setBookings(bookRes.data);
      // Only show bookable assets
      setAssets(assetsRes.data.filter((a: any) => a.isSharedBookable));
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();
      
      await api.post('/bookings', {
        assetId: formData.assetId,
        startTime: startDateTime,
        endTime: endDateTime
      });
      setIsBookOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to book resource. It may overlap with an existing booking.");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.put(`/bookings/${id}/status`, { status: 'CANCELLED' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Resource Bookings</h1>
          <p className="text-[var(--color-text-muted)]">Book shared assets like rooms and projectors.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsBookOpen(true)}>
          <Plus size={18} /> New Booking
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Resource</th>
                  <th className="p-4 font-medium">Booked By</th>
                  <th className="p-4 font-medium">Start Time</th>
                  <th className="p-4 font-medium">End Time</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">No bookings found.</td></tr>
                ) : (
                  bookings.map(book => (
                    <tr key={book.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                      <td className="p-4 font-medium text-[var(--color-primary)]">{book.asset?.name || 'Unknown'}</td>
                      <td className="p-4">{book.user?.name}</td>
                      <td className="p-4 text-[var(--color-text-muted)]">{new Date(book.startTime).toLocaleString()}</td>
                      <td className="p-4 text-[var(--color-text-muted)]">{new Date(book.endTime).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${book.status === 'UPCOMING' ? 'bg-[var(--color-info-bg)] text-[var(--color-info)]' : book.status === 'ONGOING' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : book.status === 'CANCELLED' ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]' : 'bg-[var(--color-background)] text-[var(--color-text-muted)]'}`}>
                          {book.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {(user?.id === book.userId || user?.role === 'ADMIN') && book.status === 'UPCOMING' && (
                          <Button variant="danger" size="sm" onClick={() => handleCancel(book.id)}>Cancel</Button>
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

      <Modal isOpen={isBookOpen} onClose={() => setIsBookOpen(false)} title="New Booking">
        <form onSubmit={handleBook} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Resource</label>
            <select className="input-field" required value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})}>
              <option value="">Select Bookable Resource...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            <Input label="Start Time" type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="End Date" type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            <Input label="End Time" type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
          </div>
          <div className="flex justify-end mt-4"><Button type="submit">Book</Button></div>
        </form>
      </Modal>
    </div>
  );
};
