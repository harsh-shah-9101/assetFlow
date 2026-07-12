import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Users, Building2, Tags, Plus, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Setup = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'employees'>('departments');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form States
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'departments') endpoint = '/departments';
      if (activeTab === 'categories') endpoint = '/categories';
      if (activeTab === 'employees') endpoint = '/users';

      if (endpoint) {
        const response = await api.get(endpoint);
        setData(response.data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenModal = (item?: any) => {
    setSelectedItem(item || null);
    if (activeTab === 'departments') {
      setFormData(item || { name: '', headId: '', parentDeptId: '' });
    } else if (activeTab === 'categories') {
      setFormData(item || { name: '', warrantyPeriod: '' });
    } else if (activeTab === 'employees' && item) {
      setFormData({ role: item.role, departmentId: item.departmentId || '', isActive: item.isActive });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'departments') {
        if (selectedItem) {
          await api.put(`/departments/${selectedItem.id}`, formData);
        } else {
          await api.post('/departments', formData);
        }
      } else if (activeTab === 'categories') {
        const payload = { ...formData, warrantyPeriod: parseInt(formData.warrantyPeriod) || 0 };
        if (selectedItem) {
          await api.put(`/categories/${selectedItem.id}`, payload);
        } else {
          await api.post('/categories', payload);
        }
      } else if (activeTab === 'employees' && selectedItem) {
        await api.put(`/users/${selectedItem.id}/role`, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'categories', label: 'Asset Categories', icon: Tags },
    { id: 'employees', label: 'Employee Directory', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Organization Setup</h1>
          <p className="text-[var(--color-text-muted)]">Manage departments, asset categories, and employees.</p>
        </div>
        <Button variant="ghost" onClick={fetchData} className="gap-2">
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      <Card>
        <div className="border-b border-[var(--color-border)] flex overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  isActive 
                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold capitalize">{activeTab}</h3>
            {isAdmin && activeTab !== 'employees' && (
              <Button size="sm" onClick={() => handleOpenModal()} className="gap-2">
                <Plus size={16}/> Add {activeTab === 'departments' ? 'Department' : 'Category'}
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Name</th>
                  {activeTab === 'departments' && <th className="p-4 font-medium">Head</th>}
                  {activeTab === 'categories' && <th className="p-4 font-medium">Warranty (Months)</th>}
                  {activeTab === 'employees' && (
                    <>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Role</th>
                    </>
                  )}
                  {isAdmin && <th className="p-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-[var(--color-text-muted)]">No {activeTab} found.</td></tr>
                ) : (
                  data.map((item: any) => (
                    <tr key={item.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                      <td className="p-4 font-medium">{item.name}</td>
                      {activeTab === 'departments' && <td className="p-4">{item.head?.name || 'None'}</td>}
                      {activeTab === 'categories' && <td className="p-4">{item.warrantyPeriod || 0}</td>}
                      {activeTab === 'employees' && (
                        <>
                          <td className="p-4">{item.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs rounded-full">
                              {item.role}
                            </span>
                          </td>
                        </>
                      )}
                      {isAdmin && (
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>Edit</Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedItem ? `Edit ${activeTab.slice(0, -1)}` : `New ${activeTab.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'departments' && (
            <>
              <Input 
                label="Department Name" 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <Input 
                label="Head User ID (Optional)" 
                value={formData.headId || ''} 
                onChange={e => setFormData({...formData, headId: e.target.value})} 
              />
            </>
          )}
          {activeTab === 'categories' && (
            <>
              <Input 
                label="Category Name" 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <Input 
                type="number"
                label="Warranty Period (Months)" 
                value={formData.warrantyPeriod || ''} 
                onChange={e => setFormData({...formData, warrantyPeriod: e.target.value})} 
              />
            </>
          )}
          {activeTab === 'employees' && (
            <>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select 
                  className="input-field" 
                  value={formData.role || 'EMPLOYEE'} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="ASSET_MANAGER">Asset Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <Input 
                label="Department ID (Optional)" 
                value={formData.departmentId || ''} 
                onChange={e => setFormData({...formData, departmentId: e.target.value})} 
              />
            </>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
