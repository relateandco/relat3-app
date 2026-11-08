"use client";

import React, { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// โครงสร้างบันทึกการประชุม
interface MeetingRecord {
  id: string;
  department: string;
  date: string;
  title: string;
  content: string;
}

// โครงสร้าง Key Date / Timeline รองรับวันเริ่มและวันสิ้นสุด
interface ActionItem {
  id: string;
  task: string;
  department: string;
  startDate: string; // วันที่เริ่ม
  dueDate: string;   // วันที่สิ้นสุด
  completed: boolean;
}

interface CandidateTask {
  id: string;
  task: string;
  startDate: string;
  dueDate: string;
  selected: boolean;
}

const DEFAULT_DEPARTMENTS = [
  "Management & Strategy",
  "Marketing & Content",
  "Design & Branding",
  "Tech & Development",
  "Operations & Admin",
];

export default function HomePreview() {
  const [meetingMode, setMeetingMode] = useState<"in-person" | "online" | "upload">("in-person");
  const [language, setLanguage] = useState<"th-TH" | "en-US">("th-TH");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [recordDate, setRecordDate] = useState("2026-11-08");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // ระบบแผนก
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(DEFAULT_DEPARTMENTS[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState("");

  // กล่องบันทึกการประชุมย้อนหลัง
  const [meetingRecords, setMeetingRecords] = useState<MeetingRecord[]>([
    {
      id: "note-1",
      department: "Management & Strategy",
      date: "2026-11-08",
      title: "การประชุมแผนก Management & Strategy",
      content:
        "ประชุมทุกวันอังคารต่อไปนี้ จะแชร์เรื่องราวที่เกิดขึ้นกับหน้าร้าน ส่วนเรื่อง Action plan จะให้ Area ของตนเองเป็นคน Review แทน\nไม่นำกล่องมาวางหน้าร้าน หรือโซนเคาน์เตอร์ ทุกกรณี",
    },
    {
      id: "note-2",
      department: "Marketing & Content",
      date: "2026-11-08",
      title: "วางแผนแคมเปญเดือน พ.ย.",
      content: "Fan Meeting 17-30 Nov 2026\nRun FF หมดโปรวันที่ 15 Nov 2026",
    },
  ]);

  // ตัวกรองประวัติการประชุม
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("ALL");

  // State สำหรับดูบันทึกฉบับเต็ม
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);
  const [viewingRecordModal, setViewingRecordModal] = useState<MeetingRecord | null>(null);

  // Modal คัดกรอง
  const [activeRecordForExtract, setActiveRecordForExtract] = useState<MeetingRecord | null>(null);
  const [candidateTasks, setCandidateTasks] = useState<CandidateTask[]>([]);

  // กำหนดการและสิ่งที่ต้องติดตาม (Key Dates & Follow-ups)
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    {
      id: "1",
      task: "Fan Meeting แคมเปญหน้าร้าน",
      department: "Marketing & Content",
      startDate: "2026-11-17",
      dueDate: "2026-11-30",
      completed: false,
    },
    {
      id: "2",
      task: "RFF: Extend 15th Nov 2026",
      department: "Management & Strategy",
      startDate: "2026-11-08",
      dueDate: "2026-11-15",
      completed: true,
    },
  ]);

  // ตัวกรองสำหรับกำหนดการ
  const [actionItemFilterDate, setActionItemFilterDate] = useState<string>("");

  // ฟอร์มเพิ่มกำหนดการเอง
  const [newTask, setNewTask] = useState("");
  const [newStartDate, setNewStartDate] = useState("2026-11-08");
  const [newDueDate, setNewDueDate] = useState("2026-11-15");

  // การ์ดสรุปภาพรวม (Executive Brief)
  const [summaryTargetDate, setSummaryTargetDate] = useState<string>("2026-11-08");
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
  const [editableSummaryText, setEditableSummaryText] = useState("");

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const baseTranscriptRef = useRef<string>("");

  useEffect(() => {
    const savedDepts = localStorage.getItem("relat3_departments");
    if (savedDepts) {
      try {
        const parsed = JSON.parse(savedDepts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDepartments(parsed);
          setSelectedDepartment(parsed[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const savedRecords = localStorage.getItem("relat3_meeting_records");
    if (savedRecords) {
      try {
        setMeetingRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error(e);
      }
    }

    const savedTasks = localStorage.getItem("relat3_tasks");
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        // แปลงรูปแบบข้อมูลเก่าให้มี startDate
        const updated = parsed.map((item: any) => ({
          ...item,
          startDate: item.startDate || item.dueDate || "2026-11-08",
        }));
        setActionItems(updated);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveDepartments = (newDepts: string[]) => {
    setDepartments(newDepts);
    localStorage.setItem("relat3_departments", JSON.stringify(newDepts));
    if (!newDepts.includes(selectedDepartment) && newDepts.length > 0) {
      setSelectedDepartment(newDepts[0]);
    }
  };

  const saveMeetingRecords = (records: MeetingRecord[]) => {
    setMeetingRecords(records);
    localStorage.setItem("relat3_meeting_records", JSON.stringify(records));
  };

  const saveTasks = (tasks: ActionItem[]) => {
    setActionItems(tasks);
    localStorage.setItem("relat3_tasks", JSON.stringify(tasks));
  };

  const handleAddDepartment = () => {
    const trimmed = newDeptInput.trim();
    if (!trimmed) return;
    if (departments.includes(trimmed)) {
      alert("มีแผนกนี้อยู่ในระบบแล้ว");
      return;
    }
    const updated = [...departments, trimmed];
    saveDepartments(updated);
    setNewDeptInput("");
  };

  const handleDeleteDepartment = (dept: string) => {
    if (departments.length <= 1) {
      alert("ต้องมีอย่างน้อย 1 แผนก");
      return;
    }
    const updated = departments.filter((d) => d !== dept);
    saveDepartments(updated);
  };

  const toggleExpandRecord = (id: string) => {
    setExpandedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveToMeetingRecord = () => {
    if (!transcript.trim()) {
      alert("กรุณาพูดหรือพิมพ์ข้อความการประชุมก่อนบันทึกครับ");
      return;
    }

    const newRecord: MeetingRecord = {
      id: Date.now().toString(),
      department: selectedDepartment,
      date: recordDate || "2026-11-08",
      title: meetingTitle.trim() || `การประชุมแผนก ${selectedDepartment}`,
      content: transcript.trim(),
    };

    saveMeetingRecords([newRecord, ...meetingRecords]);
    setTranscript("");
    setMeetingTitle("");
    baseTranscriptRef.current = "";
    alert(`บันทึกการประชุมวันที่ ${newRecord.date} เรียบร้อยแล้ว!`);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("ต้องการลบบันทึกการประชุมนี้ใช่หรือไม่?")) {
      const updated = meetingRecords.filter((r) => r.id !== id);
      saveMeetingRecords(updated);
    }
  };

  const filteredRecords = meetingRecords.filter((record) => {
    const matchDate = filterDate ? record.date === filterDate : true;
    const matchDept = filterDept === "ALL" ? true : record.department === filterDept;
    return matchDate && matchDept;
  });

  // แยกวิเคราะห์และค้นหาวันที่เริ่ม - สิ้นสุดอัตโนมัติ
  const handleOpenExtractFromRecord = (record: MeetingRecord) => {
    setActiveRecordForExtract(record);

    const lines = record.content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const candidates: CandidateTask[] = lines.map((line, idx) => {
      let detectedStart = record.date || "2026-11-08";
      let detectedEnd = record.date || "2026-11-15";

      if (line.includes("17-30")) {
        detectedStart = "2026-11-17";
        detectedEnd = "2026-11-30";
      } else if (line.includes("15 Nov") || line.includes("15th")) {
        detectedStart = record.date || "2026-11-08";
        detectedEnd = "2026-11-15";
      } else if (line.includes("17 Nov")) {
        detectedStart = record.date || "2026-11-08";
        detectedEnd = "2026-11-17";
      }

      return {
        id: `${record.id}-${idx}`,
        task: line,
        startDate: detectedStart,
        dueDate: detectedEnd,
        selected: false,
      };
    });

    setCandidateTasks(candidates);
  };

  const handleConfirmCandidateTasks = () => {
    const selectedList = candidateTasks.filter((c) => c.selected && c.task.trim());
    if (selectedList.length === 0) {
      alert("กรุณาติ๊กเลือกอย่างน้อย 1 รายการเพื่อส่งต่อไปยังกำหนดการครับ");
      return;
    }

    const newItems: ActionItem[] = selectedList.map((c) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      task: c.task,
      department: activeRecordForExtract?.department || selectedDepartment,
      startDate: c.startDate || c.dueDate,
      dueDate: c.dueDate,
      completed: false,
    }));

    saveTasks([...newItems, ...actionItems]);
    setActiveRecordForExtract(null);
    alert(`คัดกรองและส่งต่อไปยังกำหนดการเรียบร้อย ${newItems.length} รายการ!`);
  };

  const handleToggleTask = (id: string) => {
    const updated = actionItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = actionItems.filter((item) => item.id !== id);
    saveTasks(updated);
  };

  const handleUpdateDates = (id: string, field: "startDate" | "dueDate", newDate: string) => {
    const updated = actionItems.map((item) =>
      item.id === id ? { ...item, [field]: newDate } : item
    );
    saveTasks(updated);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const newItem: ActionItem = {
      id: Date.now().toString(),
      task: newTask.trim(),
      department: selectedDepartment,
      startDate: newStartDate || newDueDate || "2026-11-08",
      dueDate: newDueDate || newStartDate || "2026-11-15",
      completed: false,
    };

    saveTasks([newItem, ...actionItems]);
    setNewTask("");
  };

  // ส่งช่วงวันที่เข้า Google Calendar
  const handleSyncGoogleCalendar = (item: ActionItem) => {
    const title = encodeURIComponent(`[${item.department}] ${item.task}`);
    const details = encodeURIComponent(
      `ข้อมูลจากการประชุม Relate & Co.\nแผนก: ${item.department}\nระยะเวลา: ${item.startDate} ถึง ${item.dueDate}`
    );

    const startFormatted = item.startDate ? item.startDate.replace(/-/g, "") : item.dueDate.replace(/-/g, "");

    // สำหรับวันสิ้นสุด ให้ +1 วันเพื่อให้ Google Calendar ครอบคลุมทั้งวันสุดท้าย
    const endDateObj = new Date(item.dueDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endFormatted = endDateObj.toISOString().slice(0, 10).replace(/-/g, "");

    const dates = `${startFormatted}/${endFormatted}`;
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
    window.open(calendarUrl, "_blank");
  };

  // สร้างข้อความสรุปภาพรวม
  const buildSummaryString = (targetDate: string) => {
    const targetDateLabel = targetDate ? `ประจำวันที่: ${targetDate}` : "ทั้งหมดทุกวัน";
    let text = `📌 [Relate & Co.] สรุปภาพรวมการประชุมรวมทุกแผนก\n📅 ${targetDateLabel}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const targetRecords = targetDate
      ? meetingRecords.filter((r) => r.date === targetDate)
      : meetingRecords;

    text += `📝 1. ประเด็นการประชุมตามแผนก:\n`;
    if (targetRecords.length === 0) {
      text += `   (ไม่พบประวัติการประชุมในวันที่เลือก)\n\n`;
    } else {
      const groupedByDept: { [key: string]: MeetingRecord[] } = {};
      targetRecords.forEach((r) => {
        if (!groupedByDept[r.department]) groupedByDept[r.department] = [];
        groupedByDept[r.department].push(r);
      });

      Object.keys(groupedByDept).forEach((dept) => {
        text += `\n🏷️ [แผนก: ${dept}]\n`;
        groupedByDept[dept].forEach((rec) => {
          text += `  • เรื่อง: ${rec.title}\n`;
          const contentLines = rec.content.split("\n");
          contentLines.forEach((line) => {
            if (line.trim()) text += `    - ${line.trim()}\n`;
          });
        });
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🎯 2. กำหนดการและช่วงเวลาสำคัญ (Key Dates & Timelines):\n`;

    const targetActionItems = targetDate
      ? actionItems.filter((item) => item.startDate === targetDate || item.dueDate === targetDate)
      : actionItems;

    if (targetActionItems.length === 0) {
      text += `   (ไม่มีกำหนดการสำคัญในรอบนี้)\n`;
    } else {
      targetActionItems.forEach((item, idx) => {
        const status = item.completed ? "[เรียบร้อย ✔]" : "[รอติดตาม ⏳]";
        const dateRangeText =
          item.startDate === item.dueDate
            ? item.dueDate
            : `${item.startDate} ถึง ${item.dueDate}`;
        text += `${idx + 1}. ${item.task}\n`;
        text += `   └ แผนก: ${item.department} | ระยะเวลา: ${dateRangeText} ${status}\n`;
      });
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━━\nGenerated by Relate & Co. Meeting Planner`;
    return text;
  };

  useEffect(() => {
    setEditableSummaryText(buildSummaryString(summaryTargetDate));
  }, [summaryTargetDate, meetingRecords, actionItems]);

  const handleCopyShareableSummary = () => {
    if (!editableSummaryText.trim()) {
      alert("ไม่มีข้อความให้คัดลอกครับ");
      return;
    }
    navigator.clipboard.writeText(editableSummaryText);
    alert("คัดลอกข้อความสรุปการประชุมเรียบร้อยแล้ว! สามารถนำไปวางแชร์ได้ทันทีครับ");
  };

  const displayedActionItems = actionItemFilterDate
    ? actionItems.filter(
        (i) => i.startDate === actionItemFilterDate || i.dueDate === actionItemFilterDate
      )
    : actionItems;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
          let currentSpoken = "";
          for (let i = 0; i < event.results.length; i++) {
            currentSpoken += event.results[i][0].transcript;
          }
          const prefix = baseTranscriptRef.current ? baseTranscriptRef.current + " " : "";
          setTranscript(prefix + currentSpoken);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech error:", event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const toggleInPersonRecording = () => {
    if (!recognitionRef.current) {
      alert("กรุณาเปิดผ่าน Google Chrome เพื่อใช้งานระบบบันทึกเสียง");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      baseTranscriptRef.current = transcript;
    } else {
      try {
        baseTranscriptRef.current = transcript;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleOnlineMeetingRecording = async () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      baseTranscriptRef.current = transcript;
      return;
    }

    try {
      baseTranscriptRef.current = transcript;
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const audioCtx = new AudioContext();
      const micSource = audioCtx.createMediaStreamSource(micStream);
      const displaySource = audioCtx.createMediaStreamSource(displayStream);
      const destination = audioCtx.createMediaStreamDestination();

      micSource.connect(destination);
      displaySource.connect(destination);

      mediaStreamRef.current = destination.stream;

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      setIsRecording(true);

      displayStream.getVideoTracks()[0].onended = () => {
        toggleOnlineMeetingRecording();
      };
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const addedText = `[ไฟล์: ${file.name} - แผนก ${selectedDepartment}]\n`;
      setTranscript((prev) => (prev ? prev + "\n" + addedText : addedText));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-10 text-[#4A3E3D]">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex items-center justify-between border-b border-[#E8DFD8] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#3A2D28]">Relate & Co.</h1>
          <p className="text-xs text-[#8C7A78] uppercase tracking-widest font-medium mt-0.5">Meeting Planner</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#F4ECE6] px-4 py-1.5 rounded-full text-xs font-semibold text-[#7A635A]">
            08/11/2026
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-white border border-[#E8DFD8] hover:bg-[#FAF7F5] text-[#5C4F4D] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 text-xs font-medium"
          >
            <span>⚙️</span>
            <span>ตั้งค่าแผนก</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {/* การ์ดสรุปภาพรวม (Executive Brief) */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#E0D4CA]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F7F2EE]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C5E48]"></span>
                <h2 className="text-base font-bold text-[#3A2D28]">
                  สรุปผลการประชุมภาพรวมทุกแผนก (Executive Brief)
                </h2>
              </div>
              <p className="text-xs text-[#8C7A78] mt-0.5">
                เลือกวันที่เพื่อดูสรุปของวันนั้นๆ และสามารถคลิกพิมพ์แก้ไขข้อความในกล่องด้านล่างได้โดยตรงก่อนกดแชร์
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#FAF7F5] border border-[#EFE8E2] px-2.5 py-1.5 rounded-xl">
                <span className="text-[11px] text-[#8C7A78]">📅 เลือกรอบวันที่:</span>
                <input
                  type="date"
                  value={summaryTargetDate}
                  onChange={(e) => setSummaryTargetDate(e.target.value)}
                  className="text-xs text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer font-medium"
                />
                {summaryTargetDate && (
                  <button
                    type="button"
                    onClick={() => setSummaryTargetDate("")}
                    className="text-[10px] text-[#A89895] hover:text-[#5C4F4D] ml-1 font-bold"
                  >
                    ดูทุกวัน
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyShareableSummary}
                className="bg-[#8C5E48] hover:bg-[#734A36] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>📋</span>
                <span>คัดลอกสรุปไปแชร์ต่อ</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#8C7A78] uppercase tracking-wider flex items-center gap-1">
                ✍️ กล่องข้อความสรุป (คลิกเพื่อแก้ไขคำหรือเพิ่มเติมเนื้อหาได้โดยตรง):
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditableSummaryText(buildSummaryString(summaryTargetDate))}
                  className="text-[11px] text-[#8C7A78] hover:text-[#5C4F4D] hover:underline cursor-pointer"
                  title="รีเซ็ตข้อความกลับเป็นฉบับสร้างอัตโนมัติ"
                >
                  🔄 รีเซ็ตข้อความ
                </button>
                <button
                  type="button"
                  onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                  className="text-[11px] text-[#8C5E48] hover:underline cursor-pointer font-medium"
                >
                  {isSummaryCollapsed ? "▼ แสดงกล่องสรุป" : "▲ ย่อมุมมอง"}
                </button>
              </div>
            </div>

            {!isSummaryCollapsed && (
              <textarea
                value={editableSummaryText}
                onChange={(e) => setEditableSummaryText(e.target.value)}
                rows={9}
                className="w-full bg-[#FAF7F5] rounded-xl p-4 text-xs font-mono text-[#4A3E3D] border border-[#EFE8E2] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#8C5E48] resize-y"
              />
            )}
          </div>
        </section>

        {/* ส่วนที่ 1: บันทึกเสียงและกรอกข้อมูลรายวัน */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFE8E2]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#F7F2EE]">
            <div>
              <h2 className="text-base font-semibold text-[#3A2D28] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B28268]"></span>
                ระบบบันทึกเสียงและถอดความรายวัน
              </h2>
              <p className="text-xs text-[#8C7A78] mt-0.5">บันทึกเนื้อหาการประชุมลงคลังข้อมูลประวัติเพื่อดูย้อนหลัง</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#8C7A78]">แผนก:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={isRecording}
                  className="bg-[#FAF7F5] border border-[#EFE8E2] text-xs font-medium rounded-xl px-3 py-1.5 text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48] disabled:opacity-50 max-w-[180px] truncate"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      🏷️ {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#8C7A78]">วันที่:</span>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="bg-[#FAF7F5] border border-[#EFE8E2] text-xs font-medium rounded-xl px-2.5 py-1.5 text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#8C7A78]">ภาษา:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "th-TH" | "en-US")}
                  disabled={isRecording}
                  className="bg-[#FAF7F5] border border-[#EFE8E2] text-xs font-medium rounded-xl px-3 py-1.5 text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48] disabled:opacity-50"
                >
                  <option value="th-TH">🇹🇭 TH</option>
                  <option value="en-US">🇺🇸 EN</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-[#FAF7F5] p-1.5 rounded-xl border border-[#EFE8E2] mb-6">
            <button
              type="button"
              onClick={() => setMeetingMode("in-person")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                meetingMode === "in-person"
                  ? "bg-white text-[#8C5E48] shadow-sm font-bold"
                  : "text-[#8C7A78] hover:text-[#5C4F4D]"
              }`}
            >
              🎙️ คุยต่อหน้า
            </button>
            <button
              type="button"
              onClick={() => setMeetingMode("online")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                meetingMode === "online"
                  ? "bg-white text-[#8C5E48] shadow-sm font-bold"
                  : "text-[#8C7A78] hover:text-[#5C4F4D]"
              }`}
            >
              🌐 ออนไลน์ (Meet/Teams/Zoom)
            </button>
            <button
              type="button"
              onClick={() => setMeetingMode("upload")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                meetingMode === "upload"
                  ? "bg-white text-[#8C5E48] shadow-sm font-bold"
                  : "text-[#8C7A78] hover:text-[#5C4F4D]"
              }`}
            >
              📁 อัปโหลดไฟล์เสียง
            </button>
          </div>

          {meetingMode === "in-person" && (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E8DFD8] rounded-xl bg-[#FCFAF8] mb-4">
              <p className="text-xs text-[#8C7A78] mb-3 text-center">
                บันทึกการประชุมสำหรับแผนก: <strong className="text-[#5C4F4D]">{selectedDepartment}</strong> (วันที่ {recordDate})
              </p>
              <button
                type="button"
                onClick={toggleInPersonRecording}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "bg-[#8C5E48] hover:bg-[#734A36] text-white shadow-sm"
                }`}
              >
                {isRecording ? "🔴 กำลังบันทึกเสียง... (คลิกเพื่อหยุด)" : "เริ่มบันทึกเสียงไมโครโฟน"}
              </button>
            </div>
          )}

          {meetingMode === "online" && (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E8DFD8] rounded-xl bg-[#FCFAF8] mb-4 text-center">
              <p className="text-xs text-[#8C7A78] mb-1">
                ดึงเสียงจาก Meet/Teams/Discord ร่วมกับไมโครโฟนของคุณ ({selectedDepartment})
              </p>
              <span className="text-[11px] text-[#A89895] mb-3">
                *อย่าลืมติ๊กถูกที่ช่อง <strong>&quot;แชร์เสียงของแท็บ (Share tab audio)&quot;</strong>
              </span>
              <button
                type="button"
                onClick={toggleOnlineMeetingRecording}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "bg-[#8C5E48] hover:bg-[#734A36] text-white shadow-sm"
                }`}
              >
                {isRecording ? "🔴 กำลังบันทึกออนไลน์... (คลิกเพื่อหยุด)" : "แชร์แท็บและเริ่มบันทึกเสียง"}
              </button>
            </div>
          )}

          {meetingMode === "upload" && (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E8DFD8] rounded-xl bg-[#FCFAF8] mb-4 text-center">
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileUpload}
                id="audio-upload"
                className="hidden"
              />
              <label
                htmlFor="audio-upload"
                className="cursor-pointer bg-[#8C5E48] hover:bg-[#734A36] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                เลือกไฟล์เสียงประชุม (.mp3, .m4a, .wav)
              </label>
              {uploadedFile && (
                <p className="text-xs text-[#5C4F4D] mt-2 font-medium">
                  ไฟล์ที่เลือก: {uploadedFile.name}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              placeholder="หัวข้อการประชุม (เช่น วางแผนแคมเปญเดือน พ.ย., สรุปผลยอดขายรายสัปดาห์)..."
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full bg-[#FAF7F5] rounded-xl px-4 py-2.5 text-xs text-[#5C4F4D] border border-[#EFE8E2] focus:outline-none focus:ring-1 focus:ring-[#8C5E48] font-medium"
            />

            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                baseTranscriptRef.current = e.target.value;
              }}
              placeholder={`พิมพ์หรือพูดเนื้อหาการประชุมที่นี่ (ขึ้นบรรทัดใหม่เมื่อขึ้นประเด็นใหม่)...`}
              rows={4}
              className="w-full bg-[#FAF7F5] rounded-xl p-4 text-sm text-[#5C4F4D] border border-[#EFE8E2] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#8C5E48] resize-y"
            />

            <div className="flex items-center justify-between pt-1">
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript("");
                    setMeetingTitle("");
                    baseTranscriptRef.current = "";
                  }}
                  className="text-xs text-[#C45E5E] hover:underline cursor-pointer"
                >
                  ล้างข้อความ
                </button>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleSaveToMeetingRecord}
                  disabled={!transcript.trim()}
                  className="bg-[#8C5E48] hover:bg-[#734A36] disabled:opacity-50 text-white text-xs px-5 py-2.5 rounded-xl font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>💾</span> บันทึกเก็บเป็นประวัติการประชุม (วันที่ {recordDate})
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ส่วนที่ 2: คลังบันทึกการประชุมรายวัน (Archive & Date Filter) */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFE8E2]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#F7F2EE]">
            <div>
              <h2 className="text-base font-semibold text-[#3A2D28] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B28268]"></span>
                คลังบันทึกการประชุมรายวัน (ค้นหาย้อนหลัง)
              </h2>
              <p className="text-xs text-[#8C7A78] mt-0.5">
                เลือกวันที่หรือแผนกเพื่อค้นหาประวัติการประชุมย้อนหลัง และคัดกรองงานไปที่กำหนดการ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#FAF7F5] border border-[#EFE8E2] px-2.5 py-1.5 rounded-xl">
                <span className="text-xs text-[#8C7A78]">📅 เลือกวันที่:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="text-xs text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer"
                />
                {filterDate && (
                  <button
                    type="button"
                    onClick={() => setFilterDate("")}
                    className="text-[10px] text-[#A89895] hover:text-[#5C4F4D] ml-1 font-bold"
                    title="ล้างตัวกรองวันที่"
                  >
                    ✕ ดูทั้งหมด
                  </button>
                )}
              </div>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-[#FAF7F5] border border-[#EFE8E2] text-xs font-medium rounded-xl px-2.5 py-1.5 text-[#5C4F4D] focus:outline-none"
              >
                <option value="ALL">ทุกแผนก</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-xs text-[#8C7A78] bg-[#FAF7F5] p-6 rounded-xl border border-[#EFE8E2] text-center">
                ไม่พบประวัติการประชุม{filterDate ? ` ของวันที่ ${filterDate}` : ""}{filterDept !== "ALL" ? ` ในแผนก ${filterDept}` : ""}
              </div>
            ) : (
              filteredRecords.map((record) => {
                const isExpanded = expandedRecordIds.includes(record.id);
                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl border border-[#E8DFD8] bg-[#FCFAF8] shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-[#F4ECE6] text-[#7A635A] px-2 py-0.5 rounded-md font-medium text-[10px]">
                          🏷️ {record.department}
                        </span>
                        <span className="text-[11px] font-semibold text-[#8C5E48]">
                          📅 ประชุมวันที่: {record.date}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-[#3A2D28] mb-1.5">{record.title}</h3>

                      <div className="bg-white/90 p-3 rounded-lg border border-[#EFE8E2]">
                        <p
                          className={`text-xs text-[#5C4F4D] whitespace-pre-wrap leading-relaxed ${
                            isExpanded ? "" : "line-clamp-2"
                          }`}
                        >
                          {record.content}
                        </p>

                        <div className="flex items-center gap-3 mt-2 pt-1 border-t border-[#F7F2EE]">
                          <button
                            type="button"
                            onClick={() => toggleExpandRecord(record.id)}
                            className="text-[11px] font-semibold text-[#8C5E48] hover:text-[#734A36] cursor-pointer flex items-center gap-1"
                          >
                            <span>{isExpanded ? "▲ ย่อข้อความ" : "▼ ดูบันทึกเต็มในการ์ด"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingRecordModal(record)}
                            className="text-[11px] font-medium text-[#8C7A78] hover:text-[#3A2D28] cursor-pointer flex items-center gap-1"
                          >
                            <span>📖</span>
                            <span>เปิดอ่านเต็มจอ</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 sm:pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenExtractFromRecord(record)}
                        className="bg-[#B28268] hover:bg-[#9E6E55] text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>⚡</span> คัดกรองเข้าสู่กำหนดการ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-[#C45E5E] hover:text-red-700 p-2 rounded-lg hover:bg-red-50 text-xs cursor-pointer transition-all"
                        title="ลบบันทึกนี้"
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

        {/* ส่วนที่ 3: กำหนดการและสิ่งที่ต้องติดตาม (Key Dates & Follow-ups) - มีทั้งวันเริ่มและวันสิ้นสุด */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFE8E2]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#F7F2EE]">
            <div>
              <h2 className="text-base font-semibold text-[#3A2D28] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C5E48]"></span>
                กำหนดการและช่วงเวลาสำคัญ (Key Dates &amp; Follow-ups)
              </h2>
              <p className="text-xs text-[#8C7A78] mt-0.5">
                รวบรวมวันเริ่ม-สิ้นสุดโปรโมชัน วันเปิดตัว แคมเปญ และงานที่ต้องติดตาม ({displayedActionItems.length} จาก {actionItems.length} รายการ)
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#FAF7F5] border border-[#EFE8E2] px-2.5 py-1.5 rounded-xl">
              <span className="text-xs text-[#8C7A78]">📅 กรองตามวันที่:</span>
              <input
                type="date"
                value={actionItemFilterDate}
                onChange={(e) => setActionItemFilterDate(e.target.value)}
                className="text-xs text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer"
              />
              {actionItemFilterDate && (
                <button
                  type="button"
                  onClick={() => setActionItemFilterDate("")}
                  className="text-[10px] text-[#A89895] hover:text-[#5C4F4D] ml-1 font-bold"
                  title="ล้างตัวกรอง"
                >
                  ✕ ดูทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* ฟอร์มเพิ่มกำหนดการ (ระบุวันเริ่ม - วันสิ้นสุด) */}
          <form
            onSubmit={handleCreateTask}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-5 bg-[#FAF7F5] p-3 rounded-xl border border-[#EFE8E2]"
          >
            <input
              type="text"
              placeholder="ชื่องาน แคมเปญโปรโมชัน หรือกำหนดการสำคัญ..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="sm:col-span-6 bg-white border border-[#E8DFD8] rounded-xl px-3 py-2 text-xs text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
            />
            <div className="sm:col-span-2 flex items-center gap-1 bg-white border border-[#E8DFD8] rounded-xl px-2 py-1.5">
              <span className="text-[10px] text-[#8C7A78] shrink-0">เริ่ม:</span>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full text-xs text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-1 bg-white border border-[#E8DFD8] rounded-xl px-2 py-1.5">
              <span className="text-[10px] text-[#8C7A78] shrink-0">ถึง:</span>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full text-xs text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer"
              />
            </div>
            <button
              type="submit"
              className="sm:col-span-2 bg-[#8C5E48] hover:bg-[#734A36] text-white rounded-xl text-xs font-semibold py-2 cursor-pointer transition-all"
            >
              + เพิ่มกำหนดการ
            </button>
          </form>

          {/* รายการกำหนดการ พร้อมกล่องเปลี่ยนวันเริ่ม - สิ้นสุด */}
          <div className="space-y-2.5">
            {displayedActionItems.length === 0 ? (
              <div className="text-xs text-[#8C7A78] bg-[#FAF7F5] p-6 rounded-xl border border-[#EFE8E2] text-center">
                ไม่พบรายการกำหนดการ{actionItemFilterDate ? ` ประจำวันที่ ${actionItemFilterDate}` : ""}
              </div>
            ) : (
              displayedActionItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border gap-3 transition-all ${
                    item.completed
                      ? "bg-[#FAF7F5]/60 border-[#EFE8E2] opacity-60"
                      : "bg-[#FCFAF8] border-[#E8DFD8] shadow-xs"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleTask(item.id)}
                      className="w-4 h-4 mt-0.5 sm:mt-0 rounded text-[#8C5E48] focus:ring-0 cursor-pointer accent-[#8C5E48] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium ${
                          item.completed ? "line-through text-[#8C7A78]" : "text-[#3A2D28]"
                        }`}
                      >
                        {item.task}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#8C7A78]">
                        <span className="bg-[#F4ECE6] text-[#7A635A] px-2 py-0.5 rounded-md font-medium text-[10px]">
                          🏷️ {item.department}
                        </span>

                        {/* กล่องเลือกวันเริ่ม - สิ้นสุด */}
                        <div className="flex items-center gap-1.5 bg-white border border-[#E8DFD8] px-2.5 py-1 rounded-md">
                          <span className="text-[10px]">📅 เริ่ม:</span>
                          <input
                            type="date"
                            value={item.startDate}
                            onChange={(e) => handleUpdateDates(item.id, "startDate", e.target.value)}
                            className="text-[11px] text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer font-medium"
                          />
                          <span className="text-[10px] text-[#8C7A78]">→ ถึง:</span>
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => handleUpdateDates(item.id, "dueDate", e.target.value)}
                            className="text-[11px] text-[#5C4F4D] bg-transparent border-0 p-0 focus:outline-none cursor-pointer font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSyncGoogleCalendar(item)}
                      className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                      title="ส่งช่วงเวลานี้เข้า Google Calendar"
                    >
                      <span>📅</span>
                      <span className="text-[11px]">Sync ปฏิทิน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(item.id)}
                      className="text-[#C45E5E] hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 text-xs cursor-pointer transition-all"
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

      {/* 1. Modal เปิดอ่านบันทึกฉบับเต็ม */}
      {viewingRecordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-[#EFE8E2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F7F2EE] mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#F4ECE6] text-[#7A635A] px-2 py-0.5 rounded-md font-medium text-[10px]">
                    🏷️ {viewingRecordModal.department}
                  </span>
                  <span className="text-xs text-[#8C7A78]">
                    📅 ประชุมวันที่: {viewingRecordModal.date}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#3A2D28]">
                  {viewingRecordModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingRecordModal(null)}
                className="text-[#A89895] hover:text-[#5C4F4D] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#FAF7F5] p-4 rounded-xl border border-[#EFE8E2] max-h-96 overflow-y-auto mb-5">
              <p className="text-xs text-[#4A3E3D] whitespace-pre-wrap leading-relaxed">
                {viewingRecordModal.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F7F2EE]">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(viewingRecordModal.content);
                  alert("คัดลอกข้อความบันทึกการประชุมเรียบร้อยแล้ว!");
                }}
                className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>📋</span> คัดลอกข้อความทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setViewingRecordModal(null)}
                className="bg-[#5C4F4D] hover:bg-[#4A3E3D] text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal คัดกรองงานจากบันทึกที่เลือก (มีทั้งวันเริ่มและสิ้นสุด) */}
      {activeRecordForExtract && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#EFE8E2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F7F2EE] mb-4">
              <div>
                <h3 className="text-base font-bold text-[#3A2D28] flex items-center gap-2">
                  <span>⚡</span> คัดกรองกำหนดการและช่วงเวลาสำคัญ
                </h3>
                <p className="text-xs text-[#8C7A78] mt-0.5">
                  จากเรื่อง: <strong>{activeRecordForExtract.title}</strong> (วันที่ {activeRecordForExtract.date} - แผนก {activeRecordForExtract.department})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRecordForExtract(null)}
                className="text-[#A89895] hover:text-[#5C4F4D] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5C4F4D] mb-3">
              ติ๊กถูกเฉพาะหัวข้อหรือโปรโมชันที่ต้องการนำไปติดตามลงในกำหนดการ:
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-5">
              {candidateTasks.map((candidate, idx) => (
                <div
                  key={candidate.id}
                  className={`p-3 rounded-xl border transition-all ${
                    candidate.selected
                      ? "bg-[#FCFAF8] border-[#8C5E48]"
                      : "bg-[#FAF7F5]/50 border-[#EFE8E2] opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <input
                      type="checkbox"
                      checked={candidate.selected}
                      onChange={(e) => {
                        const updated = [...candidateTasks];
                        updated[idx].selected = e.target.checked;
                        setCandidateTasks(updated);
                      }}
                      className="w-4 h-4 mt-1 rounded text-[#8C5E48] focus:ring-0 cursor-pointer accent-[#8C5E48]"
                    />
                    <input
                      type="text"
                      value={candidate.task}
                      onChange={(e) => {
                        const updated = [...candidateTasks];
                        updated[idx].task = e.target.value;
                        setCandidateTasks(updated);
                      }}
                      className="flex-1 text-xs font-medium text-[#3A2D28] bg-white border border-[#E8DFD8] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pl-6">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-[#8C7A78]">เริ่ม:</span>
                      <input
                        type="date"
                        value={candidate.startDate}
                        onChange={(e) => {
                          const updated = [...candidateTasks];
                          updated[idx].startDate = e.target.value;
                          setCandidateTasks(updated);
                        }}
                        className="text-xs text-[#5C4F4D] bg-white border border-[#E8DFD8] rounded-lg px-2 py-1 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-[#8C7A78]">ถึง:</span>
                      <input
                        type="date"
                        value={candidate.dueDate}
                        onChange={(e) => {
                          const updated = [...candidateTasks];
                          updated[idx].dueDate = e.target.value;
                          setCandidateTasks(updated);
                        }}
                        className="text-xs text-[#5C4F4D] bg-white border border-[#E8DFD8] rounded-lg px-2 py-1 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F7F2EE]">
              <span className="text-xs text-[#8C7A78]">
                เลือกไว้ {candidateTasks.filter((c) => c.selected).length} จาก {candidateTasks.length} รายการ
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveRecordForExtract(null)}
                  className="bg-[#FAF7F5] hover:bg-[#EFE8E2] text-[#5C4F4D] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCandidateTasks}
                  className="bg-[#8C5E48] hover:bg-[#734A36] text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-sm"
                >
                  ส่งต่อไปยังกำหนดการ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-[#EFE8E2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F7F2EE] mb-4">
              <h3 className="text-base font-bold text-[#3A2D28] flex items-center gap-2">
                <span>⚙️</span> จัดการรายชื่อแผนก / สายงาน
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#A89895] hover:text-[#5C4F4D] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8C7A78] mb-4">
              เพิ่มหรือลบชื่อแผนกเพื่อให้ตรงกับสายงานของคุณ ข้อมูลจะถูกบันทึกไว้อัตโนมัติ
            </p>

            <div className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder="พิมพ์ชื่อแผนกใหม่..."
                value={newDeptInput}
                onChange={(e) => setNewDeptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDepartment()}
                className="flex-1 bg-[#FAF7F5] border border-[#EFE8E2] rounded-xl px-3.5 py-2 text-xs text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                className="bg-[#8C5E48] hover:bg-[#734A36] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                + เพิ่ม
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-5">
              {departments.map((dept) => (
                <div
                  key={dept}
                  className="flex items-center justify-between bg-[#FAF7F5] px-3.5 py-2.5 rounded-xl border border-[#EFE8E2] text-xs"
                >
                  <span className="font-medium text-[#5C4F4D] truncate pr-2">🏷️ {dept}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDepartment(dept)}
                    className="text-[#C45E5E] hover:text-red-700 cursor-pointer p-1"
                    title="ลบแผนก"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#F7F2EE]">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="bg-[#5C4F4D] hover:bg-[#4A3E3D] text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}