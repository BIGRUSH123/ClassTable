import { FixedTimeSlot, WeekRange } from '../types';

/**
 * 解析课程时间文本，支持复杂的时间格式
 * 例如：1-6周，星期一第5-6节 星期三第5-6节 (立人楼B411)
 *      7-8周，星期一第5-6节 星期三第5-6节 (立人楼B411)
 */

// 星期映射
const DAY_MAP: { [key: string]: number } = {
  '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, '星期五': 5, '星期六': 6, '星期日': 7,
  '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7,
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7
};

/**
 * 解析周次范围字符串
 * @param weekStr - 如 "1-6周" 或 "7-8周"
 * @returns WeekRange 对象
 */
export function parseWeekRange(weekStr: string): WeekRange | null {
  // 匹配 "数字-数字周" 或 "数字周" 格式
  const match = weekStr.match(/(\d+)(?:-(\d+))?周?/);
  if (!match) return null;
  
  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : start;
  
  return { start, end };
}

/**
 * 解析节次范围
 * @param timeStr - 如 "第5-6节" 或 "第5节"
 * @returns 时间段ID数组
 */
export function parseTimeSlots(timeStr: string): string[] {
  // 匹配 "第数字-数字节" 或 "第数字节" 格式
  const match = timeStr.match(/第(\d+)(?:-(\d+))?节/);
  if (!match) return [];
  
  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : start;
  
  const slots: string[] = [];
  for (let i = start; i <= end; i++) {
    slots.push(i.toString());
  }
  
  return slots;
}

/**
 * 解析地点信息
 * @param text - 包含地点的文本，如 "(立人楼B411)"
 * @returns 地点字符串
 */
export function parseLocation(text: string): string | undefined {
  const match = text.match(/\(([^)]+)\)/);
  return match ? match[1] : undefined;
}

/**
 * 解析星期
 * @param dayStr - 如 "星期一" 或 "周一"
 * @returns 星期数字 (1-7)
 */
export function parseDay(dayStr: string): number | null {
  return DAY_MAP[dayStr] || null;
}

/**
 * 解析单行时间安排
 * @param line - 如 "1-6周，星期一第5-6节 星期三第5-6节 (立人楼B411)"
 * @returns 解析结果
 */
export function parseTimeLine(line: string): {
  weeks: WeekRange | null;
  timeSlots: FixedTimeSlot[];
  location?: string;
} {
  const trimmedLine = line.trim();
  
  // 提取周次信息
  const weekMatch = trimmedLine.match(/^(\d+(?:-\d+)?周?)[，,]/);
  const weeks = weekMatch ? parseWeekRange(weekMatch[1]) : null;
  
  // 提取地点信息
  const location = parseLocation(trimmedLine);
  
  // 移除周次和地点信息，只保留时间安排
  let timeContent = trimmedLine;
  if (weekMatch) {
    timeContent = timeContent.replace(weekMatch[0], '');
  }
  if (location) {
    timeContent = timeContent.replace(/\([^)]+\)/, '');
  }
  timeContent = timeContent.trim();
  
  // 解析时间安排：星期X第Y-Z节
  const timeSlots: FixedTimeSlot[] = [];
  
  // 匹配所有 "星期X第Y-Z节" 的模式
  const timeMatches = timeContent.matchAll(/(星期[一二三四五六日]|周[一二三四五六日])\s*第\d+(?:-\d+)?节/g);
  
  for (const match of timeMatches) {
    const fullMatch = match[0];
    
    // 提取星期
    const dayMatch = fullMatch.match(/(星期[一二三四五六日]|周[一二三四五六日])/);
    if (!dayMatch) continue;
    
    const dayOfWeek = parseDay(dayMatch[1]);
    if (!dayOfWeek) continue;
    
    // 提取节次
    const timeSlotIds = parseTimeSlots(fullMatch);
    if (timeSlotIds.length === 0) continue;
    
    timeSlots.push({
      dayOfWeek,
      timeSlotIds,
      weeks: weeks ? [weeks] : undefined,
      location
    });
  }
  
  return {
    weeks,
    timeSlots,
    location
  };
}

/**
 * 解析完整的课程时间文本
 * @param timeText - 完整的时间文本
 * @returns FixedTimeSlot数组
 */
export function parseCourseTime(timeText: string): FixedTimeSlot[] {
  if (!timeText || timeText.trim() === '') return [];
  
  const allTimeSlots: FixedTimeSlot[] = [];
  
  // 按行分割
  const lines = timeText.split(/\n|\r\n/).filter(line => line.trim() !== '');
  
  for (const line of lines) {
    const result = parseTimeLine(line);
    allTimeSlots.push(...result.timeSlots);
  }
  
  return allTimeSlots;
}

/**
 * 从课程描述文本中提取课程信息
 * @param courseText - 完整的课程描述文本
 * @returns 解析的课程信息
 */
export function parseCourseInfo(courseText: string): {
  name: string;
  teachers: string[];
  department?: string;
  campus?: string;
  credits?: number;
  timeSlots: FixedTimeSlot[];
} {
  const lines = courseText.split(/\t|\n/).filter(line => line.trim() !== '');
  
  if (lines.length < 4) {
    throw new Error('课程信息格式不正确，至少需要包含：课程名、教师、学院、校区等信息');
  }
  
  const name = lines[0].trim();
  const teachersStr = lines[1].trim();
  const department = lines[2].trim();
  const campus = lines[3].trim();
  
  // 解析教师（可能有多个，用逗号分隔）
  const teachers = teachersStr.split(/[,，]/).map(t => t.trim()).filter(t => t !== '');
  
  // 提取学分信息（通常在第5列）
  let credits: number | undefined;
  if (lines.length > 4) {
    const creditsMatch = lines[4].match(/\d+/);
    if (creditsMatch) {
      credits = parseInt(creditsMatch[0]);
    }
  }
  
  // 提取时间信息（通常从第6列开始）
  const timeText = lines.slice(5).join('\n');
  const timeSlots = parseCourseTime(timeText);
  
  return {
    name,
    teachers,
    department,
    campus,
    credits,
    timeSlots
  };
}

/**
 * 检查指定周次是否在周次范围内
 * @param week - 要检查的周次
 * @param ranges - 周次范围数组
 * @returns 是否在范围内
 */
export function isWeekInRanges(week: number, ranges?: WeekRange[]): boolean {
  if (!ranges || ranges.length === 0) return true;
  
  return ranges.some(range => week >= range.start && week <= range.end);
}

/**
 * 格式化周次范围为字符串
 * @param ranges - 周次范围数组
 * @returns 格式化的字符串
 */
export function formatWeekRanges(ranges?: WeekRange[]): string {
  if (!ranges || ranges.length === 0) return '全学期';
  
  return ranges.map(range => {
    if (range.start === range.end) {
      return `${range.start}周`;
    } else {
      return `${range.start}-${range.end}周`;
    }
  }).join('，');
}
