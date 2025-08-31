import React, { useState } from 'react';
import { Course, Teacher, FixedTimeSlot } from '../types';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface SimpleCourseImporterProps {
  teachers: Teacher[];
  onImportCourses: (courses: Omit<Course, 'id'>[]) => void;
}

interface ParsedCourse {
  name: string;
  teacherName: string;
  college: string;
  campus: string;
  hours: number;
  credits: number;
  schedule: string;
  location?: string;
}

export const SimpleCourseImporter: React.FC<SimpleCourseImporterProps> = ({
  teachers,
  onImportCourses
}) => {
  const [inputText, setInputText] = useState('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  // 解析课程文本
  const parseCourseText = (text: string): ParsedCourse[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const courses: ParsedCourse[] = [];

    for (const line of lines) {
      try {
        const parts = line.split('\t').map(part => part.trim());
        
        if (parts.length >= 6) {
          const [name, teacherName, college, campus, hoursStr, creditsStr, ...scheduleParts] = parts;
          const schedule = scheduleParts.join('\t');
          
          // 提取教室信息
          const locationMatch = schedule.match(/\(([^)]+)\)/);
          const location = locationMatch ? locationMatch[1] : undefined;
          
          courses.push({
            name,
            teacherName,
            college,
            campus,
            hours: parseInt(hoursStr) || 0,
            credits: parseInt(creditsStr) || 0,
            schedule,
            location
          });
        }
      } catch (error) {
        console.warn('解析课程行失败:', line, error);
      }
    }

    return courses;
  };

  // 解析时间安排为固定时间段
  const parseScheduleToTimeSlots = (schedule: string): FixedTimeSlot[] => {
    const timeSlots: FixedTimeSlot[] = [];
    
    // 匹配星期和节次的模式
    const dayTimeMatches = schedule.match(/星期([一二三四五六日])第(\d+)-?(\d+)?节/g);
    
    if (dayTimeMatches) {
      dayTimeMatches.forEach(match => {
        const dayMatch = match.match(/星期([一二三四五六日])/);
        const timeMatch = match.match(/第(\d+)-?(\d+)?节/);
        
        if (dayMatch && timeMatch) {
          const dayMap: { [key: string]: number } = {
            '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7
          };
          
          const dayOfWeek = dayMap[dayMatch[1]];
          const startSlot = timeMatch[1];
          const endSlot = timeMatch[2] || startSlot;
          
          const timeSlotIds: string[] = [];
          for (let i = parseInt(startSlot); i <= parseInt(endSlot); i++) {
            timeSlotIds.push(i.toString());
          }
          
          timeSlots.push({
            dayOfWeek,
            timeSlotIds
          });
        }
      });
    }
    
    return timeSlots;
  };

  // 查找或创建教师
  const findTeacher = (teacherName: string): string => {
    // 处理多个教师的情况，取第一个
    const primaryTeacher = teacherName.split(',')[0].trim();
    
    const existingTeacher = teachers.find(t => t.name === primaryTeacher);
    if (existingTeacher) {
      return existingTeacher.id;
    }
    
    // 如果教师不存在，返回第一个教师的ID作为默认值
    return teachers.length > 0 ? teachers[0].id : 'unknown';
  };

  // 处理导入
  const handleImport = () => {
    if (!inputText.trim()) {
      setImportResult({
        success: false,
        message: '请输入课程信息'
      });
      return;
    }

    try {
      const parsedCourses = parseCourseText(inputText);
      
      if (parsedCourses.length === 0) {
        setImportResult({
          success: false,
          message: '未能解析出任何课程信息，请检查格式'
        });
        return;
      }

      const coursesToImport: Omit<Course, 'id'>[] = parsedCourses.map(parsed => {
        const fixedTimeSlots = parseScheduleToTimeSlots(parsed.schedule);
        
        return {
          name: parsed.name,
          subject: '计算机科学', // 默认学科
          teacherId: findTeacher(parsed.teacherName),
          credits: parsed.credits,
          location: parsed.location,
          weeks: '1-16周', // 默认周次
          fixedTimeSlots
        };
      });

      onImportCourses(coursesToImport);
      
      setImportResult({
        success: true,
        message: `成功导入 ${coursesToImport.length} 门课程！`,
        count: coursesToImport.length
      });
      
      // 清空输入
      setInputText('');
    } catch (error) {
      setImportResult({
        success: false,
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          课程批量导入
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              粘贴课程信息 (制表符分隔)
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="input-field h-32 font-mono text-sm"
              placeholder="请粘贴课程信息，格式如下：
高级算法设计与分析2班	周毅	计算机科学与工程学院（网络空间安全学院）	清水河	32	2	1-8周，星期一第7-8节 星期三第7-8节 (立人楼B406)"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="btn-primary flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              导入课程
            </button>
          </div>
        </div>
      </div>

      {/* 导入结果 */}
      {importResult && (
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <h4 className="font-medium">
              {importResult.success ? '导入成功' : '导入失败'}
            </h4>
          </div>
          
          <p className={`${
            importResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {importResult.message}
          </p>
        </div>
      )}

      {/* 使用说明 */}
      <div className="card bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">使用说明</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• 每行一门课程，使用制表符(Tab)分隔各字段</p>
          <p>• 格式：课程名 → 教师名 → 学院 → 校区 → 学时 → 学分 → 时间安排</p>
          <p>• 支持多个教师，用逗号分隔（将使用第一个教师）</p>
          <p>• 时间安排示例：1-8周，星期一第7-8节 星期三第7-8节 (立人楼B406)</p>
          <p>• 教室信息用括号包围，如 (立人楼B406)</p>
          <p>• 系统会自动解析星期和节次信息</p>
        </div>
      </div>
    </div>
  );
};
