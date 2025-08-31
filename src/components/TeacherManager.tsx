import React, { useState } from 'react';
import { Teacher } from '../types';
import { Plus, Edit2, Trash2, User } from 'lucide-react';

interface TeacherManagerProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onUpdateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  onDeleteTeacher: (id: string) => void;
}

export const TeacherManager: React.FC<TeacherManagerProps> = ({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}) => {
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subjects: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teacherData = {
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
      unavailableSlots: []
    };

    if (editingTeacher) {
      onUpdateTeacher(editingTeacher, teacherData);
      setEditingTeacher(null);
    } else {
      onAddTeacher(teacherData);
      setIsAddingTeacher(false);
    }

    setFormData({ name: '', email: '', phone: '', subjects: '' });
  };

  const handleEdit = (teacher: Teacher) => {
    setFormData({
      name: teacher.name,
      email: teacher.email || '',
      phone: teacher.phone || '',
      subjects: teacher.subjects.join(', ')
    });
    setEditingTeacher(teacher.id);
    setIsAddingTeacher(true);
  };

  const handleCancel = () => {
    setIsAddingTeacher(false);
    setEditingTeacher(null);
    setFormData({ name: '', email: '', phone: '', subjects: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-6 w-6" />
          教师管理
        </h2>
        <button
          onClick={() => setIsAddingTeacher(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          添加教师
        </button>
      </div>

      {isAddingTeacher && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingTeacher ? '编辑教师' : '添加新教师'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                电话
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                授课科目 * (用逗号分隔)
              </label>
              <input
                type="text"
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                className="input-field"
                placeholder="例如: 数学, 物理, 化学"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingTeacher ? '更新' : '添加'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(teacher)}
                  className="p-1 text-gray-500 hover:text-primary-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteTeacher(teacher.id)}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {teacher.email && (
              <p className="text-sm text-gray-600 mb-1">📧 {teacher.email}</p>
            )}
            {teacher.phone && (
              <p className="text-sm text-gray-600 mb-2">📞 {teacher.phone}</p>
            )}
            
            <div className="flex flex-wrap gap-1">
              {teacher.subjects.map((subject, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {teachers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无教师信息，点击上方按钮添加教师</p>
        </div>
      )}
    </div>
  );
};
