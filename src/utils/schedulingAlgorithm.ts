import { 
  Course, 
  Teacher, 
  TimeSlot, 
  ScheduleItem, 
  Conflict 
} from '../types';

export interface SchedulingResult {
  schedule: ScheduleItem[];
  conflicts: Conflict[];
  success: boolean;
  message: string;
}

export class SchedulingAlgorithm {
  private courses: Course[];
  private teachers: Teacher[];
  private timeSlots: TimeSlot[];
  private schedule: ScheduleItem[];

  constructor(
    courses: Course[],
    teachers: Teacher[],
    timeSlots: TimeSlot[]
  ) {
    this.courses = courses;
    this.teachers = teachers;
    this.timeSlots = timeSlots.sort((a, b) => a.order - b.order);
    this.schedule = [];
  }

  // 主排课方法
  public generateSchedule(): SchedulingResult {
    this.schedule = [];
    const conflicts: Conflict[] = [];

    try {
      // 根据每个课程的固定时间段生成课表
      for (const course of this.courses) {
        this.scheduleForCourse(course);
      }

      // 检查冲突
      const detectedConflicts = this.detectConflicts();
      conflicts.push(...detectedConflicts);

      return {
        schedule: this.schedule,
        conflicts,
        success: conflicts.length === 0,
        message: conflicts.length === 0 
          ? '课表生成成功！' 
          : `课表生成完成，但存在 ${conflicts.length} 个时间冲突`
      };
    } catch (error) {
      return {
        schedule: [],
        conflicts,
        success: false,
        message: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // 为单个课程排课
  private scheduleForCourse(course: Course): void {
    // 检查课程是否有固定时间段
    if (!course.fixedTimeSlots || !Array.isArray(course.fixedTimeSlots)) {
      console.warn(`课程 ${course.name} 没有有效的固定时间段`);
      return;
    }

    // 根据课程的固定时间段生成课表条目
    for (const fixedSlot of course.fixedTimeSlots) {
      if (!fixedSlot.timeSlotIds || !Array.isArray(fixedSlot.timeSlotIds)) {
        console.warn(`课程 ${course.name} 的时间段配置无效`);
        continue;
      }

      for (const timeSlotId of fixedSlot.timeSlotIds) {
        const scheduleItem: ScheduleItem = {
          id: `${course.id}-${fixedSlot.dayOfWeek}-${timeSlotId}`,
          courseId: course.id,
          teacherId: course.teacherId,
          timeSlotId: timeSlotId,
          dayOfWeek: fixedSlot.dayOfWeek,
          location: course.location
        };
        
        this.schedule.push(scheduleItem);
      }
    }
  }

  // 检测冲突
  private detectConflicts(): Conflict[] {
    const conflicts: Conflict[] = [];

    // 检查时间冲突 - 同一时间段有多个课程
    const timeConflicts = this.detectTimeConflicts();
    conflicts.push(...timeConflicts);

    return conflicts;
  }

  // 检测时间冲突
  private detectTimeConflicts(): Conflict[] {
    const conflicts: Conflict[] = [];
    const timeMap = new Map<string, ScheduleItem[]>();

    // 按时间段分组
    this.schedule.forEach(item => {
      const key = `${item.dayOfWeek}-${item.timeSlotId}`;
      if (!timeMap.has(key)) {
        timeMap.set(key, []);
      }
      timeMap.get(key)!.push(item);
    });

    // 检查每个时间段是否有冲突
    timeMap.forEach((items, timeKey) => {
      if (items.length > 1) {
        const [dayOfWeek, timeSlotId] = timeKey.split('-');
        const timeSlot = this.timeSlots.find(ts => ts.id === timeSlotId);
        const dayName = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][parseInt(dayOfWeek)];
        
        conflicts.push({
          type: 'time',
          message: `${dayName} ${timeSlot?.name || timeSlotId} 有多个课程安排`,
          items: items
        });
      }
    });

    return conflicts;
  }

}
