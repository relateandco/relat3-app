"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabaseClient";

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-[#4A3E3D]">
      <div className="bg-white p-8 rounded-3xl border border-[#E8DFD8] shadow-sm max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-[#FFF9F5] border border-[#E8DFD8] text-[#8C5E48] text-2xl flex items-center justify-center rounded-2xl mx-auto">
          ⏳
        </div>
        <h1 className="text-xl font-bold text-[#3A2D28]">อยู่ระหว่างรอการอนุมัติ</h1>
        <p className="text-xs text-[#8C7A78] leading-relaxed">
          บัญชีของคุณได้รับการลงทะเบียนเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบ (Admin) ตรวจสอบและกดอนุมัติสิทธิ์การเข้าใช้งาน
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="bg-[#FAF7F5] hover:bg-[#EFE8E2] border border-[#E8DFD8] text-[#5C4F4D] px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}