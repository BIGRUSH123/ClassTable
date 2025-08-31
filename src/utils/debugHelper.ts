import { Course, FixedTimeSlot } from '../types';

// 调试工具：检查课程数据的完整性
export function validateCourseData(courses: Course[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  courses.forEach((course, index) => {
    // 检查必需字段
    if (!course.id) {
      errors.push(`课程 ${index + 1}: 缺少 ID`);
    }
    if (!course.name) {
      errors.push(`课程 ${index + 1}: 缺少课程名称`);
    }
    if (!course.teacherId) {
      errors.push(`课程 ${index + 1}: 缺少教师ID`);
    }

    // 检查 fixedTimeSlots
    if (!course.fixedTimeSlots) {
      errors.push(`课程 ${course.name}: 缺少 fixedTimeSlots 字段`);
    } else if (!Array.isArray(course.fixedTimeSlots)) {
      errors.push(`课程 ${course.name}: fixedTimeSlots 不是数组`);
    } else {
      if (course.fixedTimeSlots.length === 0) {
        warnings.push(`课程 ${course.name}: 没有设置上课时间`);
      }

      course.fixedTimeSlots.forEach((slot, slotIndex) => {
        if (!slot.dayOfWeek || slot.dayOfWeek < 1 || slot.dayOfWeek > 7) {
          errors.push(`课程 ${course.name}, 时间段 ${slotIndex + 1}: dayOfWeek 无效 (${slot.dayOfWeek})`);
        }
        if (!slot.timeSlotIds || !Array.isArray(slot.timeSlotIds)) {
          errors.push(`课程 ${course.name}, 时间段 ${slotIndex + 1}: timeSlotIds 不是数组`);
        } else if (slot.timeSlotIds.length === 0) {
          errors.push(`课程 ${course.name}, 时间段 ${slotIndex + 1}: timeSlotIds 为空`);
        }
      });
    }

    // 检查其他字段
    if (typeof course.credits !== 'number' || course.credits <= 0) {
      warnings.push(`课程 ${course.name}: 学分数无效 (${course.credits})`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// 打印课程数据到控制台
export function logCourseData(courses: Course[]) {
  console.group('课程数据详情');
  courses.forEach((course, index) => {
    console.group(`课程 ${index + 1}: ${course.name}`);
    console.log('ID:', course.id);
    console.log('教师ID:', course.teacherId);
    console.log('学分:', course.credits);
    console.log('地点:', course.location);
    console.log('周次:', course.weeks);
    console.log('固定时间段:', course.fixedTimeSlots);
    console.groupEnd();
  });
  console.groupEnd();
}

// 检查 localStorage 数据
export function checkLocalStorageData() {
  console.group('LocalStorage 数据检查');
  
  const keys = ['teachers', 'courses', 'schedule', 'timeSlots'];
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`${key}:`, parsed);
        if (key === 'courses' && Array.isArray(parsed)) {
          const validation = validateCourseData(parsed);
          if (!validation.isValid) {
            console.error(`${key} 数据验证失败:`, validation.errors);
          }
          if (validation.warnings.length > 0) {
            console.warn(`${key} 数据警告:`, validation.warnings);
          }
        }
      } catch (error) {
        console.error(`${key} 数据解析失败:`, error);
      }
    } else {
      console.log(`${key}: 无数据`);
    }
  });
  
  console.groupEnd();
}
