import React, { useState } from 'react';
import { SchedulingAlgorithm, SchedulingResult, SchedulingOptions } from '../utils/schedulingAlgorithm';
import { predefinedSchedule } from '../utils/predefinedSchedule';
import { Course, Teacher, TimeSlot, Conflict } from '../types';
import { Play, AlertTriangle, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';

interface ScheduleGeneratorProps {
  courses: Course[];
  teachers: Teacher[];
  timeSlots: TimeSlot[];
  onScheduleGenerated: (result: SchedulingResult) => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  courses,
  teachers,
  timeSlots,
  onScheduleGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<SchedulingResult | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [weekRange, setWeekRange] = useState({ start: 1, end: 20 });

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const algorithm = new SchedulingAlgorithm(
        courses,
        teachers,
        timeSlots
      );
      
      // 构建排课选项
      const options: SchedulingOptions = {};
      if (selectedWeek !== 'all') {
        options.selectedWeek = selectedWeek;
      } else {
        options.weekRange = weekRange;
      }
      
      const result = algorithm.generateSchedule(options);
      setLastResult(result);
      onScheduleGenerated(result);
    } catch (error) {
      const errorResult: SchedulingResult = {
        schedule: [],
        conflicts: [],
        success: false,
        message: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
      setLastResult(errorResult);
      onScheduleGenerated(errorResult);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUsePredefined = async () => {
    setIsGenerating(true);
    
    try {
      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result: SchedulingResult = {
        schedule: predefinedSchedule,
        conflicts: [],
        success: true,
        message: '已加载预定义课表！'
      };
      
      setLastResult(result);
      onScheduleGenerated(result);
    } catch (error) {
      const errorResult: SchedulingResult = {
        schedule: [],
        conflicts: [],
        success: false,
        message: `加载失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
      setLastResult(errorResult);
      onScheduleGenerated(errorResult);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = courses.length > 0 && teachers.length > 0;

  const renderConflictItem = (conflict: Conflict, index: number) => {
    return (
      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900 mb-2">{conflict.message}</h4>
            <div className="space-y-1">
              {conflict.items.map((item, itemIndex) => (
                <div key={itemIndex} className="text-sm text-red-700 bg-red-100 rounded px-2 py-1">
                  课程: {courses.find(c => c.id === item.courseId)?.name || '未知'} | 
                  教师: {teachers.find(t => t.id === item.teacherId)?.name || '未知'}
                  {item.location && ` | 地点: ${item.location}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">智能排课生成</h3>
        
        {/* 数据检查 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-sm text-gray-600">课程</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{teachers.length}</div>
            <div className="text-sm text-gray-600">教师</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{courses.reduce((sum, course) => sum + course.credits, 0)}</div>
            <div className="text-sm text-gray-600">总学分</div>
          </div>
        </div>

        {/* 周次选择 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            排课范围设置
          </h4>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="all"
                  checked={selectedWeek === 'all'}
                  onChange={(e) => setSelectedWeek('all')}
                  className="text-primary-600"
                />
                <span>生成全学期课表</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="single"
                  checked={selectedWeek !== 'all'}
                  onChange={(e) => setSelectedWeek(1)}
                  className="text-primary-600"
                />
                <span>生成指定周次课表</span>
              </label>
              {selectedWeek !== 'all' && (
                <div className="ml-6 mt-2">
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(week => (
                      <option key={week} value={week}>第{week}周</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {selectedWeek === 'all' && (
              <div className="bg-white p-3 rounded border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  周次范围：
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={weekRange.start}
                    onChange={(e) => setWeekRange(prev => ({ ...prev, start: parseInt(e.target.value) }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(week => (
                      <option key={week} value={week}>{week}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">到</span>
                  <select
                    value={weekRange.end}
                    onChange={(e) => setWeekRange(prev => ({ ...prev, end: parseInt(e.target.value) }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(week => (
                      <option key={week} value={week}>{week}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">周</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 生成按钮 */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className={`btn-primary flex items-center gap-2 ${
                !canGenerate || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Play className="h-4 w-4" />
              {isGenerating ? '正在生成...' : 
                selectedWeek === 'all' ? '生成全学期课表' : `生成第${selectedWeek}周课表`}
            </button>
            
            <button
              onClick={handleUsePredefined}
              disabled={isGenerating}
              className={`btn-secondary flex items-center gap-2 ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileText className="h-4 w-4" />
              {isGenerating ? '正在加载...' : '使用预定义课表'}
            </button>
          </div>
          
          {!canGenerate && (
            <p className="text-sm text-red-600">
              请先添加课程和教师信息
            </p>
          )}
          
          <p className="text-sm text-gray-600">
            智能排课：根据约束条件自动生成课表<br/>
            预定义课表：使用已录入的具体时间安排
          </p>
        </div>
      </div>

      {/* 生成结果 */}
      {lastResult && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            {lastResult.success ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <h3 className="text-lg font-semibold">生成结果</h3>
          </div>

          <div className={`p-4 rounded-lg mb-4 ${
            lastResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`font-medium ${
              lastResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastResult.message}
            </p>
          </div>

          {/* 统计信息 */}
          {lastResult.schedule.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {lastResult.schedule.length}
                </div>
                <div className="text-sm text-blue-700">已安排课程</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">
                  {lastResult.conflicts.length}
                </div>
                <div className="text-sm text-red-700">冲突数量</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {new Set(lastResult.schedule.map(s => s.teacherId)).size}
                </div>
                <div className="text-sm text-green-700">参与教师</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {new Set(lastResult.schedule.map(s => s.location).filter(Boolean)).size}
                </div>
                <div className="text-sm text-purple-700">上课地点</div>
              </div>
            </div>
          )}

          {/* 冲突详情 */}
          {lastResult.conflicts.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                冲突详情 ({lastResult.conflicts.length})
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {lastResult.conflicts.map(renderConflictItem)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
