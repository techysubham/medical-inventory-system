import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Save, Users as UsersIcon } from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

const ROLES = ['superadmin', 'admin', 'manager', 'staff'];
const ALL_PERMISSIONS = [
  'view_inventory',
  'manage_inventory',
  'view_discounts',
  'manage_discounts',
  'view_invoices',
  'manage_invoices',
  'view_reports',
  'manage_users',
  'view_suppliers',
  'manage_suppliers',
  'view_settings',
  'manage_settings',
];

export function UserManagement() {
  const { token, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'staff',
    permissions: [],
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/users`, { headers });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `${API_URL}/auth/users/${editingUser._id}` : `${API_URL}/auth/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const body = editingUser
        ? {
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            permissions: formData.permissions,
          }
        : formData;

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save user');

      setShowModal(false);
      resetForm();
      fetchUsers();
      alert(editingUser ? 'User updated successfully' : 'User created successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`${API_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete user');
      fetchUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'staff',
      permissions: [],
    });
    setEditingUser(null);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
    });
    setShowModal(true);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      superadmin: 'bg-red-100 text-red-800',
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      staff: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <UsersIcon size={36} className="text-blue-600" />
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-teal-600">User Management</span>
          </h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        {hasPermission('manage_users') && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-glossy flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 shadow-glossy-lg"
          >
            <Plus size={20} />
            <span className="font-bold">Create User</span>
          </button>
        )}
      </div>

      <div className="glass-card border border-white/20 shadow-glossy-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Email</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Role</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Permissions</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-blue-50/50 transition-all duration-300 group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 group-hover:text-blue-600">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.permissions.length > 0 ? `${user.permissions.length} permissions` : 'None'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  {hasPermission('manage_users') ? (
                    <>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2.5 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2.5 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">View only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">No users found</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email {!editingUser && '*'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingUser}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-3 p-4 border border-gray-300 rounded-lg">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [...formData.permissions, perm],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter((p) => p !== perm),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
                >
                  <Save size={18} />
                  {editingUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
