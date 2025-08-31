import { Course, FixedTimeSlot } from '../types';

// 数据迁移工具：将旧的课程数据结构转换为新的结构
export function migrateCourseData(courses: any[]): Course[] {
  return courses.map(course => {
    // 如果已经是新格式，直接返回
    if (course.fixedTimeSlots && Array.isArray(course.fixedTimeSlots)) {
      return course as Course;
    }

    // 如果是旧格式，进行转换
    const migratedCourse: Course = {
      id: course.id,
      name: course.name,
      subject: course.subject || '未知学科',
      teacherId: course.teacherId,
      credits: course.credits || 2, // 默认2学分
      location: course.location || course.classroomId || undefined,
      weeks: course.weeks || '1-16周',
      fixedTimeSlots: []
    };

    // 如果有旧的 duration 和 frequency 信息，尝试生成默认的时间段
    if (course.duration && course.frequency) {
      // 创建默认的时间段（这只是一个示例，实际使用时需要用户重新设置）
      const defaultTimeSlots: FixedTimeSlot[] = [];
      
      // 简单的默认分配：周一到周五，从第1节开始
      for (let i = 0; i < course.frequency; i++) {
        const dayOfWeek = (i % 5) + 1; // 1-5 (周一到周五)
        const startSlot = 1 + (Math.floor(i / 5) * course.duration);
        const timeSlotIds: string[] = [];
        
        for (let j = 0; j < course.duration; j++) {
          timeSlotIds.push((startSlot + j).toString());
        }
        
        defaultTimeSlots.push({
          dayOfWeek,
          timeSlotIds
        });
      }
      
      migratedCourse.fixedTimeSlots = defaultTimeSlots;
    }

    return migratedCourse;
  });
}

// 检查并清理 localStorage 中的旧数据
export function cleanupOldData() {
  const keys = ['courses', 'classrooms', 'classes', 'constraints'];
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        
        // 如果是课程数据，进行迁移
        if (key === 'courses' && Array.isArray(parsed)) {
          const migratedCourses = migrateCourseData(parsed);
          localStorage.setItem(key, JSON.stringify(migratedCourses));
          console.log('已迁移课程数据到新格式');
        }
        
        // 删除不再需要的数据
        if (['classrooms', 'classes', 'constraints'].includes(key)) {
          localStorage.removeItem(key);
          console.log(`已清理旧数据: ${key}`);
        }
      } catch (error) {
        console.warn(`清理数据 ${key} 时出错:`, error);
        localStorage.removeItem(key);
      }
    }
  });
}
