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
  completedDates?: string[];
}

const MONTH_NAMES = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const WEEK_DAYS = [
  { short: "อา.", full: "วันอาทิตย์" },
  { short: "จ.", full: "วันจันทร์" },
  { short: "อ.", full: "วันอังคาร" },
  { short: "พ.", full: "วันพุธ" },
  { short: "พฤ.", full: "วันพฤหัสบดี" },
  { short: "ศ.", full: "วันศุกร์" },
  { short: "ส.", full: "วันเสาร์" },
];

const DEPT_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  "Management & Strategy": { bg: "bg-[#F4ECE6]", text: "text-[#7A635A]", border: "border-[#E8DFD8]" },
  "Marketing & Content": { bg: "bg-[#FBEAEB]", text: "text-[#9C4A52]", border: "border-[#F5CDD1]" },
  "Design & Branding": { bg: "bg-[#F3EBF9]", text: "text-[#6E4894]", border: "border-[#E3CFF4]" },
  "Tech & Development": { bg: "bg-[#EAF3FA]", text: "text-[#3D698D]", border: "border-[#CCE0F2]" },
  "Operations & Admin": { bg: "bg-[#EAF5ED]", text: "text-[#3F734F]", border: "border-[#CEE8D5]" },
};

// แปลง Date เป็นสตริง YYYY-MM-DD
function formatDateToISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // วันที่ใช้เป็นฐานอ้างอิง
  const [baseDate, setBaseDate] = useState<Date>(new Date(2026, 10, 9));
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-11-09");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");

  useEffect(() => {
    const saved = localStorage.getItem("relat3_tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveTasks = (updated: ActionItem[]) => {
    setTasks(updated);
    localStorage.setItem("relat3_tasks", JSON.stringify(updated));
  };

  // เช็กว่างานอยู่ในวันที่ระบุหรือไม่
  const isTaskOnDate = (task: ActionItem, dateStr: string) => {
    if (filterDepartment !== "ALL" && task.department !== filterDepartment) {
      return false;
    }

    if (task.repeatType === "daily") {
      return !task.startDate || dateStr >= task.startDate;
    }

    if (task.repeatType === "weekly_days" && task.repeatDays && task.repeatDays.length > 0) {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayOfWeek = d.getDay();
      const matchDay = task.repeatDays.includes(dayOfWeek);
      const isAfterStart = !task.startDate || dateStr >= task.startDate;
      return matchDay && isAfterStart;
    }

    return (
      (task.startDate <= dateStr && task.dueDate >= dateStr) ||
      task.startDate === dateStr ||
      task.dueDate === dateStr
    );
  };

  const isCompletedOnDate = (task: ActionItem, dateStr: string) => {
    if (task.repeatType === "daily" || task.repeatType === "weekly_days") {
      return (task.completedDates || []).includes(dateStr);
    }
    return task.completed;
  };

  const handleToggleTaskOnDate = (id: string, dateStr: string) => {
    const updated = tasks.map((item) => {
      if (item.id !== id) return item;

      if (item.repeatType === "daily" || item.repeatType === "weekly_days") {
        const cur = item.completedDates || [];
        const isDone = cur.includes(dateStr);
        const next = isDone ? cur.filter((d) => d !== dateStr) : [...cur, dateStr];
        return { ...item, completedDates: next, completed: next.includes(dateStr) };
      } else {
        const next = !item.completed;
        return { ...item, completed: next, completedDates: next ? [dateStr] : [] };
      }
    });
    saveTasks(updated);
  };

  // การเลื่อนเวลาสำหรับ Month / Week
  const handlePrev = () => {
    const nextDate = new Date(baseDate);
    if (viewMode === "month") {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else {
      nextDate.setDate(nextDate.getDate() - 7);
    }
    setBaseDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(baseDate);
    if (viewMode === "month") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setDate(nextDate.getDate() + 7);
    }
    setBaseDate(nextDate);
  };

  const handleToday = () => {
    const today = new Date(2026, 10, 9);
    setBaseDate(today);
    setSelectedDateStr("2026-11-09");
  };

  // คำนวณวันสำหรับ Month View
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();

  const monthCells = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    monthCells.push({
      dayNumber: prevMonthLastDate - i,
      monthType: "prev",
      dateStr: "",
    });
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    monthCells.push({
      dayNumber: d,
      monthType: "current",
      dateStr: `${currentYear}-${monthStr}-${dayStr}`,
    });
  }
  const remainingCells = (7 - (monthCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    monthCells.push({
      dayNumber: d,
      monthType: "next",
      dateStr: "",
    });
  }

  // คำนวณวันสำหรับ Week View (เริ่มวันอาทิตย์ ถึง วันเสาร์)
  const currentDayOfWeek = baseDate.getDay();
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() - currentDayOfWeek);

  const weekDaysList = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDaysList.push({
      dateObj: day,
      dateStr: formatDateToISO(day),
      dayNumber: day.getDate(),
      dayName: WEEK_DAYS[i].short,
      dayFullName: WEEK_DAYS[i].full,
    });
  }

  const selectedDateTasks = tasks.filter((t) => isTaskOnDate(t, selectedDateStr));
  const departmentsList = Array.from(new Set(tasks.map((t) => t.department))).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-10 text-[#4A3E3D]">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E8DFD8] pb-5 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#3A2D28]">Calendar Schedule</h1>
            <span className="bg-[#8C5E48] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {viewMode === "month" ? "Monthly" : "Weekly"}
            </span>
          </div>
          <p className="text-xs text-[#8C7A78] mt-1 font-medium">
            ปฏิทินแสดงกำหนดการส่งมอบ แคมเปญโปรโมชัน และงานประจำวัน (Relate &amp; Co.)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>📊</span>
            <span>Task Dashboard</span>
          </Link>
          <Link
            href="/"
            className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>🎙️</span>
            <span>บันทึกการประชุม</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ปฏิทินแสดงผล */}
        <section className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-[#E8DFD8]">
          {/* Controls ด้านบน: สลับเดือน/สัปดาห์, ปุ่มวันนี้, แท็บเลือก Month/Week และตัวกรองแผนก */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F7F2EE] mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base sm:text-lg font-bold text-[#3A2D28]">
                {viewMode === "month"
                  ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
                  : `สัปดาห์ที่ ${weekDaysList[0].dayNumber} - ${weekDaysList[6].dayNumber} ${MONTH_NAMES[weekDaysList[0].dateObj.getMonth()]} ${currentYear}`}
              </h2>
              <div className="flex items-center gap-1 bg-[#FAF7F5] border border-[#E8DFD8] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-2.5 py-1 text-xs hover:bg-white rounded-lg text-[#5C4F4D] cursor-pointer transition-all"
                  title="ก่อนหน้า"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs hover:bg-white rounded-lg text-[#8C5E48] font-bold cursor-pointer transition-all"
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-2.5 py-1 text-xs hover:bg-white rounded-lg text-[#5C4F4D] cursor-pointer transition-all"
                  title="ถัดไป"
                >
                  ▶
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* ปุ่มสลับมุมมอง รายเดือน / รายสัปดาห์ */}
              <div className="flex bg-[#FAF7F5] p-1 rounded-xl border border-[#E8DFD8] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    viewMode === "month"
                      ? "bg-white text-[#8C5E48] shadow-2xs font-bold"
                      : "text-[#8C7A78] hover:text-[#5C4F4D]"
                  }`}
                >
                  รายเดือน
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    viewMode === "week"
                      ? "bg-white text-[#8C5E48] shadow-2xs font-bold"
                      : "text-[#8C7A78] hover:text-[#5C4F4D]"
                  }`}
                >
                  รายสัปดาห์
                </button>
              </div>

              {/* กรองแผนก */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="bg-[#FAF7F5] border border-[#E8DFD8] text-xs font-medium rounded-xl px-2.5 py-1.5 text-[#5C4F4D] focus:outline-none"
              >
                <option value="ALL">ทุกแผนก</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 1. มุมมองรายเดือน (Monthly Grid View) */}
          {viewMode === "month" && (
            <div>
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[#8C7A78] mb-2">
                {WEEK_DAYS.map((w, idx) => (
                  <div key={w.short} className={`py-1.5 ${idx === 0 || idx === 6 ? "text-[#B28268]" : ""}`}>
                    {w.short}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthCells.map((cell, idx) => {
                  if (cell.monthType !== "current") {
                    return (
                      <div
                        key={idx}
                        className="min-h-[85px] p-1.5 bg-[#FAF7F5]/40 border border-[#F7F2EE] rounded-xl opacity-35 text-[11px] text-[#A89895]"
                      >
                        {cell.dayNumber}
                      </div>
                    );
                  }

                  const isSelected = cell.dateStr === selectedDateStr;
                  const isToday = cell.dateStr === "2026-11-09";
                  const dayTasks = tasks.filter((t) => isTaskOnDate(t, cell.dateStr));

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      className={`min-h-[85px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#FFF9F5] border-[#8C5E48] ring-1 ring-[#8C5E48] shadow-xs"
                          : "bg-white border-[#EFE8E2] hover:border-[#D0C5BD]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isToday
                              ? "bg-[#8C5E48] text-white"
                              : isSelected
                              ? "text-[#8C5E48]"
                              : "text-[#3A2D28]"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[9px] bg-[#FAF7F5] border border-[#E8DFD8] text-[#8C7A78] px-1 rounded-md font-semibold">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayTasks.slice(0, 2).map((t) => {
                          const colorStyle = DEPT_COLORS[t.department] || {
                            bg: "bg-[#FAF7F5]",
                            text: "text-[#5C4F4D]",
                            border: "border-[#E8DFD8]",
                          };
                          const done = isCompletedOnDate(t, cell.dateStr);

                          return (
                            <div
                              key={t.id}
                              className={`text-[9px] px-1.5 py-0.5 rounded truncate border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} ${
                                done ? "line-through opacity-50" : "font-medium"
                              }`}
                              title={t.task}
                            >
                              {t.task}
                            </div>
                          );
                        })}
                        {dayTasks.length > 2 && (
                          <div className="text-[9px] text-[#8C7A78] text-center font-medium">
                            +{dayTasks.length - 2} อื่นๆ
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. มุมมองรายสัปดาห์ (Weekly View) */}
          {viewMode === "week" && (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {weekDaysList.map((day) => {
                const isSelected = day.dateStr === selectedDateStr;
                const isToday = day.dateStr === "2026-11-09";
                const dayTasks = tasks.filter((t) => isTaskOnDate(t, day.dateStr));

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col min-h-[360px] ${
                      isSelected
                        ? "bg-[#FFF9F5] border-[#8C5E48] ring-1 ring-[#8C5E48] shadow-xs"
                        : "bg-white border-[#E8DFD8] hover:border-[#D0C5BD]"
                    }`}
                  >
                    {/* Header วันที่ในสัปดาห์ */}
                    <div className="pb-2 border-b border-[#F7F2EE] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#8C7A78] block">
                          {day.dayName}
                        </span>
                        <span
                          className={`text-sm font-black inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5 ${
                            isToday
                              ? "bg-[#8C5E48] text-white"
                              : isSelected
                              ? "text-[#8C5E48]"
                              : "text-[#3A2D28]"
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8C7A78] bg-[#FAF7F5] border border-[#E8DFD8] px-1.5 py-0.5 rounded-md">
                        {dayTasks.length}
                      </span>
                    </div>

                    {/* รายการงานในแต่ละวันของสัปดาห์ */}
                    <div className="mt-2 space-y-1.5 flex-1 overflow-y-auto max-h-[300px] pr-0.5">
                      {dayTasks.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center text-[10px] text-[#C4B7B0] py-6">
                          ว่าง
                        </div>
                      ) : (
                        dayTasks.map((t) => {
                          const colorStyle = DEPT_COLORS[t.department] || {
                            bg: "bg-[#FAF7F5]",
                            text: "text-[#5C4F4D]",
                            border: "border-[#E8DFD8]",
                          };
                          const done = isCompletedOnDate(t, day.dateStr);

                          return (
                            <div
                              key={t.id}
                              className={`p-1.5 rounded-lg border text-[10px] leading-tight transition-all ${colorStyle.bg} ${colorStyle.border} ${
                                done ? "line-through opacity-50" : ""
                              }`}
                            >
                              <p className={`font-semibold ${colorStyle.text} line-clamp-2`}>
                                {t.task}
                              </p>
                              {t.repeatType === "daily" && (
                                <span className="text-[8px] bg-white/70 px-1 py-0.2 rounded font-bold text-[#8C5E48] mt-1 inline-block">
                                  🔁 ทุกวัน
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* คอลัมน์ขวา: รายละเอียดงานประจำวันที่คลิกเลือก */}
        <section className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-[#E8DFD8] flex flex-col">
          <div className="pb-3 border-b border-[#F7F2EE] mb-4">
            <span className="text-[11px] font-semibold text-[#8C7A78] uppercase tracking-wider block">
              รายละเอียดงานในวัน
            </span>
            <h3 className="text-base font-bold text-[#3A2D28] mt-0.5 flex items-center gap-2">
              <span>📅</span>
              <span>{selectedDateStr}</span>
            </h3>
            <p className="text-xs text-[#8C7A78] mt-0.5">
              มีกำหนดการ {selectedDateTasks.length} รายการ
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#8C7A78] bg-[#FCFAF8] rounded-xl border border-dashed border-[#E8DFD8]">
                ไม่มีงานหรือกำหนดการในวันที่ {selectedDateStr}
              </div>
            ) : (
              selectedDateTasks.map((item) => {
                const done = isCompletedOnDate(item, selectedDateStr);
                const colorStyle = DEPT_COLORS[item.department] || {
                  bg: "bg-[#FAF7F5]",
                  text: "text-[#7A635A]",
                  border: "border-[#E8DFD8]",
                };

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      done
                        ? "bg-[#FAF7F5]/50 border-[#EFE8E2] opacity-60"
                        : "bg-[#FCFAF8] border-[#E8DFD8] shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => handleToggleTaskOnDate(item.id, selectedDateStr)}
                        className="w-4 h-4 mt-0.5 rounded text-[#8C5E48] accent-[#8C5E48] cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold leading-snug ${
                            done ? "line-through text-[#8C7A78]" : "text-[#3A2D28]"
                          }`}
                        >
                          {item.task}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[9px] border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}
                          >
                            🏷️ {item.department}
                          </span>

                          {item.repeatType === "daily" && (
                            <span className="bg-[#FAF0E6] text-[#8C5E48] text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                              🔁 ทุกวัน
                            </span>
                          )}

                          {item.repeatType === "weekly_days" && (
                            <span className="bg-[#FAF0E6] text-[#8C5E48] text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                              🔁 ประจำสัปดาห์
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-[#8C7A78] mt-1.5">
                          ช่วงเวลา: {item.startDate} {item.startDate !== item.dueDate ? `→ ${item.dueDate}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-[#F7F2EE] mt-4">
            <Link
              href="/dashboard"
              className="w-full bg-[#8C5E48] hover:bg-[#734A36] text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>+ ไปจัดการ/เพิ่มงานที่ Task Dashboard</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}