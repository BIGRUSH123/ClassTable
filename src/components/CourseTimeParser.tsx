import React, { useState } from 'react';
import { Course, Teacher, FixedTimeSlot, WeekRange } from '../types';
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Edit3, Save, X, Eye, AlertTriangle } from 'lucide-react';
import { parseCourseInfo, parseCourseTime, deduplicateTimeSlots } from '../utils/courseTimeParser';

interface CourseTimeParserProps {
  teachers: Teacher[];
  onImportCourses: (courses: Omit<Course, 'id'>[]) => void;
  onAddTeacher?: (teacher: Omit<Teacher, 'id'>) => void;
  onClose: () => void;
}

// 解析后的课程数据预览接口
interface ParsedCoursePreview {
  id: string;
  name: string;
  teachers: string[];
  department: string;
  campus: string;
  credits: number;
  timeSlots: FixedTimeSlot[];
  timeDisplay: string;
  isEditing: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export const CourseTimeParser: React.FC<CourseTimeParserProps> = ({
  teachers,
  onImportCourses,
  onAddTeacher,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<ParsedCoursePreview[]>([]);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  // 示例数据
  const exampleText = `新时代中国特色社会主义理论与实践10班	2	考试	马克思主义学院	封莎	清水河	1-5周，星期一第3-4节 (立人楼B417)
7-10周，星期一第3-4节 (立人楼B417)
1-4周，星期四第3-4节 (立人楼B417)
6-10周，星期四第3-4节 (立人楼B417)
学术规范与论文写作1班	1	考查	计算机科学与工程学院（网络空间安全学院）	叶茂	清水河	11-14周，星期一第3-4节 星期三第3-4节 (立人楼B417)`;

  // 格式化时间显示
  const formatTimeDisplay = (timeSlots: FixedTimeSlot[]): string => {
    if (timeSlots.length === 0) return '无时间安排';
    
    return timeSlots.map(slot => {
      const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const dayName = dayNames[slot.dayOfWeek] || '未知';
      const timeRange = slot.timeSlotIds.length > 1 
        ? `第${slot.timeSlotIds[0]}-${slot.timeSlotIds[slot.timeSlotIds.length - 1]}节`
        : `第${slot.timeSlotIds[0]}节`;
      const location = slot.location ? ` (${slot.location})` : '';
      const weeks = slot.weeks && slot.weeks.length > 0 
        ? slot.weeks.map(w => w.start === w.end ? `${w.start}周` : `${w.start}-${w.end}周`).join('，')
        : '全学期';
      
      return `${weeks}，${dayName}${timeRange}${location}`;
    }).join('；');
  };

  // 检测重复时间段
  const findDuplicateTimeSlots = (timeSlots: FixedTimeSlot[]): string[] => {
    const duplicates: string[] = [];
    const seen = new Set<string>();
    
    for (const slot of timeSlots) {
      for (const timeSlotId of slot.timeSlotIds) {
        const key = `周${['', '一', '二', '三', '四', '五', '六', '日'][slot.dayOfWeek]}第${timeSlotId}节`;
        if (seen.has(key)) {
          if (!duplicates.includes(key)) {
            duplicates.push(key);
          }
        } else {
          seen.add(key);
        }
      }
    }
    
    return duplicates;
  };

  // 检查课程间的时间冲突
  const checkCrossCoursesConflicts = (courses: ParsedCoursePreview[]) => {
    const conflicts: { [key: string]: ParsedCoursePreview[] } = {};
    
    // 为每个时间段创建映射
    for (let i = 0; i < courses.length; i++) {
      const courseA = courses[i];
      
      for (const slotA of courseA.timeSlots) {
        for (const timeSlotId of slotA.timeSlotIds) {
          // 检查其他课程的相同时间段
          for (let j = i + 1; j < courses.length; j++) {
            const courseB = courses[j];
            
            for (const slotB of courseB.timeSlots) {
              if (slotA.dayOfWeek === slotB.dayOfWeek && 
                  slotB.timeSlotIds.includes(timeSlotId) &&
                  hasWeekOverlap(slotA.weeks, slotB.weeks)) {
                
                const conflictKey = `${slotA.dayOfWeek}-${timeSlotId}`;
                const dayName = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][slotA.dayOfWeek];
                const timeKey = `${dayName}第${timeSlotId}节`;
                
                if (!conflicts[conflictKey]) {
                  conflicts[conflictKey] = [];
                }
                
                // 添加冲突的课程（避免重复）
                if (!conflicts[conflictKey].find(c => c.id === courseA.id)) {
                  conflicts[conflictKey].push(courseA);
                }
                if (!conflicts[conflictKey].find(c => c.id === courseB.id)) {
                  conflicts[conflictKey].push(courseB);
                }
                
                // 标记两门课程都有错误
                if (!courseA.hasError) {
                  courseA.hasError = true;
                  courseA.errorMessage = `与其他课程时间冲突: ${timeKey}`;
                } else if (!courseA.errorMessage?.includes('时间冲突')) {
                  courseA.errorMessage += `; 与其他课程时间冲突: ${timeKey}`;
                }
                
                if (!courseB.hasError) {
                  courseB.hasError = true;
                  courseB.errorMessage = `与其他课程时间冲突: ${timeKey}`;
                } else if (!courseB.errorMessage?.includes('时间冲突')) {
                  courseB.errorMessage += `; 与其他课程时间冲突: ${timeKey}`;
                }
              }
            }
          }
        }
      }
    }
    
    return conflicts;
  };

  // 预览解析结果
  const handlePreview = () => {
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

      // 转换为预览格式，并检查内部重复
      const previews: ParsedCoursePreview[] = courses.map((course, index) => {
        // 检查该课程内部是否有重复的时间段
        const duplicateSlots = findDuplicateTimeSlots(course.fixedTimeSlots);
        const hasInternalDuplicates = duplicateSlots.length > 0;
        
        return {
          id: `preview_${index}`,
          name: course.name,
          teachers: course.teachers || [],
          department: course.department || '未知学院',
          campus: course.campus || '未知校区',
          credits: course.credits,
          timeSlots: course.fixedTimeSlots,
          timeDisplay: formatTimeDisplay(course.fixedTimeSlots),
          isEditing: false,
          hasError: hasInternalDuplicates,
          errorMessage: hasInternalDuplicates ? `检测到重复时间段: ${duplicateSlots.join(', ')}` : undefined
        };
      });

      // 检查课程间的时间冲突
      checkCrossCoursesConflicts(previews);

      setParsedCourses(previews);
      setPreviewMode(true);
      setImportResult(null);
    } catch (error) {
      setImportResult({
        success: false,
        message: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
  };

  // 检查课程是否重复
  const checkDuplicateCourses = (coursesToImport: Omit<Course, 'id'>[], existingCourses: Course[]) => {
    const duplicates: { course: Omit<Course, 'id'>; reason: string }[] = [];
    const warnings: string[] = [];
    
    for (const newCourse of coursesToImport) {
      // 检查相同课程名和教师的重复
      const duplicateName = existingCourses.find(existing => 
        existing.name === newCourse.name && existing.teacherId === newCourse.teacherId
      );
      
      if (duplicateName) {
        duplicates.push({
          course: newCourse,
          reason: `相同课程名和教师: ${newCourse.name}`
        });
        continue;
      }
      
      // 检查时间冲突
      for (const existingCourse of existingCourses) {
        const hasTimeConflict = newCourse.fixedTimeSlots.some(newSlot =>
          existingCourse.fixedTimeSlots.some(existingSlot =>
            newSlot.dayOfWeek === existingSlot.dayOfWeek &&
            newSlot.timeSlotIds.some(id => existingSlot.timeSlotIds.includes(id)) &&
            hasWeekOverlap(newSlot.weeks, existingSlot.weeks)
          )
        );
        
        if (hasTimeConflict) {
          warnings.push(`课程 "${newCourse.name}" 与现有课程 "${existingCourse.name}" 存在时间冲突`);
        }
      }
    }
    
    return { duplicates, warnings };
  };

  // 检查周次是否重叠
  const hasWeekOverlap = (weeks1?: WeekRange[], weeks2?: WeekRange[]): boolean => {
    // 如果任一方没有指定周次，假设全学期（重叠）
    if (!weeks1 || weeks1.length === 0 || !weeks2 || weeks2.length === 0) {
      return true;
    }
    
    // 检查两个周次范围数组是否有重叠
    return weeks1.some(w1 =>
      weeks2.some(w2 =>
        w1.start <= w2.end && w1.end >= w2.start
      )
    );
  };

  // 从预览直接导入
  const handleImportFromPreview = () => {
    try {
      const courses: Omit<Course, 'id'>[] = parsedCourses.map(preview => {
        // 改进的教师匹配逻辑
        const teacher = findBestMatchingTeacher(preview.teachers, teachers);

        return {
          name: preview.name,
          subject: preview.department,
          teacherId: teacher?.id || getOrCreateTeacher(preview.teachers[0] || '未知教师'),
          credits: preview.credits,
          fixedTimeSlots: preview.timeSlots,
          location: preview.timeSlots[0]?.location,
          weeks: `1-20周`,
          teachers: preview.teachers,
          department: preview.department,
          campus: preview.campus
        };
      });

      // 获取现有课程进行重复检查
      // 注意：这里需要传入现有课程，但组件接口中没有，所以先跳过检查
      // const { duplicates, warnings } = checkDuplicateCourses(courses, existingCourses);

      onImportCourses(courses);
      setImportResult({
        success: true,
        message: '课程导入成功！',
        count: courses.length
      });
      setPreviewMode(false);
      setInputText('');
    } catch (error) {
      setImportResult({
        success: false,
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
  };

  // 直接导入（跳过预览）
  const handleDirectImport = () => {
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

  // 编辑课程信息
  const handleEditCourse = (id: string, field: keyof ParsedCoursePreview, value: any) => {
    setParsedCourses(prev => prev.map(course => {
      if (course.id === id) {
        const updated = { ...course, [field]: value };
        
        // 如果修改了时间相关字段，重新生成时间显示
        if (field === 'timeSlots') {
          updated.timeDisplay = formatTimeDisplay(value);
        }
        
        return updated;
      }
      return course;
    }));
  };

  // 切换编辑模式
  const toggleEdit = (id: string) => {
    setParsedCourses(prev => prev.map(course => 
      course.id === id 
        ? { ...course, isEditing: !course.isEditing }
        : course
    ));
  };

  // 删除课程
  const deleteCourse = (id: string) => {
    setParsedCourses(prev => prev.filter(course => course.id !== id));
  };

  // 返回编辑模式
  const handleBackToEdit = () => {
    setPreviewMode(false);
    setImportResult(null);
  };

  // 自动修复重复时间段
  const handleAutoFixDuplicates = () => {
    setParsedCourses(prev => prev.map(course => {
      if (course.hasError) {
        // 使用解析器的去重功能重新处理时间段
        const fixedTimeSlots = deduplicateTimeSlots(course.timeSlots);
        return {
          ...course,
          timeSlots: fixedTimeSlots,
          timeDisplay: formatTimeDisplay(fixedTimeSlots),
          hasError: false,
          errorMessage: undefined
        };
      }
      return course;
    }));
  };

  // 改进的教师匹配逻辑
  const findBestMatchingTeacher = (courseTeachers: string[], availableTeachers: Teacher[]): Teacher | null => {
    if (!courseTeachers || courseTeachers.length === 0) return null;
    
    for (const teacherName of courseTeachers) {
      const cleanName = teacherName.trim();
      
      // 精确匹配
      let match = availableTeachers.find(t => t.name === cleanName);
      if (match) return match;
      
      // 包含匹配
      match = availableTeachers.find(t => t.name.includes(cleanName) || cleanName.includes(t.name));
      if (match) return match;
      
      // 最后两个字符匹配（处理姓名简化的情况）
      if (cleanName.length >= 2) {
        const shortName = cleanName.slice(-2);
        match = availableTeachers.find(t => t.name.includes(shortName));
        if (match) return match;
      }
    }
    
    return null;
  };

  // 创建或获取教师ID
  const getOrCreateTeacher = (teacherName: string): string => {
    const cleanName = teacherName.trim();
    
    // 先尝试在现有教师中查找
    const existingTeacher = findBestMatchingTeacher([cleanName], teachers);
    if (existingTeacher) {
      return existingTeacher.id;
    }
    
    // 如果找不到，且有 onAddTeacher 回调，创建新教师
    if (onAddTeacher && cleanName !== '未知教师' && cleanName) {
      try {
        const newTeacher: Omit<Teacher, 'id'> = {
          name: cleanName,
          subjects: [],
          unavailableSlots: []
        };
        onAddTeacher(newTeacher);
        
        // 生成一个临时ID，实际上新教师会有自己的ID
        return `new_${cleanName.replace(/\s/g, '_')}_${Date.now()}`;
      } catch (error) {
        console.warn('创建教师失败:', error);
      }
    }
    
    // 最后回退：使用第一个教师的ID或unknown
    return teachers.length > 0 ? teachers[0].id : 'unknown';
  };

  // 详细冲突分析
  const handleAnalyzeConflicts = () => {
    const conflictAnalysis = analyzeDetailedConflicts(parsedCourses);
    
    let message = "📊 详细冲突分析报告:\n\n";
    
    if (conflictAnalysis.timeConflicts.length > 0) {
      message += "⏰ 时间冲突:\n";
      conflictAnalysis.timeConflicts.forEach((conflict, index) => {
        message += `${index + 1}. ${conflict.timeSlot}:\n`;
        conflict.courses.forEach(course => {
          const weeks = course.timeSlots
            .filter(slot => slot.dayOfWeek === conflict.dayOfWeek && 
                    slot.timeSlotIds.includes(conflict.timeSlotId))
            .map(slot => slot.weeks?.map(w => `${w.start}-${w.end}周`).join(',') || '全学期')
            .join(',');
          message += `   - ${course.name} (${course.teachers.join(',')}) [${weeks}]\n`;
        });
        message += "\n";
      });
    }
    
    if (conflictAnalysis.suggestions.length > 0) {
      message += "💡 建议解决方案:\n";
      conflictAnalysis.suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    alert(message);
  };

  // 分析详细冲突信息
  const analyzeDetailedConflicts = (courses: ParsedCoursePreview[]) => {
    const timeConflicts: {
      timeSlot: string;
      dayOfWeek: number;
      timeSlotId: string;
      courses: ParsedCoursePreview[];
    }[] = [];
    
    const suggestions: string[] = [];
    
    // 检查时间冲突
    const timeMap = new Map<string, ParsedCoursePreview[]>();
    
    courses.forEach(course => {
      course.timeSlots.forEach(slot => {
        slot.timeSlotIds.forEach(timeSlotId => {
          const key = `${slot.dayOfWeek}-${timeSlotId}`;
          if (!timeMap.has(key)) {
            timeMap.set(key, []);
          }
          timeMap.get(key)!.push(course);
        });
      });
    });
    
    timeMap.forEach((conflictCourses, timeKey) => {
      if (conflictCourses.length > 1) {
        const [dayOfWeek, timeSlotId] = timeKey.split('-');
        const dayName = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][parseInt(dayOfWeek)];
        
        // 检查是否真的冲突（周次重叠）
        const realConflicts: ParsedCoursePreview[] = [];
        for (let i = 0; i < conflictCourses.length; i++) {
          for (let j = i + 1; j < conflictCourses.length; j++) {
            const courseA = conflictCourses[i];
            const courseB = conflictCourses[j];
            
            const slotA = courseA.timeSlots.find(s => 
              s.dayOfWeek === parseInt(dayOfWeek) && s.timeSlotIds.includes(timeSlotId)
            );
            const slotB = courseB.timeSlots.find(s => 
              s.dayOfWeek === parseInt(dayOfWeek) && s.timeSlotIds.includes(timeSlotId)
            );
            
            if (slotA && slotB && hasWeekOverlap(slotA.weeks, slotB.weeks)) {
              if (!realConflicts.includes(courseA)) realConflicts.push(courseA);
              if (!realConflicts.includes(courseB)) realConflicts.push(courseB);
            }
          }
        }
        
        if (realConflicts.length > 1) {
          timeConflicts.push({
            timeSlot: `${dayName}第${timeSlotId}节`,
            dayOfWeek: parseInt(dayOfWeek),
            timeSlotId,
            courses: realConflicts
          });
          
          // 生成解决建议
          if (realConflicts.length === 2) {
            suggestions.push(`建议调整 "${realConflicts[1].name}" 的上课时间，避开 ${dayName}第${timeSlotId}节`);
          } else {
            suggestions.push(`${dayName}第${timeSlotId}节有${realConflicts.length}门课程冲突，建议重新安排时间`);
          }
        }
      }
    });
    
    return {
      timeConflicts,
      suggestions
    };
  };

  // 调试时间段信息
  const handleDebugTimeSlots = () => {
    let debugInfo = "🔍 时间段调试信息:\n\n";
    
    parsedCourses.forEach((course, index) => {
      debugInfo += `📚 课程 ${index + 1}: ${course.name}\n`;
      debugInfo += `👨‍🏫 教师: ${course.teachers.join(', ')}\n`;
      debugInfo += `📍 时间安排:\n`;
      
      course.timeSlots.forEach((slot, slotIndex) => {
        const dayName = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][slot.dayOfWeek];
        debugInfo += `  ${slotIndex + 1}. ${dayName} 第${slot.timeSlotIds.join('-')}节\n`;
        
        if (slot.weeks && slot.weeks.length > 0) {
          const weeksStr = slot.weeks.map(w => `${w.start}-${w.end}周`).join(', ');
          debugInfo += `     周次: ${weeksStr}\n`;
        } else {
          debugInfo += `     周次: 未指定 (假设全学期)\n`;
        }
        
        if (slot.location) {
          debugInfo += `     地点: ${slot.location}\n`;
        }
      });
      
      debugInfo += "\n";
    });
    
    // 检查具体的冲突
    debugInfo += "⚠️ 冲突检查:\n";
    for (let i = 0; i < parsedCourses.length; i++) {
      for (let j = i + 1; j < parsedCourses.length; j++) {
        const courseA = parsedCourses[i];
        const courseB = parsedCourses[j];
        
        debugInfo += `\n🔍 检查: "${courseA.name}" vs "${courseB.name}"\n`;
        
        let hasAnyConflict = false;
        
        for (const slotA of courseA.timeSlots) {
          for (const slotB of courseB.timeSlots) {
            if (slotA.dayOfWeek === slotB.dayOfWeek) {
              const commonTimeSlots = slotA.timeSlotIds.filter(id => slotB.timeSlotIds.includes(id));
              if (commonTimeSlots.length > 0) {
                const dayName = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][slotA.dayOfWeek];
                debugInfo += `  ⏰ 相同时间: ${dayName} 第${commonTimeSlots.join(',')}节\n`;
                
                const weekOverlap = hasWeekOverlap(slotA.weeks, slotB.weeks);
                debugInfo += `  📅 周次重叠: ${weekOverlap ? '是' : '否'}\n`;
                
                if (slotA.weeks) {
                  debugInfo += `    课程A周次: ${slotA.weeks.map(w => `${w.start}-${w.end}`).join(', ')}\n`;
                } else {
                  debugInfo += `    课程A周次: 未指定\n`;
                }
                
                if (slotB.weeks) {
                  debugInfo += `    课程B周次: ${slotB.weeks.map(w => `${w.start}-${w.end}`).join(', ')}\n`;
                } else {
                  debugInfo += `    课程B周次: 未指定\n`;
                }
                
                if (weekOverlap) {
                  debugInfo += `  ❌ 结论: 存在冲突\n`;
                  hasAnyConflict = true;
                } else {
                  debugInfo += `  ✅ 结论: 无冲突 (周次不重叠)\n`;
                }
              }
            }
          }
        }
        
        if (!hasAnyConflict) {
          debugInfo += `  ✅ 无冲突\n`;
        }
      }
    }
    
    alert(debugInfo);
  };

  // 解析课程文本
  const parseCourseText = (text: string): Omit<Course, 'id'>[] => {
    const courses: Omit<Course, 'id'>[] = [];

    // 首先按双换行或多个连续换行分割，处理可能的多个课程记录
    const courseBlocks = text.trim().split(/\n\s*\n/).filter(block => block.trim());
    
    // 如果没有明显的分块，尝试按行处理，但要考虑多行数据
    const blocksToProcess = courseBlocks.length > 1 ? courseBlocks : [text.trim()];
    
    for (const block of blocksToProcess) {
      try {
        // 对于每个块，可能包含一个课程的完整信息（包括多行时间数据）
        const courseInfo = parseCourseInfo(block);
        
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
        console.warn('解析课程块失败:', block, error);
        
        // 尝试按行处理作为后备方案
        const lines = block.split('\n').filter(line => line.trim());
        for (const line of lines) {
          // 只处理包含制表符的行（主要课程信息）
          if (!line.includes('\t')) continue;
          
        try {
          const parts = line.split('\t').map(part => part.trim());
          if (parts.length >= 6) {
              // 尝试两种格式
              let name: string;
              let teacherName: string;
              let department: string;
              let campus: string;
              let credits: number;
              let scheduleText: string[];
              
              // 检测格式
              const secondFieldIsNumber = /^\d+$/.test(parts[1]);
              
              if (secondFieldIsNumber && parts.length >= 6) {
                // 格式1: 课程名	学分	考试方式	学院	教师	校区	时间安排...
                [name, , , department, teacherName, campus, ...scheduleText] = parts;
                credits = parseInt(parts[1]) || 2;
              } else {
                // 格式2: 课程名	教师	学院	校区	学时	学分	时间安排...
                [name, teacherName, department, campus, , , ...scheduleText] = parts;
                credits = parseInt(parts[5]) || 2;
              }
              
              // 收集该课程的所有时间信息（包括后续行）
              const allTimeLines = [scheduleText.join('\t')];
              const currentLineIndex = lines.indexOf(line);
              for (let i = currentLineIndex + 1; i < lines.length; i++) {
                const nextLine = lines[i];
                if (nextLine.includes('\t')) break; // 遇到新的课程记录
                if (/\d+[-–]?\d*周|星期[一二三四五六日]|第\d+/.test(nextLine)) {
                  allTimeLines.push(nextLine);
                }
              }
              
              const timeSlots = parseCourseTime(allTimeLines.join('\n'));
            const teacher = teachers.find(t => t.name.includes(teacherName) || teacherName.includes(t.name));
            
            courses.push({
              name,
              subject: department || '未知学科',
              teacherId: teacher?.id || teachers[0]?.id || 'unknown',
                credits,
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
    }

    return courses;
  };

  const copyExample = () => {
    setInputText(exampleText);
  };

  // 渲染预览表格
  const renderPreviewTable = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            解析结果预览 ({parsedCourses.length} 门课程)
          </h4>
          {parsedCourses.some(c => c.hasError) && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">检测到数据问题：</p>
                  <div className="mt-1 space-y-1">
                    {parsedCourses.filter(c => c.hasError).map(course => (
                      <div key={course.id} className="bg-yellow-100 rounded px-2 py-1">
                        <span className="font-medium">{course.name}:</span> {course.errorMessage}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={handleAutoFixDuplicates}
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      自动修复重复问题
                    </button>
                    <button
                      onClick={handleAnalyzeConflicts}
                      className="text-purple-600 hover:text-purple-800 underline text-sm"
                    >
                      详细冲突分析
                    </button>
                    <button
                      onClick={handleDebugTimeSlots}
                      className="text-gray-600 hover:text-gray-800 underline text-sm"
                    >
                      调试时间段
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleBackToEdit}
          className="btn-secondary flex items-center gap-2"
        >
          <Edit3 className="h-4 w-4" />
          返回编辑
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-2 text-left">课程名</th>
              <th className="border border-gray-300 px-3 py-2 text-left">教师</th>
              <th className="border border-gray-300 px-3 py-2 text-left">学院</th>
              <th className="border border-gray-300 px-3 py-2 text-left">校区</th>
              <th className="border border-gray-300 px-3 py-2 text-left">学分</th>
              <th className="border border-gray-300 px-3 py-2 text-left">时间安排</th>
              <th className="border border-gray-300 px-3 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {parsedCourses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">
                  {course.isEditing ? (
                    <input
                      type="text"
                      value={course.name}
                      onChange={(e) => handleEditCourse(course.id, 'name', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="font-medium">{course.name}</span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {course.isEditing ? (
                    <input
                      type="text"
                      value={course.teachers.join(', ')}
                      onChange={(e) => handleEditCourse(course.id, 'teachers', e.target.value.split(',').map(t => t.trim()))}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      placeholder="多个教师用逗号分隔"
                    />
                  ) : (
                    <span>{course.teachers.join(', ')}</span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {course.isEditing ? (
                    <input
                      type="text"
                      value={course.department}
                      onChange={(e) => handleEditCourse(course.id, 'department', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span>{course.department}</span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {course.isEditing ? (
                    <input
                      type="text"
                      value={course.campus}
                      onChange={(e) => handleEditCourse(course.id, 'campus', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span>{course.campus}</span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {course.isEditing ? (
                    <input
                      type="number"
                      value={course.credits}
                      onChange={(e) => handleEditCourse(course.id, 'credits', parseInt(e.target.value) || 0)}
                      className="w-20 p-1 border border-gray-300 rounded text-sm"
                      min="0"
                      max="10"
                    />
                  ) : (
                    <span>{course.credits}</span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 max-w-xs">
                  <div className="text-sm text-gray-700 overflow-hidden">
                    {course.timeDisplay}
                    {course.hasError && course.errorMessage && (
                      <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{course.errorMessage}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toggleEdit(course.id)}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        course.isEditing ? 'text-green-600' : 'text-blue-600'
                      }`}
                      title={course.isEditing ? '保存' : '编辑'}
                    >
                      {course.isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="p-1 rounded hover:bg-gray-100 text-red-600"
                      title="删除"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleImportFromPreview}
          disabled={parsedCourses.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4" />
          确认导入 ({parsedCourses.length} 门课程)
        </button>
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          取消
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

        {previewMode ? renderPreviewTable() : (
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
                placeholder="请粘贴课程数据，每行一门课程，支持多种格式和多行时间安排"
              className="w-full h-40 p-3 border border-gray-300 rounded-lg text-sm font-mono"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
                支持的数据格式
            </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <div>
                  <p className="font-semibold">格式1（标准格式）：</p>
                  <p>课程名 &nbsp; 教师 &nbsp; 学院 &nbsp; 校区 &nbsp; 学时 &nbsp; 学分 &nbsp; 时间安排</p>
                </div>
                <div>
                  <p className="font-semibold">格式2（新格式）：</p>
                  <p>课程名 &nbsp; 学分 &nbsp; 考试方式 &nbsp; 学院 &nbsp; 教师 &nbsp; 校区 &nbsp; 时间安排</p>
                </div>
                <div>
                  <p className="font-semibold">时间格式示例：</p>
                  <p>• 1-5周，星期一第3-4节 (立人楼B417)</p>
                  <p>• 7-10周，星期一第3-4节 (立人楼B417)</p>
                  <p>• <strong>支持多行时间数据</strong>，自动识别续行</p>
              <p>• 自动识别星期和节次，支持连续节次</p>
                </div>
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
                onClick={handlePreview}
              disabled={!inputText.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-4 w-4" />
                解析预览
              </button>
              <button
                onClick={handleDirectImport}
                disabled={!inputText.trim()}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
                直接导入
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              取消
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
