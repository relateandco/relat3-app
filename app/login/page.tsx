"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabaseClient";
import { translations, Language } from "../../utils/translations";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // ภาษา: 'th' หรือ 'en'
  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  // โหมดหน้าจอ: 'signin' | 'register' | 'forgot'
  const [mode, setMode] = useState<"signin" | "register" | "forgot">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // สถานะเปิด-ปิดดูรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error(t.alertPasswordMismatch);
        }
        if (password.length < 6) {
          throw new Error(t.alertPasswordLength);
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        alert(t.alertRegisterSuccess);
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
      } else if (mode === "forgot") {
        const redirectUrl = typeof window !== "undefined" 
          ? `${window.location.origin}/reset-password`
          : undefined;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });

        if (error) throw error;

        setSuccessMsg(t.alertResetSent);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("status, role")
          .eq("id", data.user.id)
          .single();

        if (profileErr) throw profileErr;

        if (profile.status === "pending") {
          router.push("/pending-approval");
        } else if (profile.status === "rejected") {
          setErrorMsg(t.errorAccountRejected);
          await supabase.auth.signOut();
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-[#4A3E3D] relative">
      <div className="bg-white p-8 rounded-3xl border border-[#E8DFD8] shadow-sm max-w-md w-full relative">
        {/* ปุ่มสลับภาษา TH / EN */}
        <div className="absolute top-6 right-6 flex items-center bg-[#FAF7F5] border border-[#E8DFD8] rounded-xl p-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setLang("th")}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              lang === "th" ? "bg-white text-[#8C5E48] shadow-2xs" : "text-[#8C7A78] hover:text-[#5C4F4D]"
            }`}
          >
            🇹🇭 TH
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              lang === "en" ? "bg-white text-[#8C5E48] shadow-2xs" : "text-[#8C7A78] hover:text-[#5C4F4D]"
            }`}
          >
            🇬🇧 EN
          </button>
        </div>

        <div className="text-center mb-6 mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#3A2D28]">Relate & Co.</h1>
          <p className="text-xs text-[#8C7A78] uppercase tracking-widest font-medium mt-1">
            {mode === "register"
              ? t.brandSubTitleRegister
              : mode === "forgot"
              ? t.brandSubTitleForgot
              : t.brandSubTitleSignIn}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-xs text-green-700 font-medium">
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs font-semibold text-[#8C7A78] block mb-1">
                {t.fullNameLabel}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.fullNamePlaceholder}
                className="w-full bg-[#FAF7F5] border border-[#E8DFD8] rounded-xl px-3.5 py-2.5 text-xs text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#8C7A78] block mb-1">
              {t.emailLabel}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full bg-[#FAF7F5] border border-[#E8DFD8] rounded-xl px-3.5 py-2.5 text-xs text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
            />
          </div>

          {/* ช่องรหัสผ่าน พร้อมปุ่มดูรหัสผ่าน */}
          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#8C7A78]">
                  {t.passwordLabel}
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-[11px] text-[#8C5E48] hover:underline cursor-pointer"
                  >
                    {t.forgotPasswordLink}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF7F5] border border-[#E8DFD8] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8C7A78] hover:text-[#5C4F4D] cursor-pointer select-none transition-all"
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {/* ช่องยืนยันรหัสผ่าน พร้อมปุ่มดูรหัสผ่าน */}
          {mode === "register" && (
            <div>
              <label className="text-xs font-semibold text-[#8C7A78] block mb-1">
                {t.confirmPasswordLabel}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF7F5] border border-[#E8DFD8] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-[#5C4F4D] focus:outline-none focus:ring-1 focus:ring-[#8C5E48]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8C7A78] hover:text-[#5C4F4D] cursor-pointer select-none transition-all"
                  title={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8C5E48] hover:bg-[#734A36] text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading
              ? t.btnProcessing
              : mode === "register"
              ? t.btnRegister
              : mode === "forgot"
              ? t.btnResetLink
              : t.btnSignIn}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#F7F2EE] text-center space-y-2">
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-xs text-[#8C5E48] hover:underline font-semibold cursor-pointer block w-full"
            >
              {t.btnGoRegister}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-xs text-[#8C5E48] hover:underline font-semibold cursor-pointer block w-full"
            >
              {t.btnBackSignIn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}