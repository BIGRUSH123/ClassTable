// 时间段定义
export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
}

// 教师信息
export interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subjects: string[];
  unavailableSlots: string[]; // 不可用的时间段ID
}

// 教室信息
export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  type: 'normal' | 'lab' | 'multimedia' | 'gym';
  equipment: string[];
}

// 周次范围
export interface WeekRange {
  start: number;
  end: number;
}

// 带周次的时间段
export interface FixedTimeSlot {
  dayOfWeek: number; // 1-7 (周一-周日)
  timeSlotIds: string[]; // 时间段ID数组
  weeks?: WeekRange[]; // 周次范围数组，如 [{start: 1, end: 6}, {start: 7, end: 8}]
  location?: string; // 特定时间段的地点（可能不同周次地点不同）
}

// 课程信息
export interface Course {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  credits: number; // 学分
  fixedTimeSlots: FixedTimeSlot[]; // 固定的上课时间
  location?: string; // 默认上课地点
  weeks?: string; // 原始上课周次字符串，如 "1-16周"
  teachers?: string[]; // 支持多个教师，用逗号分隔的教师名
  department?: string; // 学院
  campus?: string; // 校区
}

// 班级信息
export interface Class {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
  courses: string[]; // 课程ID列表
}

// 课表条目
export interface ScheduleItem {
  id: string;
  courseId: string;
  teacherId: string;
  timeSlotId: string;
  dayOfWeek: number; // 1-7 (周一-周日)
  weeks?: WeekRange[]; // 该课表项的有效周次
  location?: string; // 上课地点
}

// 排课冲突
export interface Conflict {
  type: 'time' | 'teacher';
  message: string;
  items: ScheduleItem[];
}

// 排课约束
export interface SchedulingConstraints {
  maxDailyHours: number;
  maxConsecutiveHours: number;
  lunchBreakSlots: string[];
  forbiddenSlots: {
    dayOfWeek: number;
    timeSlotId: string;
  }[];
}

// 应用状态
export interface AppState {
  timeSlots: TimeSlot[];
  teachers: Teacher[];
  courses: Course[];
  schedule: ScheduleItem[];
}
