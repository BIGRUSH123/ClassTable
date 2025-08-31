import { TimeSlot, Teacher, Course, FixedTimeSlot } from '../types';

// 默认时间段
export const defaultTimeSlots: TimeSlot[] = [
  { id: '1', name: '第1节', startTime: '08:30', endTime: '09:15', order: 1 },
  { id: '2', name: '第2节', startTime: '09:20', endTime: '10:05', order: 2 },
  { id: '3', name: '第3节', startTime: '10:20', endTime: '11:05', order: 3 },
  { id: '4', name: '第4节', startTime: '11:10', endTime: '11:55', order: 4 },
  { id: '5', name: '第5节', startTime: '14:30', endTime: '15:15', order: 5 },
  { id: '6', name: '第6节', startTime: '15:20', endTime: '16:05', order: 6 },
  { id: '7', name: '第7节', startTime: '16:20', endTime: '17:05', order: 7 },
  { id: '8', name: '第8节', startTime: '17:10', endTime: '17:55', order: 8 },
  { id: '9', name: '第9节', startTime: '19:30', endTime: '20:15', order: 9 },
  { id: '10', name: '第10节', startTime: '20:20', endTime: '21:05', order: 10 },
  { id: '11', name: '第11节', startTime: '21:10', endTime: '21:55', order: 11 },
  { id: '12', name: '第12节', startTime: '22:00', endTime: '22:45', order: 12 },
];

// 默认教师
export const defaultTeachers: Teacher[] = [
  {
    id: '1',
    name: '陈文宇',
    subjects: ['有限自动机理论'],
    unavailableSlots: []
  },
  {
    id: '2',
    name: '余盛季',
    subjects: ['有限自动机理论'],
    unavailableSlots: []
  },
  {
    id: '3',
    name: '孙明',
    subjects: ['高级软件开发技术'],
    unavailableSlots: []
  },
  {
    id: '4',
    name: '钟秀琴',
    subjects: ['机器学习'],
    unavailableSlots: []
  },
  {
    id: '5',
    name: '曾伟',
    subjects: ['机器学习'],
    unavailableSlots: []
  },
  {
    id: '6',
    name: '薛瑞尼',
    subjects: ['分布式系统'],
    unavailableSlots: []
  },
  {
    id: '7',
    name: '李玉军',
    subjects: ['分布式系统'],
    unavailableSlots: []
  },
  {
    id: '8',
    name: '周毅',
    subjects: ['高级算法设计与分析'],
    unavailableSlots: []
  }
];

// 移除教室管理，不再需要

// 默认课程
export const defaultCourses: Course[] = [
  {
    id: '1',
    name: '有限自动机理论',
    subject: '计算机科学',
    teacherId: '1', // 陈文宇
    credits: 2,
    location: '立人楼B411',
    weeks: '1-16周',
    fixedTimeSlots: [
      {
        dayOfWeek: 1, // 周一
        timeSlotIds: ['5', '6'], // 第5-6节
        weeks: [{ start: 1, end: 6 }, { start: 7, end: 8 }],
        location: '立人楼B411'
      },
      {
        dayOfWeek: 3, // 周三
        timeSlotIds: ['5', '6'], // 第5-6节
        weeks: [{ start: 1, end: 6 }, { start: 7, end: 8 }],
        location: '立人楼B411'
      }
    ]
  },
  {
    id: '2',
    name: '高级软件开发技术',
    subject: '计算机科学',
    teacherId: '3', // 孙明
    credits: 1,
    location: '立人楼B402',
    weeks: '1-16周',
    fixedTimeSlots: [
      {
        dayOfWeek: 1, // 周一
        timeSlotIds: ['9', '10', '11'] // 第9-11节
      }
    ]
  },
  {
    id: '3',
    name: '机器学习2班',
    subject: '计算机科学',
    teacherId: '4', // 钟秀琴
    credits: 2,
    location: '立人楼B409',
    weeks: '1-16周',
    fixedTimeSlots: [
      {
        dayOfWeek: 2, // 周二
        timeSlotIds: ['3', '4'] // 第3-4节
      },
      {
        dayOfWeek: 4, // 周四
        timeSlotIds: ['7', '8'] // 第7-8节
      }
    ]
  },
  {
    id: '4',
    name: '分布式系统2班',
    subject: '计算机科学',
    teacherId: '6', // 薛瑞尼
    credits: 2,
    location: '立人楼B405',
    weeks: '1-16周',
    fixedTimeSlots: [
      {
        dayOfWeek: 2, // 周二
        timeSlotIds: ['9', '10'] // 第9-10节
      },
      {
        dayOfWeek: 4, // 周四
        timeSlotIds: ['1', '2'] // 第1-2节
      }
    ]
  },
  {
    id: '5',
    name: '高级算法设计与分析2班',
    subject: '计算机科学',
    teacherId: '8', // 周毅
    credits: 2,
    location: '立人楼B406',
    weeks: '1-16周',
    fixedTimeSlots: [
      {
        dayOfWeek: 1, // 周一
        timeSlotIds: ['7', '8'] // 第7-8节
      },
      {
        dayOfWeek: 3, // 周三
        timeSlotIds: ['7', '8'] // 第7-8节
      }
    ]
  }
];

// 移除班级管理和约束，不再需要
