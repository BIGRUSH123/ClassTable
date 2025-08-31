import React, { useState } from 'react';
import { Course, Teacher, FixedTimeSlot } from '../types';
import { Plus, Edit2, Trash2, BookOpen, Upload, Clock, MapPin } from 'lucide-react';
import { SimpleCourseImporter } from './SimpleCourseImporter';
import { CourseTimeParser } from './CourseTimeParser';

interface SimpleCourseManagerProps {
  courses: Course[];
  teachers: Teacher[];
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onUpdateCourse: (id: string, course: Partial<Course>) => void;
  onDeleteCourse: (id: string) => void;
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_SLOTS = [
  { id: '1', name: '第1节' }, { id: '2', name: '第2节' }, { id: '3', name: '第3节' }, { id: '4', name: '第4节' },
  { id: '5', name: '第5节' }, { id: '6', name: '第6节' }, { id: '7', name: '第7节' }, { id: '8', name: '第8节' },
  { id: '9', name: '第9节' }, { id: '10', name: '第10节' }, { id: '11', name: '第11节' }, { id: '12', name: '第12节' }
];

export const SimpleCourseManager: React.FC<SimpleCourseManagerProps> = ({
  courses,
  teachers,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse
}) => {
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showNewParser, setShowNewParser] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    teacherId: '',
    credits: '2',
    location: '',
    weeks: '1-16周'
  });
  const [timeSlots, setTimeSlots] = useState<FixedTimeSlot[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证时间段数据
    if (timeSlots.length === 0) {
      alert('请至少添加一个上课时间段');
      return;
    }
    
    // 确保所有时间段都有有效的数据
    const validTimeSlots = timeSlots.filter(slot => 
      slot.dayOfWeek >= 1 && slot.dayOfWeek <= 7 && 
      slot.timeSlotIds && slot.timeSlotIds.length > 0
    );
    
    if (validTimeSlots.length === 0) {
      alert('请确保所有时间段都有有效的配置');
      return;
    }
    
    const courseData = {
      name: formData.name,
      subject: formData.subject,
      teacherId: formData.teacherId,
      credits: parseInt(formData.credits),
      location: formData.location || undefined,
      weeks: formData.weeks,
      fixedTimeSlots: validTimeSlots
    };

    if (editingCourse) {
      onUpdateCourse(editingCourse, courseData);
      setEditingCourse(null);
    } else {
      onAddCourse(courseData);
      setIsAddingCourse(false);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      teacherId: '',
      credits: '2',
      location: '',
      weeks: '1-16周'
    });
    setTimeSlots([]);
  };

  const handleEdit = (course: Course) => {
    setFormData({
      name: course.name,
      subject: course.subject,
      teacherId: course.teacherId,
      credits: course.credits.toString(),
      location: course.location || '',
      weeks: course.weeks || '1-16周'
    });
    setTimeSlots(course.fixedTimeSlots);
    setEditingCourse(course.id);
    setIsAddingCourse(true);
  };

  const handleCancel = () => {
    setIsAddingCourse(false);
    setEditingCourse(null);
    resetForm();
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { dayOfWeek: 1, timeSlotIds: ['1'] }]);
  };

  const updateTimeSlot = (index: number, updates: Partial<FixedTimeSlot>) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = { ...newTimeSlots[index], ...updates };
    setTimeSlots(newTimeSlots);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const getTeacherName = (teacherId: string) => {
    return teachers.find(t => t.id === teacherId)?.name || '未知教师';
  };

  const formatTimeSlots = (fixedTimeSlots: FixedTimeSlot[]) => {
    return fixedTimeSlots.map(slot => {
      const dayName = DAYS[slot.dayOfWeek - 1];
      const timeNames = slot.timeSlotIds.map(id => 
        TIME_SLOTS.find(ts => ts.id === id)?.name || id
      ).join('-');
      return `${dayName} ${timeNames}`;
    }).join(', ');
  };

  const handleImportCourses = (importedCourses: Omit<Course, 'id'>[]) => {
    importedCourses.forEach(course => {
      onAddCourse(course);
    });
    setShowImporter(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          课程管理
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddingCourse(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            添加课程
          </button>
          <button
            onClick={() => setShowImporter(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            批量导入
          </button>
          <button
            onClick={() => setShowNewParser(true)}
            className="btn-secondary flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <BookOpen className="h-4 w-4" />
            智能解析
          </button>
        </div>
      </div>

      {isAddingCourse && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingCourse ? '编辑课程' : '添加新课程'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程名称 *
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
                  学科 *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  授课教师 *
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">请选择教师</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学分 *
                </label>
                <input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  className="input-field"
                  min="1"
                  max="10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上课周次
                </label>
                <input
                  type="text"
                  value={formData.weeks}
                  onChange={(e) => setFormData({ ...formData, weeks: e.target.value })}
                  className="input-field"
                  placeholder="如: 1-16周"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上课地点
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
                placeholder="如: 立人楼B411"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  上课时间 *
                </label>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="btn-secondary text-sm py-1 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  添加时间段
                </button>
              </div>
              
              {timeSlots.map((slot, index) => (
                <div key={index} className="flex gap-2 mb-2 p-3 bg-gray-50 rounded">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateTimeSlot(index, { dayOfWeek: parseInt(e.target.value) })}
                    className="input-field flex-1"
                  >
                    {DAYS.map((day, dayIndex) => (
                      <option key={dayIndex} value={dayIndex + 1}>{day}</option>
                    ))}
                  </select>
                  
                  <select
                    value={slot.timeSlotIds[0] || '1'}
                    onChange={(e) => updateTimeSlot(index, { timeSlotIds: [e.target.value] })}
                    className="input-field flex-1"
                  >
                    {TIME_SLOTS.map((timeSlot) => (
                      <option key={timeSlot.id} value={timeSlot.id}>{timeSlot.name}</option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="btn-danger py-2 px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {timeSlots.length === 0 && (
                <p className="text-sm text-gray-500">请添加至少一个上课时间段</p>
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={timeSlots.length === 0}>
                {editingCourse ? '更新' : '添加'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {showImporter && (
        <SimpleCourseImporter
          teachers={teachers}
          onImportCourses={handleImportCourses}
        />
      )}

      {showNewParser && (
        <CourseTimeParser
          teachers={teachers}
          onImportCourses={(courses) => {
            handleImportCourses(courses);
            setShowNewParser(false);
          }}
          onClose={() => setShowNewParser(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(course)}
                  className="p-1 text-gray-500 hover:text-primary-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteCourse(course.id)}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>📚 学科: {course.subject}</p>
              <p>👨‍🏫 教师: {getTeacherName(course.teacherId)}</p>
              <p>🎓 学分: {course.credits}</p>
              {course.location && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{course.location}</p>}
              {course.weeks && <p>📅 {course.weeks}</p>}
              <div className="flex items-start gap-1">
                <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="text-xs">{formatTimeSlots(course.fixedTimeSlots)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无课程信息，点击上方按钮添加课程</p>
        </div>
      )}
    </div>
  );
};
