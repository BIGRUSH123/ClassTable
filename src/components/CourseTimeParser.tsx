import React, { useState } from 'react';
import { Course, Teacher, FixedTimeSlot } from '../types';
import { Upload, FileText, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { parseCourseInfo, parseCourseTime } from '../utils/courseTimeParser';

interface CourseTimeParserProps {
  teachers: Teacher[];
  onImportCourses: (courses: Omit<Course, 'id'>[]) => void;
  onClose: () => void;
}

export const CourseTimeParser: React.FC<CourseTimeParserProps> = ({
  teachers,
  onImportCourses,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  // 示例数据
  const exampleText = `有限自动机理论	陈文宇,余盛季	计算机科学与工程学院（网络空间安全学院）	清水河	32	2	1-6周，星期一第5-6节 星期三第5-6节 (立人楼B411)
						7-8周，星期一第5-6节 星期三第5-6节 (立人楼B411)
高级软件开发技术	孙明	计算机科学与工程学院	清水河	16	1	1-8周，星期一第9-11节 (立人楼B402)
机器学习2班	钟秀琴	计算机科学与工程学院	清水河	32	2	1-16周，星期二第3-4节 星期四第7-8节 (立人楼B409)`;

  const handleImport = () => {
    if (!inputText.trim()) {
      setImportResult({
        success: false,
        message: '请输入课程数据'
      });
      return;
    }

    try {
      const courses = parseCourseText(inputText);
      
      if (courses.length === 0) {
        setImportResult({
          success: false,
          message: '未能解析出任何课程数据，请检查格式'
        });
        return;
      }

      onImportCourses(courses);
      setImportResult({
        success: true,
        message: '课程导入成功！',
        count: courses.length
      });
      setInputText('');
    } catch (error) {
      setImportResult({
        success: false,
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
  };

  // 解析课程文本
  const parseCourseText = (text: string): Omit<Course, 'id'>[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const courses: Omit<Course, 'id'>[] = [];

    for (const line of lines) {
      try {
        // 使用新的解析器
        const courseInfo = parseCourseInfo(line);
        
        // 查找对应的教师ID
        const teacherNames = courseInfo.teachers;
        const teacher = teachers.find(t => 
          teacherNames.some(name => t.name.includes(name) || name.includes(t.name))
        );

        courses.push({
          name: courseInfo.name,
          subject: courseInfo.department || '未知学科',
          teacherId: teacher?.id || teachers[0]?.id || 'unknown',
          credits: courseInfo.credits || 2,
          fixedTimeSlots: courseInfo.timeSlots,
          location: courseInfo.timeSlots[0]?.location,
          weeks: `1-20周`, // 默认全学期
          teachers: courseInfo.teachers,
          department: courseInfo.department,
          campus: courseInfo.campus
        });
      } catch (error) {
        console.warn('解析课程行失败:', line, error);
        
        // 尝试简单的分割解析作为后备
        try {
          const parts = line.split('\t').map(part => part.trim());
          if (parts.length >= 6) {
            const [name, teacherName, department, campus, hoursStr, creditsStr, ...scheduleParts] = parts;
            const scheduleText = scheduleParts.join('\n');
            
            // 使用解析器解析时间
            const timeSlots = parseCourseTime(scheduleText);
            
            const teacher = teachers.find(t => t.name.includes(teacherName) || teacherName.includes(t.name));
            
            courses.push({
              name,
              subject: department || '未知学科',
              teacherId: teacher?.id || teachers[0]?.id || 'unknown',
              credits: parseInt(creditsStr) || 2,
              fixedTimeSlots: timeSlots,
              location: timeSlots[0]?.location,
              weeks: `1-20周`,
              teachers: [teacherName],
              department,
              campus
            });
          }
        } catch (fallbackError) {
          console.warn('后备解析也失败:', line, fallbackError);
        }
      }
    }

    return courses;
  };

  const copyExample = () => {
    setInputText(exampleText);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            课程时间解析导入
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              课程数据
            </label>
            <div className="mb-2">
              <button
                onClick={copyExample}
                className="text-sm btn-secondary flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                使用示例数据
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请粘贴课程数据，每行一门课程，格式：课程名	教师	学院	校区	学时	学分	时间安排"
              className="w-full h-40 p-3 border border-gray-300 rounded-lg text-sm font-mono"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              支持的时间格式示例
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• 1-6周，星期一第5-6节 星期三第5-6节 (立人楼B411)</p>
              <p>• 7-8周，星期一第5-6节 星期三第5-6节 (立人楼B411)</p>
              <p>• 支持多个周次范围，不同教室</p>
              <p>• 自动识别星期和节次，支持连续节次</p>
            </div>
          </div>

          {importResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              importResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${
                  importResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {importResult.message}
                </p>
                {importResult.count && (
                  <p className="text-green-700 text-sm mt-1">
                    成功导入 {importResult.count} 门课程
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleImport}
              disabled={!inputText.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              导入课程
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
