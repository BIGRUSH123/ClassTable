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
  
  // 匹配所有 "星期X第Y-Z节" 的模式 - 使用兼容的方法
  const regex = /(星期[一二三四五六日]|周[一二三四五六日])\s*第\d+(?:-\d+)?节/g;
  let match;
  
  while ((match = regex.exec(timeContent)) !== null) {
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
  
  // 去重：合并相同星期、相同节次但不同周次的时间段
  return deduplicateTimeSlots(allTimeSlots);
}

/**
 * 去重和合并时间段
 * @param timeSlots - 原始时间段数组
 * @returns 去重后的时间段数组
 */
export function deduplicateTimeSlots(timeSlots: FixedTimeSlot[]): FixedTimeSlot[] {
  const slotMap = new Map<string, FixedTimeSlot>();
  
  for (const slot of timeSlots) {
    // 创建唯一键：星期 + 节次 + 地点
    const key = `${slot.dayOfWeek}-${slot.timeSlotIds.join(',')}-${slot.location || ''}`;
    
    if (slotMap.has(key)) {
      // 如果已存在相同的时间段，合并周次信息
      const existingSlot = slotMap.get(key)!;
      if (slot.weeks && slot.weeks.length > 0) {
        if (existingSlot.weeks && existingSlot.weeks.length > 0) {
          // 合并周次范围，去重
          const allWeeks = [...existingSlot.weeks, ...slot.weeks];
          existingSlot.weeks = mergeWeekRanges(allWeeks);
        } else {
          existingSlot.weeks = [...slot.weeks];
        }
      }
    } else {
      // 新的时间段，直接添加
      slotMap.set(key, {
        ...slot,
        weeks: slot.weeks ? [...slot.weeks] : undefined
      });
    }
  }
  
  return Array.from(slotMap.values());
}

/**
 * 合并和优化周次范围
 * @param weekRanges - 周次范围数组
 * @returns 优化后的周次范围数组
 */
export function mergeWeekRanges(weekRanges: WeekRange[]): WeekRange[] {
  if (weekRanges.length === 0) return [];
  
  // 按开始周次排序
  const sorted = weekRanges.sort((a, b) => a.start - b.start);
  const merged: WeekRange[] = [];
  
  for (const range of sorted) {
    if (merged.length === 0) {
      merged.push({ ...range });
    } else {
      const last = merged[merged.length - 1];
      // 检查是否可以合并（连续或重叠）
      if (range.start <= last.end + 1) {
        // 合并范围
        last.end = Math.max(last.end, range.end);
      } else {
        // 添加新范围
        merged.push({ ...range });
      }
    }
  }
  
  return merged;
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
  // 首先按行分割，然后处理每行
  const allLines = courseText.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
  
  if (allLines.length === 0) {
    throw new Error('课程信息为空');
  }
  
  // 第一行包含主要信息，按制表符分割
  const firstLineFields = allLines[0].split('\t').map(field => field.trim());
  
  if (firstLineFields.length < 4) {
    throw new Error('课程信息格式不正确，至少需要包含：课程名、学分/教师、学院等信息');
  }
  
  let name: string;
  let teachers: string[];
  let department: string;
  let campus: string;
  let credits: number | undefined;
  let timeTextLines: string[] = [];
  
  // 尝试两种常见的数据格式
  if (firstLineFields.length >= 6) {
    // 格式1: 课程名	学分	考试方式	学院	教师	校区	时间安排...
    // 或格式2: 课程名	教师	学院	校区	学时	学分	时间安排...
    
    // 检测哪种格式：如果第二个字段是纯数字，可能是学分在前
    const secondFieldIsNumber = /^\d+$/.test(firstLineFields[1]);
    
    if (secondFieldIsNumber && firstLineFields.length >= 6) {
      // 格式1: 课程名	学分	考试方式	学院	教师	校区	时间安排...
      name = firstLineFields[0];
      credits = parseInt(firstLineFields[1]) || undefined;
      // 跳过考试方式字段 (firstLineFields[2])
      department = firstLineFields[3];
      teachers = firstLineFields[4].split(/[,，]/).map(t => t.trim()).filter(t => t !== '');
      campus = firstLineFields[5];
      // 时间信息从第7个字段开始（索引6）
      if (firstLineFields.length > 6) {
        timeTextLines.push(firstLineFields.slice(6).join('\t'));
      }
    } else {
      // 格式2: 课程名	教师	学院	校区	学时	学分	时间安排...
      name = firstLineFields[0];
      teachers = firstLineFields[1].split(/[,，]/).map(t => t.trim()).filter(t => t !== '');
      department = firstLineFields[2];
      campus = firstLineFields[3];
      // 学时通常在第5列，学分在第6列
      if (firstLineFields.length > 5) {
        const creditsMatch = firstLineFields[5].match(/\d+/);
        if (creditsMatch) {
          credits = parseInt(creditsMatch[0]);
        }
      }
      // 时间信息从第7个字段开始（索引6）
      if (firstLineFields.length > 6) {
        timeTextLines.push(firstLineFields.slice(6).join('\t'));
      }
    }
  } else {
    // 简单格式处理
    name = firstLineFields[0];
    teachers = firstLineFields[1] ? firstLineFields[1].split(/[,，]/).map(t => t.trim()).filter(t => t !== '') : ['未知教师'];
    department = firstLineFields[2] || '未知学院';
    campus = firstLineFields[3] || '未知校区';
    credits = undefined;
  }
  
  // 收集所有后续行作为时间信息（这些行可能不包含制表符，只是续行的时间数据）
  for (let i = 1; i < allLines.length; i++) {
    const line = allLines[i];
    // 如果这一行包含制表符，可能是新的课程记录，跳过
    if (line.includes('\t')) {
      // 检查是否是时间信息的一部分（包含周次、星期等关键词）
      if (/\d+[-–]?\d*周|星期[一二三四五六日]|第\d+/.test(line)) {
        timeTextLines.push(line);
      }
      break; // 遇到新的制表符分隔行，停止
    } else {
      // 没有制表符的行，很可能是时间信息的续行
      timeTextLines.push(line);
    }
  }
  
  // 解析时间信息
  const timeText = timeTextLines.join('\n');
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
