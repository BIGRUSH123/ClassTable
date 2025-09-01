import { 
  Course, 
  Teacher, 
  TimeSlot, 
  ScheduleItem, 
  Conflict,
  WeekRange 
} from '../types';
import { isWeekInRanges } from './courseTimeParser';

export interface SchedulingResult {
  schedule: ScheduleItem[];
  conflicts: Conflict[];
  success: boolean;
  message: string;
}

export interface SchedulingOptions {
  selectedWeek?: number; // 指定周次，如果不指定则生成全学期
  weekRange?: { start: number; end: number }; // 周次范围
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
  public generateSchedule(options: SchedulingOptions = {}): SchedulingResult {
    this.schedule = [];
    const conflicts: Conflict[] = [];

    try {
      // 根据每个课程的固定时间段生成课表
      for (const course of this.courses) {
        this.scheduleForCourse(course, options);
      }

      // 检查冲突
      const detectedConflicts = this.detectConflicts(options.selectedWeek);
      conflicts.push(...detectedConflicts);

      const weekInfo = options.selectedWeek 
        ? `第${options.selectedWeek}周` 
        : options.weekRange 
          ? `第${options.weekRange.start}-${options.weekRange.end}周`
          : '全学期';

      return {
        schedule: this.schedule,
        conflicts,
        success: conflicts.length === 0,
        message: conflicts.length === 0 
          ? `${weekInfo}课表生成成功！` 
          : `${weekInfo}课表生成完成，但存在 ${conflicts.length} 个时间冲突`
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
  private scheduleForCourse(course: Course, options: SchedulingOptions = {}): void {
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

      // 检查该时间段是否在指定的周次范围内
      if (options.selectedWeek) {
        if (!isWeekInRanges(options.selectedWeek, fixedSlot.weeks)) {
          continue; // 跳过不在指定周次的时间段
        }
      } else if (options.weekRange) {
        // 检查时间段的周次是否与指定范围有交集
        if (fixedSlot.weeks && !this.hasWeekRangeOverlap(fixedSlot.weeks, options.weekRange)) {
          continue;
        }
      }

      for (const timeSlotId of fixedSlot.timeSlotIds) {
        const scheduleItem: ScheduleItem = {
          id: `${course.id}-${fixedSlot.dayOfWeek}-${timeSlotId}-${this.getWeekSuffix(fixedSlot.weeks, options)}`,
          courseId: course.id,
          teacherId: course.teacherId,
          timeSlotId: timeSlotId,
          dayOfWeek: fixedSlot.dayOfWeek,
          weeks: fixedSlot.weeks,
          location: fixedSlot.location || course.location
        };
        
        this.schedule.push(scheduleItem);
      }
    }
  }

  // 生成周次后缀用于ID
  private getWeekSuffix(weeks?: WeekRange[], options: SchedulingOptions = {}): string {
    if (options.selectedWeek) {
      return `w${options.selectedWeek}`;
    }
    if (weeks && weeks.length > 0) {
      return `w${weeks[0].start}-${weeks[0].end}`;
    }
    return 'all';
  }

  // 检查周次范围是否有重叠
  private hasWeekRangeOverlap(timeSlotWeeks: WeekRange[], targetRange: { start: number; end: number }): boolean {
    return timeSlotWeeks.some(range => 
      range.start <= targetRange.end && range.end >= targetRange.start
    );
  }

  // 检测冲突
  private detectConflicts(selectedWeek?: number): Conflict[] {
    const conflicts: Conflict[] = [];

    // 检查时间冲突 - 同一时间段有多个课程
    const timeConflicts = this.detectTimeConflicts(selectedWeek);
    conflicts.push(...timeConflicts);

    return conflicts;
  }

  // 检测时间冲突
  private detectTimeConflicts(selectedWeek?: number): Conflict[] {
    const conflicts: Conflict[] = [];
    const timeMap = new Map<string, ScheduleItem[]>();

    // 按时间段分组，考虑周次
    this.schedule.forEach(item => {
      // 如果指定了周次，只检查该周次的冲突
      if (selectedWeek && item.weeks && !isWeekInRanges(selectedWeek, item.weeks)) {
        return;
      }

      const key = `${item.dayOfWeek}-${item.timeSlotId}`;
      if (!timeMap.has(key)) {
        timeMap.set(key, []);
      }
      timeMap.get(key)!.push(item);
    });

    // 检查每个时间段是否有冲突
    timeMap.forEach((items, timeKey) => {
      if (items.length > 1) {
        // 进一步检查周次是否真的重叠
        const conflictItems = this.findWeekConflictingItems(items, selectedWeek);
        
        if (conflictItems.length > 1) {
          const [dayOfWeek, timeSlotId] = timeKey.split('-');
          const timeSlot = this.timeSlots.find(ts => ts.id === timeSlotId);
          const dayName = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][parseInt(dayOfWeek)];
          
          const weekInfo = selectedWeek ? `第${selectedWeek}周 ` : '';
          conflicts.push({
            type: 'time',
            message: `${weekInfo}${dayName} ${timeSlot?.name || timeSlotId} 有多个课程安排`,
            items: conflictItems
          });
        }
      }
    });

    return conflicts;
  }

  // 查找在指定周次有冲突的课表项
  private findWeekConflictingItems(items: ScheduleItem[], selectedWeek?: number): ScheduleItem[] {
    console.log('findWeekConflictingItems 被调用:', {
      itemsCount: items.length,
      selectedWeek,
      items: items.map(item => ({
        courseId: item.courseId,
        dayOfWeek: item.dayOfWeek,
        timeSlotId: item.timeSlotId,
        weeks: item.weeks
      }))
    });

    if (selectedWeek) {
      // 如果指定了周次，返回所有在该周次有效的项目
      const filtered = items.filter(item => !item.weeks || isWeekInRanges(selectedWeek, item.weeks));
      console.log('指定周次过滤结果:', filtered.length);
      return filtered;
    }

    // 如果没有指定周次，检查周次重叠
    const conflicting: ScheduleItem[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item1 = items[i];
      let hasConflict = false;
      
      for (let j = i + 1; j < items.length; j++) {
        const item2 = items[j];
        
        console.log(`检查冲突: 课程${item1.courseId} vs 课程${item2.courseId}`);
        
        // 检查两个项目的周次是否有重叠
        if (this.hasWeekOverlap(item1.weeks, item2.weeks)) {
          console.log('发现冲突！');
          hasConflict = true;
          if (!conflicting.includes(item2)) {
            conflicting.push(item2);
          }
        } else {
          console.log('无冲突');
        }
      }
      
      if (hasConflict && !conflicting.includes(item1)) {
        conflicting.push(item1);
      }
    }
    
    console.log('findWeekConflictingItems 结果:', {
      conflictingCount: conflicting.length,
      originalCount: items.length,
      returnItems: conflicting.length > 0 ? conflicting.length : items.length
    });
    
    // 🚨 这里是关键问题！
    // 原来的逻辑：如果没有真正的冲突，返回所有项目 (items)
    // 修正：如果没有真正的冲突，应该返回空数组
    return conflicting;
  }

  // 检查两个周次范围是否有重叠
  private hasWeekOverlap(weeks1?: WeekRange[], weeks2?: WeekRange[]): boolean {
    // 调试信息
    console.log('检查周次重叠:', {
      weeks1,
      weeks2
    });
    
    // 如果其中任何一个没有周次限制，则认为有重叠
    if (!weeks1 || !weeks2 || weeks1.length === 0 || weeks2.length === 0) {
      console.log('其中一个没有周次限制，假设重叠');
      return true;
    }

    // 检查是否有任何周次范围重叠
    const hasOverlap = weeks1.some(range1 => 
      weeks2.some(range2 => {
        const overlap = range1.start <= range2.end && range1.end >= range2.start;
        console.log(`检查范围: ${range1.start}-${range1.end} vs ${range2.start}-${range2.end}, 重叠: ${overlap}`);
        return overlap;
      })
    );
    
    console.log('最终结果:', hasOverlap);
    return hasOverlap;
  }

}
