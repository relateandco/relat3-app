"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabaseClient";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!myProfile || myProfile.role !== "admin") {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin เท่านั้น)");
      router.push("/");
      return;
    }

    setIsAdmin(true);
    await fetchProfiles();
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProfiles(data);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("อัปเดตไม่สำเร็จ: " + error.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-[#8C7A78]">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-10 text-[#4A3E3D]">
      <header className="max-w-4xl mx-auto flex items-center justify-between border-b border-[#E8DFD8] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#3A2D28]">Admin Management</h1>
          <p className="text-xs text-[#8C7A78] uppercase tracking-widest font-medium mt-0.5">
            ระบบอนุมัติผู้ใช้งาน Relate & Co.
          </p>
        </div>
        <Link
          href="/"
          className="bg-white hover:bg-[#FAF7F5] border border-[#E8DFD8] text-[#5C4F4D] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all"
        >
          กลับหน้าหลัก
        </Link>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DFD8]">
          <h2 className="text-sm font-bold text-[#3A2D28] mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8C5E48]"></span>
            รายชื่อผู้ใช้ที่ลงทะเบียน ({profiles.length} คน)
          </h2>

          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#E8DFD8] bg-[#FCFAF8] gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#3A2D28]">{profile.full_name || "ไม่มีชื่อ"}</span>
                    <span className="text-[10px] bg-[#F4ECE6] text-[#7A635A] px-2 py-0.5 rounded-md font-medium">
                      🏷️ {profile.department}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      profile.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : profile.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {profile.status === "approved" ? "อนุมัติแล้ว" : profile.status === "rejected" ? "ปฏิเสธ" : "รออนุมัติ"}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C7A78] mt-1">{profile.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {profile.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(profile.id, "approved")}
                      className="bg-[#3F734F] hover:bg-[#325C3E] text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                    >
                      ✓ อนุมัติ (Approve)
                    </button>
                  )}
                  {profile.status !== "rejected" && profile.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(profile.id, "rejected")}
                      className="bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                    >
                      ✕ ปฏิเสธ (Reject)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}