"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export type RepeatType = "none" | "daily" | "weekly_days";

export interface ActionItem {
  id: string;
  task: string;
  department: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  repeatType?: RepeatType;
  repeatDays?: number[]; // 0 = อา, 1 = จ, 2 = อ, 3 = พ, 4 = พฤ, 5 = ศ, 6 = ส
  completedDates?: string[]; // เก็บวันที่ที่ติ๊กเสร็จแล้ว เช่น ["2026-11-09"]
}

const DAYS_OF_WEEK = [
  { label: "อา", value: 0, rrule: "SU" },
  { label: "จ", value: 1, rrule: "MO" },
  { label: "อ", value: 2, rrule: "TU" },
  { label: "พ", value: 3, rrule: "WE" },
  { label: "พฤ", value: 4, rrule: "TH" },
  { label: "ศ", value: 5, rrule: "FR" },
  { label: "ส", value: 6, rrule: "SA" },
];

export default function TaskDashboardPage() {
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  // ตัวกรองและจัดการ Todo List รายวัน
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>("2026-11-09");
  const [newDailyTaskTitle, setNewDailyTaskTitle] = useState("");
  const [newDailyTaskDept, setNewDailyTaskDept] = useState("Management & Strategy");
  const [newDailyRepeatType, setNewDailyRepeatType] = useState<RepeatType>("none");
  const [newDailyRepeatDays, setNewDailyRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Modal สำหรับแก้ไขงาน
  const [editingTask, setEditingTask] = useState<ActionItem | null>(null);

  // ดึงข้อมูล departments จาก localStorage เพื่อใช้ใน dropdown
  const [departments, setDepartments] = useState<string[]>([
    "Management & Strategy",
    "Marketing & Content",
    "Design & Branding",
    "Tech & Development",
    "Operations & Admin",
  ]);

  useEffect(() => {
    const savedTasks = localStorage.getItem("relat3_tasks");
    if (savedTasks) {
      try {
        const parsed: ActionItem[] = JSON.parse(savedTasks);
        setTasks(
          parsed.map((item) => ({
            ...item,
            repeatType: item.repeatType || "none",
            repeatDays: item.repeatDays || [],
            completedDates: item.completedDates || (item.completed ? [item.dueDate || "2026-11-09"] : []),
          }))
        );
      } catch (e) {
        console.error(e);
      }
    }

    const savedDepts = localStorage.getItem("relat3_departments");
    if (savedDepts) {
      try {
        const parsed = JSON.parse(savedDepts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDepartments(parsed);
          setNewDailyTaskDept(parsed[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveTasks = (updated: ActionItem[]) => {
    setTasks(updated);
    localStorage.setItem("relat3_tasks", JSON.stringify(updated));
  };

  // เช็กว่างานนี้ต้องปรากฏในวันที่ระบุหรือไม่
  const isTaskScheduledForDate = (task: ActionItem, targetDateStr: string) => {
    if (!targetDateStr) return true;

    if (task.repeatType === "daily") {
      return !task.startDate || targetDateStr >= task.startDate;
    }

    if (task.repeatType === "weekly_days" && task.repeatDays && task.repeatDays.length > 0) {
      const targetDateObj = new Date(targetDateStr);
      const dayOfWeek = targetDateObj.getDay();
      const matchDay = task.repeatDays.includes(dayOfWeek);
      const isAfterStart = !task.startDate || targetDateStr >= task.startDate;
      return matchDay && isAfterStart;
    }

    return (
      (task.startDate <= targetDateStr && task.dueDate >= targetDateStr) ||
      task.startDate === targetDateStr ||
      task.dueDate === targetDateStr
    );
  };

  // เช็กว่างานนี้ทำเสร็จในวันที่กำหนดหรือยัง
  const isTaskCompletedOnDate = (task: ActionItem, targetDateStr: string) => {
    if (task.repeatType === "daily" || task.repeatType === "weekly_days") {
      return (task.completedDates || []).includes(targetDateStr);
    }
    return task.completed;
  };

  // ติ๊กสลับสถานะงาน (รองรับการติ๊กเสร็จแยกเฉพาะวัน)
  const handleToggleTaskOnDate = (id: string, targetDateStr: string) => {
    const updated = tasks.map((item) => {
      if (item.id !== id) return item;

      if (item.repeatType === "daily" || item.repeatType === "weekly_days") {
        const currentDates = item.completedDates || [];
        const isDone = currentDates.includes(targetDateStr);
        const newDates = isDone
          ? currentDates.filter((d) => d !== targetDateStr)
          : [...currentDates, targetDateStr];

        return {
          ...item,
          completedDates: newDates,
          completed: newDates.includes(targetDateStr),
        };
      } else {
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          completedDates: nextCompleted ? [targetDateStr] : [],
        };
      }
    });

    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
      const updated = tasks.filter((item) => item.id !== id);
      saveTasks(updated);
    }
  };

  const handleUpdateDate = (id: string, field: "startDate" | "dueDate", val: string) => {
    const updated = tasks.map((item) =>
      item.id === id ? { ...item, [field]: val } : item
    );
    saveTasks(updated);
  };

  // เพิ่ม Todo ประจำวันใหม่
  const handleAddDailyTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDailyTaskTitle.trim()) return;

    const newItem: ActionItem = {
      id: Date.now().toString(),
      task: newDailyTaskTitle.trim(),
      department: newDailyTaskDept,
      startDate: selectedDailyDate,
      dueDate: selectedDailyDate,
      completed: false,
      repeatType: newDailyRepeatType,
      repeatDays: newDailyRepeatType === "weekly_days" ? newDailyRepeatDays : [],
      completedDates: [],
    };

    saveTasks([newItem, ...tasks]);
    setNewDailyTaskTitle("");
    setNewDailyRepeatType("none");
  };

  // บันทึกการแก้ไขงานจาก Modal
  const handleSaveEditedTask = () => {
    if (!editingTask) return;
    if (!editingTask.task.trim()) {
      alert("กรุณากรอกชื่องานครับ");
      return;
    }

    const updated = tasks.map((item) =>
      item.id === editingTask.id ? editingTask : item
    );
    saveTasks(updated);
    setEditingTask(null);
  };

  // Sync Google Calendar พร้อมใส่เงื่อนไขการทำซ้ำ (RRULE)
  const handleSyncGoogleCalendar = (item: ActionItem) => {
    let repeatTitleTag = "";
    let rruleParam = "";

    if (item.repeatType === "daily") {
      repeatTitleTag = " (ทุกวัน)";
      rruleParam = "&recur=RRULE:FREQ=DAILY";
    } else if (item.repeatType === "weekly_days" && item.repeatDays && item.repeatDays.length > 0) {
      const dayCodes = item.repeatDays
        .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.rrule)
        .filter(Boolean)
        .join(",");
      repeatTitleTag = ` (${item.repeatDays.map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.label).join(", ")})`;
      rruleParam = `&recur=RRULE:FREQ=WEEKLY;BYDAY=${dayCodes}`;
    }

    const title = encodeURIComponent(`[${item.department}] ${item.task}${repeatTitleTag}`);
    const details = encodeURIComponent(
      `งานติดตามจาก Relate & Co.\nแผนก: ${item.department}\nกำหนดการ: ${item.startDate} ถึง ${item.dueDate}`
    );

    // สร้างช่วงเวลาสำหรับ Google Calendar
    const baseDate = item.startDate || item.dueDate || "2026-11-09";
    const startFormatted = baseDate.replace(/-/g, "");

    const endDateObj = new Date(baseDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endFormatted = endDateObj.toISOString().slice(0, 10).replace(/-/g, "");

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${startFormatted}/${endFormatted}${rruleParam}`;
    window.open(calendarUrl, "_blank");
  };

  // กรองเฉพาะงานที่ต้องทำในวันที่เลือก
  const dailyTasks = tasks.filter((item) => isTaskScheduledForDate(item, selectedDailyDate));
  const dailyCompletedCount = dailyTasks.filter((t) => isTaskCompletedOnDate(t, selectedDailyDate)).length;

  // กรองภาพรวมงานทั้งหมด
  const filteredAllTasks = tasks.filter((item) => {
    const matchSearch = item.task.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = filterDepartment === "ALL" ? true : item.department === filterDepartment;
    const matchStatus =
      filterStatus === "ALL"
        ? true
        : filterStatus === "COMPLETED"
        ? item.completed
        : !item.completed;

    return matchSearch && matchDept && matchStatus;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-10 text-[#4A3E3D]">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E8DFD8] pb-5 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#3A2D28]">Task &amp; Todo Dashboard</h1>
            <span className="bg-[#8C5E48] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Overview
            </span>
          </div>
          <p className="text-xs text-[#8C7A78] mt-1 font-medium">
            สรุปภาพรวมสิ่งที่ต้องทำ กำหนดการรายวัน และงานที่ทำซ้ำ (Relate &amp; Co.)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🎙️</span>
            <span>กลับหน้าบันทึกการประชุม</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {/* สรุปตัวเลขสถิติภาพรวม */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#EFE8E2] shadow-xs">
            <span className="text-[11px] font-semibold text-[#8C7A78] uppercase tracking-wider">งานทั้งหมด</span>
            <div className="text-2xl font-black text-[#3A2D28] mt-1">{totalTasks} รายการ</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#EFE8E2] shadow-xs">
            <span className="text-[11px] font-semibold text-[#B28268] uppercase tracking-wider">กำลังดำเนินการ</span>
            <div className="text-2xl font-black text-[#8C5E48] mt-1">{pendingTasks} รายการ</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#EFE8E2] shadow-xs">
            <span className="text-[11px] font-semibold text-[#5B8C6A] uppercase tracking-wider">เสร็จสิ้นแล้ว</span>
            <div className="text-2xl font-black text-[#487556] mt-1">{completedTasks} รายการ</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#EFE8E2] shadow-xs">
            <span className="text-[11px] font-semibold text-[#8C7A78] uppercase tracking-wider">ความคืบหน้ารวม</span>
            <div className="text-2xl font-black text-[#3A2D28] mt-1">{progressPercent}%</div>
            <div className="w-full bg-[#FAF7F5] rounded-full h-1.5 mt-2 overflow-hidden border border-[#EFE8E2]">
              <div
                className="bg-[#8C5E48] h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* -------------------- ส่วนที่ 1: Todo list รายวัน -------------------- */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DFD8]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F7F2EE] mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C5E48]"></span>
                <h2 className="text-base font-bold text-[#3A2D28]">
                  📋 Todo list รายวัน (Daily Focus &amp; Routine)
                </h2>
              </div>
              <p className="text-xs text-[#8C7A78] mt-0.5">
                รองรับทั้งงานประจำวันที่ตั้งให้แจ้งเตือนทุกวัน หรือเลือกเฉพาะวัน จ, อ, พ, พฤ, ศ, ส, อา
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#FAF7F5] border border-[#E8DFD8] px-3 py-1.5 rounded-xl">
                <span className="text-xs text-[#8C7A78]">📅 เลือกวัน:</span>
                <input
                  type="date"
                  value={selectedDailyDate}
                  onChange={(e) => setSelectedDailyDate(e.target.value)}
                  className="text-xs text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer font-bold"
                />
              </div>
              <div className="bg-[#F4ECE6] px-3 py-1.5 rounded-xl text-xs font-bold text-[#7A635A]">
                เสร็จแล้ว {dailyCompletedCount}/{dailyTasks.length} รายการ
              </div>
            </div>
          </div>

          {/* ฟอร์มเพิ่มงานประจำวันใหม่ */}
          <form
            onSubmit={handleAddDailyTask}
            className="mb-5 bg-[#FAF7F5] p-4 rounded-xl border border-[#EFE8E2] space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder={`เพิ่มงานสำหรับวันที่ ${selectedDailyDate} (เช่น เช็กสต็อกหน้าร้าน, ตอบเมลลูกค้า)...`}
                value={newDailyTaskTitle}
                onChange={(e) => setNewDailyTaskTitle(e.target.value)}
                className="sm:col-span-8 bg-white border border-[#E8DFD8] rounded-xl px-3.5 py-2 text-xs text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
              />
              <select
                value={newDailyTaskDept}
                onChange={(e) => setNewDailyTaskDept(e.target.value)}
                className="sm:col-span-4 bg-white border border-[#E8DFD8] rounded-xl px-2.5 py-2 text-xs text-[#5C4F4D] focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    🏷️ {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EFE8E2]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-[#8C7A78]">🔁 การทำซ้ำ:</span>
                <select
                  value={newDailyRepeatType}
                  onChange={(e) => setNewDailyRepeatType(e.target.value as RepeatType)}
                  className="bg-white border border-[#E8DFD8] text-xs font-medium rounded-xl px-2.5 py-1.5 text-[#5C4F4D] focus:outline-none"
                >
                  <option value="none">ครั้งเดียว (เฉพาะวันนี้)</option>
                  <option value="daily">ทุกวัน (Daily Routine)</option>
                  <option value="weekly_days">เลือกเฉพาะวันในสัปดาห์</option>
                </select>

                {newDailyRepeatType === "weekly_days" && (
                  <div className="flex items-center gap-1 bg-white border border-[#E8DFD8] p-1 rounded-xl">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = newDailyRepeatDays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewDailyRepeatDays(newDailyRepeatDays.filter((val) => val !== d.value));
                            } else {
                              setNewDailyRepeatDays([...newDailyRepeatDays, d.value]);
                            }
                          }}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#8C5E48] text-white"
                              : "bg-transparent text-[#8C7A78] hover:bg-[#FAF7F5]"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="bg-[#8C5E48] hover:bg-[#734A36] text-white rounded-xl text-xs font-semibold px-4 py-2 cursor-pointer transition-all shadow-xs ml-auto"
              >
                + บันทึกงานประจำวัน
              </button>
            </div>
          </form>

          {/* รายการ Todo list ประจำวัน */}
          <div className="space-y-3">
            {dailyTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8C7A78] bg-[#FCFAF8] rounded-xl border border-dashed border-[#E8DFD8]">
                🎉 ไม่มีงานค้างสำหรับวันที่ {selectedDailyDate} (พิมพ์เพิ่มงานด้านบนได้เลยครับ)
              </div>
            ) : (
              dailyTasks.map((item) => {
                const isCompletedToday = isTaskCompletedOnDate(item, selectedDailyDate);

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border gap-3 transition-all ${
                      isCompletedToday
                        ? "bg-[#FAF7F5]/60 border-[#EFE8E2] opacity-60"
                        : "bg-[#FCFAF8] border-[#E8DFD8] shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isCompletedToday}
                        onChange={() => handleToggleTaskOnDate(item.id, selectedDailyDate)}
                        className="w-4 h-4 mt-0.5 sm:mt-0 rounded text-[#8C5E48] focus:ring-0 cursor-pointer accent-[#8C5E48] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-xs font-semibold ${
                              isCompletedToday ? "line-through text-[#8C7A78]" : "text-[#3A2D28]"
                            }`}
                          >
                            {item.task}
                          </p>

                          {item.repeatType === "daily" && (
                            <span className="bg-[#FAF0E6] text-[#8C5E48] text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0">
                              🔁 ทุกวัน
                            </span>
                          )}

                          {item.repeatType === "weekly_days" && (
                            <span className="bg-[#FAF0E6] text-[#8C5E48] text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0">
                              🔁 {item.repeatDays?.map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.label).join(", ")}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#8C7A78]">
                          <span className="bg-[#F4ECE6] text-[#7A635A] px-2 py-0.5 rounded-md font-medium text-[10px]">
                            🏷️ {item.department}
                          </span>
                          <span>
                            📅 ช่วงเวลา: {item.startDate} {item.startDate !== item.dueDate ? `ถึง ${item.dueDate}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingTask(item)}
                        className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#2B6CB0] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <span>✏️</span>
                        <span>แก้ไข</span>
                      </button>

                      {/* ปุ่ม Sync ปฏิทินที่รองรับการทำซ้ำ */}
                      <button
                        type="button"
                        onClick={() => handleSyncGoogleCalendar(item)}
                        className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                        title={item.repeatType === "daily" ? "Sync ลงปฏิทินแบบทำซ้ำทุกวัน" : "Sync ลงปฏิทิน"}
                      >
                        <span>📅</span>
                        <span className="hidden sm:inline">Sync</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(item.id)}
                        className="text-[#C45E5E] hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 text-xs cursor-pointer transition-all"
                        title="ลบงานนี้"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* -------------------- ส่วนที่ 2: ภาพรวมงานทั้งหมด (All Action Items) -------------------- */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFE8E2]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F7F2EE] mb-5">
            <div>
              <h2 className="text-base font-bold text-[#3A2D28] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B28268]"></span>
                ภาพรวมงานและกำหนดการทั้งหมด ({filteredAllTasks.length} รายการ)
              </h2>
              <p className="text-xs text-[#8C7A78] mt-0.5">
                ค้นหา กรองตามแผนก และติดตามภาพรวม Action Items จากการประชุมทุกแผนก
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-[#FAF7F5] p-1 rounded-xl border border-[#EFE8E2] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus("ALL")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterStatus === "ALL" ? "bg-white text-[#8C5E48] shadow-2xs font-bold" : "text-[#8C7A78]"
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("PENDING")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterStatus === "PENDING" ? "bg-white text-[#8C5E48] shadow-2xs font-bold" : "text-[#8C7A78]"
                  }`}
                >
                  รอทำ
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("COMPLETED")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterStatus === "COMPLETED" ? "bg-white text-[#8C5E48] shadow-2xs font-bold" : "text-[#8C7A78]"
                  }`}
                >
                  เสร็จแล้ว
                </button>
              </div>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="bg-[#FAF7F5] border border-[#EFE8E2] text-xs font-medium rounded-xl px-3 py-1.5 text-[#5C4F4D] focus:outline-none"
              >
                <option value="ALL">ทุกแผนก</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 ค้นหางาน หรือแคมเปญสำคัญ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF7F5] border border-[#EFE8E2] rounded-xl px-3.5 py-2 text-xs text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
            />
          </div>

          <div className="space-y-3">
            {filteredAllTasks.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#8C7A78] bg-[#FAF7F5] rounded-xl border border-[#EFE8E2]">
                ไม่พบรายการสิ่งที่ต้องทำตามเงื่อนไขที่เลือก
              </div>
            ) : (
              filteredAllTasks.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border gap-3 transition-all ${
                    item.completed
                      ? "bg-[#FAF7F5]/50 border-[#EFE8E2] opacity-60"
                      : "bg-[#FCFAF8] border-[#E8DFD8] shadow-xs"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleTaskOnDate(item.id, item.dueDate || "2026-11-09")}
                      className="w-5 h-5 mt-0.5 sm:mt-0 rounded text-[#8C5E48] focus:ring-0 cursor-pointer accent-[#8C5E48] shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-xs sm:text-sm font-medium ${
                            item.completed ? "line-through text-[#8C7A78]" : "text-[#3A2D28]"
                          }`}
                        >
                          {item.task}
                        </p>
                        {item.repeatType === "daily" && (
                          <span className="bg-[#FAF0E6] text-[#8C5E48] text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                            🔁 ทุกวัน
                          </span>
                        )}
                        {item.repeatType === "weekly_days" && (
                          <span className="bg-[#FAF0E6] text-[#8C5E48] text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                            🔁 {item.repeatDays?.map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.label).join(", ")}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-[#8C7A78]">
                        <span className="bg-[#F4ECE6] text-[#7A635A] px-2 py-0.5 rounded-md font-semibold text-[10px]">
                          🏷️ {item.department}
                        </span>

                        <div className="flex items-center gap-1.5 bg-white border border-[#E8DFD8] px-2.5 py-1 rounded-md">
                          <span className="text-[10px] text-[#8C7A78]">📅 เริ่ม:</span>
                          <input
                            type="date"
                            value={item.startDate}
                            onChange={(e) => handleUpdateDate(item.id, "startDate", e.target.value)}
                            className="text-[11px] text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer font-medium"
                          />
                          <span className="text-[10px] text-[#8C7A78]">→ ถึง:</span>
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => handleUpdateDate(item.id, "dueDate", e.target.value)}
                            className="text-[11px] text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingTask(item)}
                      className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#2B6CB0] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>✏️</span>
                      <span>แก้ไข</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSyncGoogleCalendar(item)}
                      className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                      title="Sync ลง Google Calendar พร้อมการทำซ้ำ"
                    >
                      <span>📅</span>
                      <span className="text-[11px]">Sync</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(item.id)}
                      className="text-[#C45E5E] hover:text-red-700 p-2 rounded-lg hover:bg-red-50 text-xs cursor-pointer transition-all"
                      title="ลบรายการนี้"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* -------------------- Modal แก้ไขงาน -------------------- */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#EFE8E2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F7F2EE] mb-4">
              <h3 className="text-base font-bold text-[#3A2D28] flex items-center gap-2">
                <span>✏️</span> แก้ไขรายละเอียดงานและการทำซ้ำ
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-[#A89895] hover:text-[#5C4F4D] text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="text-[11px] font-semibold text-[#8C7A78] block mb-1">
                  ชื่องาน / รายละเอียด:
                </label>
                <textarea
                  value={editingTask.task}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, task: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-[#FAF7F5] border border-[#EFE8E2] text-xs rounded-xl p-3 text-[#4A3E3D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8C7A78] block mb-1">
                  🏷️ แผนกที่รับผิดชอบ:
                </label>
                <select
                  value={editingTask.department}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, department: e.target.value })
                  }
                  className="w-full bg-[#FAF7F5] border border-[#EFE8E2] text-xs font-medium rounded-xl px-3 py-2 text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8C7A78] block mb-1">
                  🔁 การตั้งเวลาทำซ้ำ:
                </label>
                <select
                  value={editingTask.repeatType || "none"}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, repeatType: e.target.value as RepeatType })
                  }
                  className="w-full bg-[#FAF7F5] border border-[#EFE8E2] text-xs font-medium rounded-xl px-3 py-2 text-[#5C4F4D] focus:outline-none mb-2"
                >
                  <option value="none">ครั้งเดียว (ไม่ทำซ้ำ)</option>
                  <option value="daily">ทุกวัน (Daily Routine)</option>
                  <option value="weekly_days">เลือกเฉพาะวันในสัปดาห์</option>
                </select>

                {editingTask.repeatType === "weekly_days" && (
                  <div className="flex items-center gap-1.5 bg-[#FAF7F5] border border-[#EFE8E2] p-2 rounded-xl justify-center">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = (editingTask.repeatDays || []).includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => {
                            const current = editingTask.repeatDays || [];
                            const updatedDays = isSelected
                              ? current.filter((val) => val !== d.value)
                              : [...current, d.value];
                            setEditingTask({ ...editingTask, repeatDays: updatedDays });
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#8C5E48] text-white"
                              : "bg-white text-[#8C7A78] border border-[#E8DFD8]"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#8C7A78] block mb-1">
                    📅 วันที่เริ่มต้น:
                  </label>
                  <input
                    type="date"
                    value={editingTask.startDate}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, startDate: e.target.value })
                    }
                    className="w-full bg-[#FAF7F5] border border-[#EFE8E2] text-xs rounded-xl px-3 py-2 text-[#5C4F4D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#8C7A78] block mb-1">
                    📅 กำหนดส่ง (Due Date):
                  </label>
                  <input
                    type="date"
                    value={editingTask.dueDate}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, dueDate: e.target.value })
                    }
                    className="w-full bg-[#FAF7F5] border border-[#EFE8E2] text-xs rounded-xl px-3 py-2 text-[#5C4F4D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F7F2EE]">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="bg-[#FAF7F5] hover:bg-[#EFE8E2] text-[#5C4F4D] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEditedTask}
                className="bg-[#8C5E48] hover:bg-[#734A36] text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-sm"
              >
                💾 บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}