import React, { useState, useRef } from 'react';
import { ScheduleItem, TimeSlot, Course, Teacher } from '../types';
import { Calendar, Clock, MapPin, User, Download, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import html2canvas from 'html2canvas';
import { isWeekInRanges, formatWeekRanges } from '../utils/courseTimeParser';

interface ScheduleViewProps {
  schedule: ScheduleItem[];
  timeSlots: TimeSlot[];
  courses: Course[];
  teachers: Teacher[];
}

const DAYS = ['周一', '周二', '周三', '周四', '周五'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedule,
  timeSlots,
  courses,
  teachers
}) => {
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  // 导出为图片
  const handleExportImage = async () => {
    if (!scheduleRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(scheduleRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // 提高图片质量
        useCORS: true,
        allowTaint: true,
        width: scheduleRef.current.scrollWidth,
        height: scheduleRef.current.scrollHeight
      });
      
      const link = document.createElement('a');
      link.download = `课表_${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('导出图片失败:', error);
      alert('导出图片失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 过滤课表数据
  const filteredSchedule = schedule.filter(item => {
    if (selectedTeacher !== 'all' && item.teacherId !== selectedTeacher) return false;
    // 检查该课表项是否在选中的周次有效
    if (!isWeekInRanges(selectedWeek, item.weeks)) return false;
    return true;
  });

  // 获取课程信息
  const getCourseInfo = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  // 获取教师信息
  const getTeacherInfo = (teacherId: string) => {
    return teachers.find(t => t.id === teacherId);
  };

  // 移除教室和班级相关的辅助函数

  // 获取指定时间段的课程
  const getScheduleItem = (dayOfWeek: number, timeSlotId: string) => {
    return filteredSchedule.find(
      item => item.dayOfWeek === dayOfWeek && item.timeSlotId === timeSlotId
    );
  };

  // 渲染课程卡片
  const renderCourseCard = (item: ScheduleItem) => {
    const course = getCourseInfo(item.courseId);
    const teacher = getTeacherInfo(item.teacherId);

    if (!course || !teacher) return null;

    return (
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 h-full min-h-[120px] hover:bg-primary-100 transition-colors">
        <div className="space-y-1">
          <h4 className="font-semibold text-primary-900 text-sm leading-tight">
            {course.name}
          </h4>
          <div className="space-y-1 text-xs text-primary-700">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{teacher.name}</span>
            </div>
            {item.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{item.location}</span>
              </div>
            )}
            {item.weeks && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatWeekRanges(item.weeks)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{course.credits}学分</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          课表展示 - 第{selectedWeek}周
        </h2>
        
        <div className="flex gap-4">
          {filteredSchedule.length > 0 && (
            <button
              onClick={handleExportImage}
              disabled={isExporting}
              className={`btn-secondary flex items-center gap-2 ${
                isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Image className="h-4 w-4" />
              {isExporting ? '导出中...' : '导出图片'}
            </button>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              筛选教师
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="input-field min-w-[120px]"
            >
              <option value="all">全部教师</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 周次选择器 */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <span className="font-medium text-gray-700">选择周次：</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
            disabled={selectedWeek <= 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">第</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>{week}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600">周</span>
          </div>
          <button
            onClick={() => setSelectedWeek(Math.min(20, selectedWeek + 1))}
            disabled={selectedWeek >= 20}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="ml-auto text-sm text-gray-600">
          共{filteredSchedule.length}门课程
        </div>
      </div>

      {filteredSchedule.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无课表数据，请先生成课表</p>
        </div>
      ) : (
        <div className="card overflow-x-auto" ref={scheduleRef}>
          <div className="min-w-[800px]">
            {/* 表头 */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              <div className="font-semibold text-gray-700 p-3 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1" />
                时间
              </div>
              {DAYS.map((day, index) => (
                <div key={day} className="font-semibold text-gray-700 p-3 text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* 课表内容 */}
            <div className="space-y-2">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot.id} className="grid grid-cols-6 gap-2">
                  {/* 时间列 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <div className="font-medium text-gray-900 text-sm">
                      {timeSlot.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {timeSlot.startTime}-{timeSlot.endTime}
                    </div>
                  </div>

                  {/* 每天的课程 */}
                  {DAYS.map((day, dayIndex) => {
                    const dayOfWeek = dayIndex + 1;
                    const scheduleItem = getScheduleItem(dayOfWeek, timeSlot.id);
                    
                    return (
                      <div key={`${dayOfWeek}-${timeSlot.id}`} className="min-h-[120px]">
                        {scheduleItem ? (
                          renderCourseCard(scheduleItem)
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg h-full min-h-[120px] flex items-center justify-center">
                            <span className="text-gray-400 text-sm">空闲</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {filteredSchedule.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">
              {filteredSchedule.length}
            </div>
            <div className="text-sm text-gray-600">课表条目</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              {new Set(filteredSchedule.map(item => item.teacherId)).size}
            </div>
            <div className="text-sm text-gray-600">参与教师</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(filteredSchedule.map(item => item.location).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-600">上课地点</div>
          </div>
        </div>
      )}
    </div>
  );
};
