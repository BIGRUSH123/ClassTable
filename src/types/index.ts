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

// 固定时间段
export interface FixedTimeSlot {
  dayOfWeek: number; // 1-7 (周一-周日)
  timeSlotIds: string[]; // 时间段ID数组
}

// 课程信息
export interface Course {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  credits: number; // 学分
  fixedTimeSlots: FixedTimeSlot[]; // 固定的上课时间
  location?: string; // 上课地点
  weeks?: string; // 上课周次，如 "1-16周"
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
