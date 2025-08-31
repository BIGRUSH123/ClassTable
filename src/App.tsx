import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TeacherManager } from './components/TeacherManager';
import { SimpleCourseManager } from './components/SimpleCourseManager';
import { ScheduleView } from './components/ScheduleView';
import { ScheduleGenerator } from './components/ScheduleGenerator';
import { 
  Teacher, 
  Course, 
  ScheduleItem
} from './types';
import { SchedulingResult } from './utils/schedulingAlgorithm';
import { 
  defaultTimeSlots, 
  defaultTeachers, 
  defaultCourses
} from './utils/defaultData';
import { cleanupOldData, migrateCourseData } from './utils/dataMigration';
import { validateCourseData, logCourseData, checkLocalStorageData } from './utils/debugHelper';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Play,
  Download
} from 'lucide-react';

type TabType = 'teachers' | 'courses' | 'schedule' | 'generate';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('teachers');
  
  // 在应用启动时清理旧数据和调试
  React.useEffect(() => {
    cleanupOldData();
    
    // 开发环境下的调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('=== 课表应用调试信息 ===');
      checkLocalStorageData();
    }
  }, []);
  
  // 使用 localStorage 持久化数据，并进行数据迁移
  const [teachers, setTeachers] = useLocalStorage<Teacher[]>('teachers', defaultTeachers);
  const [coursesRaw, setCoursesRaw] = useLocalStorage<any[]>('courses', defaultCourses);
  const [schedule, setSchedule] = useLocalStorage<ScheduleItem[]>('schedule', []);
  const [timeSlots] = useLocalStorage('timeSlots', defaultTimeSlots);
  
  // 迁移课程数据
  const courses = React.useMemo(() => {
    return migrateCourseData(coursesRaw);
  }, [coursesRaw]);
  
  // 验证课程数据
  React.useEffect(() => {
    if (courses.length > 0) {
      const validation = validateCourseData(courses);
      if (!validation.isValid) {
        console.error('课程数据验证失败:', validation.errors);
        alert('课程数据有问题，请检查控制台输出。建议点击"重置数据"按钮。');
      }
      if (validation.warnings.length > 0) {
        console.warn('课程数据警告:', validation.warnings);
      }
      
      if (process.env.NODE_ENV === 'development') {
        logCourseData(courses);
      }
    }
  }, [courses]);
  
  const setCourses = (newCourses: Course[] | ((prev: Course[]) => Course[])) => {
    if (typeof newCourses === 'function') {
      setCoursesRaw(prev => newCourses(migrateCourseData(prev)));
    } else {
      setCoursesRaw(newCourses);
    }
  };

  // 教师管理
  const handleAddTeacher = (teacher: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = {
      ...teacher,
      id: Date.now().toString()
    };
    setTeachers([...teachers, newTeacher]);
  };

  const handleUpdateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers(teachers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers(teachers.filter(t => t.id !== id));
    // 同时删除相关课程
    setCourses(courses.filter(c => c.teacherId !== id));
  };

  // 课程管理
  const handleAddCourse = (course: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...course,
      id: Date.now().toString()
    };
    setCourses([...courses, newCourse]);
  };

  const handleUpdateCourse = (id: string, updates: Partial<Course>) => {
    setCourses(courses.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
    // 从课表中移除相关条目
    setSchedule(schedule.filter(s => s.courseId !== id));
  };

  // 排课结果处理
  const handleScheduleGenerated = (result: SchedulingResult) => {
    if (result.success) {
      setSchedule(result.schedule);
      setActiveTab('schedule');
    }
  };

  // 导出课表
  const handleExportSchedule = () => {
    const data = {
      schedule,
      timeSlots,
      courses,
      teachers,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `个人课表_${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'teachers' as TabType, name: '教师管理', icon: Users },
    { id: 'courses' as TabType, name: '课程管理', icon: BookOpen },
    { id: 'generate' as TabType, name: '生成课表', icon: Play },
    { id: 'schedule' as TabType, name: '我的课表', icon: Calendar },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'teachers':
        return (
          <TeacherManager
            teachers={teachers}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
          />
        );
      case 'courses':
        return (
          <SimpleCourseManager
            courses={courses}
            teachers={teachers}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        );
      case 'generate':
        return (
          <ScheduleGenerator
            courses={courses}
            teachers={teachers}
            timeSlots={timeSlots}
            onScheduleGenerated={handleScheduleGenerated}
          />
        );
      case 'schedule':
        return (
          <ScheduleView
            schedule={schedule}
            timeSlots={timeSlots}
            courses={courses}
            teachers={teachers}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">个人课表管理</h1>
            </div>
            
            <div className="flex gap-2">
              {schedule.length > 0 && (
                <button
                  onClick={handleExportSchedule}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  导出课表
                </button>
              )}
              <button
                onClick={() => {
                  console.log('=== 手动调试检查 ===');
                  checkLocalStorageData();
                  logCourseData(courses);
                  const validation = validateCourseData(courses);
                  console.log('验证结果:', validation);
                  alert('调试信息已输出到控制台，请按F12查看');
                }}
                className="btn-secondary text-blue-600 hover:bg-blue-50"
              >
                调试信息
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要重置所有数据吗？这将清除所有课程和课表信息。')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="btn-secondary text-red-600 hover:bg-red-50"
              >
                重置数据
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 侧边栏导航 */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>

            {/* 数据统计 */}
            <div className="mt-8 card">
              <h3 className="font-semibold text-gray-900 mb-4">数据统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">教师</span>
                  <span className="font-medium">{teachers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">课程</span>
                  <span className="font-medium">{courses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">课表条目</span>
                  <span className="font-medium">{schedule.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总学分</span>
                  <span className="font-medium">{courses.reduce((sum, course) => sum + course.credits, 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
