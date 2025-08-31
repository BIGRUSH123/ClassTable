import { ScheduleItem } from '../types';

// 根据提供的课程信息创建预定义的课表
export const predefinedSchedule: ScheduleItem[] = [
  // 有限自动机理论 - 周一第5-6节，周三第5-6节
  {
    id: 'schedule-1-1',
    courseId: '1',
    teacherId: '1',
    timeSlotId: '5',
    dayOfWeek: 1, // 周一
    location: '立人楼B411'
  },
  {
    id: 'schedule-1-2',
    courseId: '1',
    teacherId: '1',
    timeSlotId: '6',
    dayOfWeek: 1, // 周一
    location: '立人楼B411'
  },
  {
    id: 'schedule-1-3',
    courseId: '1',
    teacherId: '1',
    timeSlotId: '5',
    dayOfWeek: 3, // 周三
    location: '立人楼B411'
  },
  {
    id: 'schedule-1-4',
    courseId: '1',
    teacherId: '1',
    timeSlotId: '6',
    dayOfWeek: 3, // 周三
    location: '立人楼B411'
  },

  // 高级软件开发技术 - 周一第9-11节
  {
    id: 'schedule-2-1',
    courseId: '2',
    teacherId: '3',
    timeSlotId: '9',
    dayOfWeek: 1, // 周一
    location: '立人楼B402'
  },
  {
    id: 'schedule-2-2',
    courseId: '2',
    teacherId: '3',
    timeSlotId: '10',
    dayOfWeek: 1, // 周一
    location: '立人楼B402'
  },
  {
    id: 'schedule-2-3',
    courseId: '2',
    teacherId: '3',
    timeSlotId: '11',
    dayOfWeek: 1, // 周一
    location: '立人楼B402'
  },

  // 机器学习2班 - 周二第3-4节，周四第7-8节
  {
    id: 'schedule-3-1',
    courseId: '3',
    teacherId: '4',
    timeSlotId: '3',
    dayOfWeek: 2, // 周二
    location: '立人楼B409'
  },
  {
    id: 'schedule-3-2',
    courseId: '3',
    teacherId: '4',
    timeSlotId: '4',
    dayOfWeek: 2, // 周二
    location: '立人楼B409'
  },
  {
    id: 'schedule-3-3',
    courseId: '3',
    teacherId: '4',
    timeSlotId: '7',
    dayOfWeek: 4, // 周四
    location: '立人楼B409'
  },
  {
    id: 'schedule-3-4',
    courseId: '3',
    teacherId: '4',
    timeSlotId: '8',
    dayOfWeek: 4, // 周四
    location: '立人楼B409'
  },

  // 分布式系统2班 - 周二第9-10节，周四第1-2节
  {
    id: 'schedule-4-1',
    courseId: '4',
    teacherId: '6',
    timeSlotId: '9',
    dayOfWeek: 2, // 周二
    location: '立人楼B405'
  },
  {
    id: 'schedule-4-2',
    courseId: '4',
    teacherId: '6',
    timeSlotId: '10',
    dayOfWeek: 2, // 周二
    location: '立人楼B405'
  },
  {
    id: 'schedule-4-3',
    courseId: '4',
    teacherId: '6',
    timeSlotId: '1',
    dayOfWeek: 4, // 周四
    location: '立人楼B405'
  },
  {
    id: 'schedule-4-4',
    courseId: '4',
    teacherId: '6',
    timeSlotId: '2',
    dayOfWeek: 4, // 周四
    location: '立人楼B405'
  },

  // 高级算法设计与分析2班 - 周一第7-8节，周三第7-8节
  {
    id: 'schedule-5-1',
    courseId: '5',
    teacherId: '8',
    timeSlotId: '7',
    dayOfWeek: 1, // 周一
    location: '立人楼B406'
  },
  {
    id: 'schedule-5-2',
    courseId: '5',
    teacherId: '8',
    timeSlotId: '8',
    dayOfWeek: 1, // 周一
    location: '立人楼B406'
  },
  {
    id: 'schedule-5-3',
    courseId: '5',
    teacherId: '8',
    timeSlotId: '7',
    dayOfWeek: 3, // 周三
    location: '立人楼B406'
  },
  {
    id: 'schedule-5-4',
    courseId: '5',
    teacherId: '8',
    timeSlotId: '8',
    dayOfWeek: 3, // 周三
    location: '立人楼B406'
  }
];
