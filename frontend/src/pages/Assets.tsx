import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Filter } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Assets = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    name: '', categoryId: '', departmentId: '', serialNumber: '',
    acquisitionDate: '', acquisitionCost: '', condition: 'New',
    location: '', isSharedBookable: false
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, catsRes, deptsRes] = await Promise.all([
        api.get('/assets'),
        api.get('/categories'),
        api.get('/departments')
      ]);
      setAssets(assetsRes.data);
      setCategories(catsRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assets', {
        ...formData,
        acquisitionCost: formData.acquisitionCost ? parseFloat(formData.acquisitionCost) : undefined
      });
      setIsRegisterOpen(false);
      setFormData({ name: '', categoryId: '', departmentId: '', serialNumber: '', acquisitionDate: '', acquisitionCost: '', condition: 'New', location: '', isSharedBookable: false });
      fetchData();
    } catch (error) {
      console.error("Failed to register asset", error);
      alert("Registration failed");
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedAsset) return;
    try {
      await api.put(`/assets/${selectedAsset.id}/status`, { status });
      // Refresh asset details
      const response = await api.get(`/assets/${selectedAsset.id}`);
      setSelectedAsset(response.data);
      fetchData(); // refresh background list
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const openDetails = async (id: string) => {
    try {
      const response = await api.get(`/assets/${id}`);
      setSelectedAsset(response.data);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Failed to fetch asset details", error);
    }
  };

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
      case 'ALLOCATED': return 'bg-[var(--color-primary-light)] text-[var(--color-primary)]';
      case 'UNDER_MAINTENANCE': return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
      case 'LOST': 
      case 'RETIRED':
      case 'DISPOSED': return 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]';
      default: return 'bg-[var(--color-background)] text-[var(--color-text-muted)]';
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.assetTag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    const matchesCategory = categoryFilter ? a.categoryId === categoryFilter : true;
    const matchesDepartment = departmentFilter ? a.departmentId === departmentFilter : true;
    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment;
  });

  const isManagerOrAdmin = user?.role === 'ASSET_MANAGER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Assets Directory</h1>
          <p className="text-[var(--color-text-muted)]">Manage and track your organization's assets.</p>
        </div>
        {isManagerOrAdmin && (
          <Button className="gap-2" onClick={() => setIsRegisterOpen(true)}>
            <Plus size={18} />
            Register Asset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex w-full max-w-sm items-center gap-2 relative">
            <Search className="absolute left-3 text-[var(--color-text-muted)]" size={18} />
            <input 
              type="text" 
              className="input-field w-full" 
              style={{ paddingLeft: '40px' }}
              placeholder="Search by name or tag..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <select className="input-field !py-2 !px-3 bg-[var(--color-surface)]" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input-field !py-2 !px-3 bg-[var(--color-surface)]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
              <option value="LOST">Lost</option>
              <option value="RETIRED">Retired</option>
            </select>
            <select className="input-field !py-2 !px-3 bg-[var(--color-surface)]" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              <option value="">Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Asset Tag</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center">Loading assets...</td></tr>
                ) : filteredAssets.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">No assets found.</td></tr>
                ) : (
                  filteredAssets.map(asset => (
                    <tr key={asset.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors">
                      <td className="p-4 font-medium text-[var(--color-primary)]">{asset.assetTag}</td>
                      <td className="p-4 font-medium text-[var(--color-text)]">{asset.name}</td>
                      <td className="p-4 text-[var(--color-text-muted)]">{asset.category?.name || 'N/A'}</td>
                      <td className="p-4 text-[var(--color-text-muted)]">{asset.department?.name || 'Unassigned'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(asset.status)}`}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(asset.id)}>View</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Registration Modal */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register New Asset">
        <form onSubmit={handleRegister} className="space-y-4">
          <Input label="Asset Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Category</label>
              <select className="input-field" required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Department</label>
              <select className="input-field" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                <option value="">None / Company-wide</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Serial Number" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
            <Input label="Acquisition Date" type="date" required value={formData.acquisitionDate} onChange={e => setFormData({...formData, acquisitionDate: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cost ($)" type="number" step="0.01" value={formData.acquisitionCost} onChange={e => setFormData({...formData, acquisitionCost: e.target.value})} />
            <Input label="Condition" required value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} />
          </div>
          <Input label="Location" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={formData.isSharedBookable} onChange={e => setFormData({...formData, isSharedBookable: e.target.checked})} />
            <span className="text-sm font-medium">Available for Shared Bookings</span>
          </label>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
            <Button type="submit">Register</Button>
          </div>
        </form>
      </Modal>

      {/* Asset Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Asset Details">
        {selectedAsset ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-primary)]">{selectedAsset.assetTag}</h3>
                <p className="text-lg">{selectedAsset.name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(selectedAsset.status)}`}>
                {selectedAsset.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[var(--color-text-muted)]">Category:</span> {selectedAsset.category?.name}</div>
              <div><span className="text-[var(--color-text-muted)]">Department:</span> {selectedAsset.department?.name || 'N/A'}</div>
              <div><span className="text-[var(--color-text-muted)]">Serial:</span> {selectedAsset.serialNumber || 'N/A'}</div>
              <div><span className="text-[var(--color-text-muted)]">Location:</span> {selectedAsset.location}</div>
              <div><span className="text-[var(--color-text-muted)]">Condition:</span> {selectedAsset.condition}</div>
              <div><span className="text-[var(--color-text-muted)]">Acquired:</span> {new Date(selectedAsset.acquisitionDate).toLocaleDateString()}</div>
            </div>

            {isManagerOrAdmin && (
              <div className="border-t border-[var(--color-border)] pt-4 mt-4">
                <h4 className="font-semibold mb-2">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {['AVAILABLE', 'RESERVED', 'LOST', 'RETIRED', 'DISPOSED'].map(st => (
                    <Button 
                      key={st} 
                      variant={selectedAsset.status === st ? 'primary' : 'secondary'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(st)}
                    >
                      {st.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </Modal>
    </div>
  );
};
