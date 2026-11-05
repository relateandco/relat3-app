'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Calendar, Mic, MicOff, CheckCircle2, ListTodo, ExternalLink, Sparkles } from 'lucide-react';

interface MockTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: 'todo' | 'done';
}

export default function HomePreview() {
  const [selectedDate, setSelectedDate] = useState('2026-11-04');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(
    'สรุปประชุมทีมออกแบบ: ตกลงใช้คู่สี Earthy Brown ครีม-น้ำตาลตามเอกลักษณ์แบรนด์ Relate & Co. เตรียมส่งมอบ Action Items วันพรุ่งนี้'
  );
  const [tasks, setTasks] = useState<MockTask[]>([
    {
      id: '1',
      title: 'ปรับแต่งดีไซน์ Dashboard ให้ตรงคู่สี Relate & Co.',
      assignee: 'ทีม Frontend',
      dueDate: '2026-11-04',
      status: 'done',
    },
    {
      id: '2',
      title: 'ทดสอบ Web Speech API สำหรับถอดเสียงภาษาไทย',
      assignee: 'ทีมพัฒนาระบบ',
      dueDate: '2026-11-04',
      status: 'todo',
    },
    {
      id: '3',
      title: 'เชื่อมต่อระบบ Sync ไปยัง Google Calendar',
      assignee: 'ทีมงาน',
      dueDate: '2026-11-05',
      status: 'todo',
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t))
    );
  };

  const getCalendarLink = (task: MockTask) => {
    const d = task.dueDate.replace(/-/g, '');
    const title = encodeURIComponent(`[Relate & Co.] ${task.title}`);
    const details = encodeURIComponent(`ผู้รับผิดชอบ: ${task.assignee}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${d}T090000Z/${d}T100000Z`;
  };

  return (
    <div className="min-h-screen bg-[#F3E9E2] text-[#4A1E0D] p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Brand Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF5F0] p-6 rounded-3xl border border-[#E5D5C8] shadow-sm">
          <div className="flex items-center gap-4">
            {/* กรอบสี่เหลี่ยมจัตุรัส 1:1 ขนาด 72x72px ขอบมน */}
            <div className="w-[72px] h-[72px] rounded-2xl bg-white border border-[#E5D5C8] flex items-center justify-center shadow-inner overflow-hidden relative shrink-0 aspect-square">
              <Image
                src="/logo.png"
                alt="Relate & Co. Logo"
                fill
                sizes="72px"
                className="object-contain scale-[1.9]"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#4A1E0D]">
                  Relate & Co.
                </h1>
                <span className="text-[10px] font-bold text-white bg-[#B35638] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#B35638] mt-0.5">
                Meeting Planner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-[#E5D5C8] shadow-xs">
            <Calendar className="w-4 h-4 text-[#B35638]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#4A1E0D] focus:outline-none cursor-pointer"
            />
          </div>
        </header>

        {/* Voice Recorder & Summary Preview */}
        <section className="bg-[#FAF5F0] p-6 rounded-3xl border border-[#E5D5C8] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#4A1E0D] flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#B35638]" />
              บันทึกเสียงและถอดความ (Speech-to-Text)
            </h2>
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
                isRecording ? 'bg-[#B35638] animate-pulse' : 'bg-[#4A1E0D] hover:bg-[#381608]'
              }`}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {isRecording ? 'กำลังบันทึกเสียง...' : 'กดเพื่อเริ่มอัดเสียง'}
            </button>
          </div>

          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full p-3.5 bg-white border border-[#E5D5C8] rounded-2xl text-xs text-[#4A1E0D] focus:outline-none focus:ring-1 focus:ring-[#B35638] leading-relaxed shadow-xs"
          />

          <div className="flex items-center gap-2 text-[11px] text-[#A67C6D] bg-[#F3E9E2] p-2.5 rounded-xl border border-[#E5D5C8]/60">
            <Sparkles className="w-3.5 h-3.5 text-[#B35638] shrink-0" />
            <span>ระบบ Web Speech API รันบนเบราว์เซอร์ฟรี ไม่จำกัด และไม่เสียค่าบริการภายนอก</span>
          </div>
        </section>

        {/* Tasks List */}
        <section className="bg-[#FAF5F0] p-6 rounded-3xl border border-[#E5D5C8] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#4A1E0D] flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-[#B35638]" />
              รายการสิ่งที่ต้องทำ (Action Items)
            </h2>
            <span className="text-xs font-semibold text-[#A67C6D]">
              เสร็จแล้ว {tasks.filter((t) => t.status === 'done').length} / {tasks.length}
            </span>
          </div>

          <div className="divide-y divide-[#E5D5C8]">
            {tasks.map((task) => (
              <div key={task.id} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      task.status === 'done'
                        ? 'bg-[#B35638] border-[#B35638] text-white'
                        : 'bg-white border-[#E5D5C8] hover:border-[#B35638]'
                    }`}
                  >
                    {task.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        task.status === 'done' ? 'line-through text-[#A67C6D]' : 'text-[#4A1E0D]'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-[10px] text-[#A67C6D]">
                      {task.assignee} • กำหนดส่ง {task.dueDate}
                    </span>
                  </div>
                </div>

                <a
                  href={getCalendarLink(task)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#B35638] bg-white hover:bg-[#F3E9E2] border border-[#E5D5C8] rounded-xl transition-colors shadow-2xs"
                >
                  <Calendar className="w-3 h-3" />
                  ลงปฏิทิน
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}