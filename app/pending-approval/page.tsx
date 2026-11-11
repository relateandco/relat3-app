"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabaseClient";

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState<string>("");
  const [checking, setChecking] = useState<boolean>(false);

  // ตรวจสอบข้อมูลผู้ใช้เบื้องต้น
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUserEmail(session.user.email || "");

      // ตรวจสอบว่าถ้าได้รับการอนุมัติแล้ว ให้ส่งเข้าหน้าหลักทันที
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", session.user.id)
        .single();

      if (profile && profile.status === "approved") {
        router.push("/");
      }
    };

    fetchUser();
  }, [router, supabase]);

  // ฟังก์ชันกดตรวจสอบสถานะใหม่ (ไม่ต้องล็อกอินใหม่ถ้า Admin อนุมัติแล้ว)
  const handleCheckStatus = async () => {
    setChecking(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", session.user.id)
      .single();

    if (profile && profile.status === "approved") {
      router.push("/");
    } else {
      alert("บัญชียังอยู่ระหว่างรอการอนุมัติจาก Admin กรุณารอสักครู่ครับ");
    }
    setChecking(false);
  };

  // ฟังก์ชันออกจากระบบ
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-[#4A3E3D] font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#E8DFD8] shadow-sm text-center space-y-6">
        
        {/* หัวข้อแบรนด์ */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#3A2D28]">Relate & Co.</h1>
          <p className="text-[11px] text-[#8C7A78] uppercase tracking-widest font-semibold mt-0.5">
            Meeting Planner
          </p>
        </div>

        {/* ไอคอนแจ้งเตือนสถานะ */}
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF7F5] border border-[#E8DFD8] flex items-center justify-center text-3xl shadow-2xs">
          ⏳
        </div>

        {/* ข้อความแจ้งเตือน */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-[#3A2D28]">
            อยู่ระหว่างรอการอนุมัติสิทธิ์ใช้งาน
          </h2>
          <p className="text-xs text-[#8C7A78] leading-relaxed">
            บัญชีของคุณได้รับการลงทะเบียนเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบ (Admin) ตรวจสอบและอนุมัติการเข้าถึง Workspace
          </p>
          {userEmail && (
            <div className="pt-2">
              <span className="inline-block bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] text-xs px-3 py-1 rounded-xl font-medium">
                อีเมล: {userEmail}
              </span>
            </div>
          )}
        </div>

        {/* ปุ่มการทำงาน */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-[#8C5E48] hover:bg-[#734A36] disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {checking ? "กำลังตรวจสอบสถานะ..." : "🔄 ตรวจสอบสถานะการอนุมัติอีกครั้ง"}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full bg-[#FAF7F5] hover:bg-red-50 border border-[#E8DFD8] hover:border-red-200 text-[#8C7A78] hover:text-red-600 rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer"
          >
            ออกจากระบบ (Sign Out)
          </button>
        </div>

        {/* ส่วนช่วยเหลือ */}
        <div className="pt-4 border-t border-[#FAF7F5]">
          <p className="text-[11px] text-[#A89895]">
            หากต้องการเข้าใช้งานด่วน กรุณาติดต่อผู้ดูแลระบบของ Relate & Co.
          </p>
        </div>

      </div>
    </div>
  );
}