export type Language = "th" | "en";

export const translations = {
  th: {
    // Auth & Navigation
    brandSubTitleRegister: "ลงทะเบียนขอใช้งานระบบ",
    brandSubTitleSignIn: "เข้าสู่ระบบ (Sign In)",
    brandSubTitleForgot: "รีเซ็ตรหัสผ่าน (Reset Password)",
    fullNameLabel: "ชื่อ - นามสกุล:",
    fullNamePlaceholder: "สมชาย ใจดี",
    emailLabel: "อีเมล:",
    emailPlaceholder: "example@relate.co",
    passwordLabel: "รหัสผ่าน:",
    confirmPasswordLabel: "ยืนยันรหัสผ่านอีกครั้ง:",
    forgotPasswordLink: "ลืมรหัสผ่าน?",
    btnProcessing: "กำลังดำเนินการ...",
    btnRegister: "ลงทะเบียนขอใช้งาน",
    btnResetLink: "ส่งลิงก์รีเซ็ตรหัสผ่าน",
    btnSignIn: "เข้าสู่ระบบ",
    btnGoRegister: "ยังไม่มีบัญชี? สมัครขอเปิดใช้งาน",
    btnGoSignIn: "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ",
    btnBackSignIn: "กลับไปหน้าเข้าสู่ระบบ",
    
    // Messages
    alertRegisterSuccess: "ลงทะเบียนเรียบร้อยแล้ว กรุณารอการอนุมัติจาก Admin ก่อนเข้าสู่ระบบ",
    alertPasswordMismatch: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
    alertPasswordLength: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
    alertResetSent: "ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมาย",
    errorAccountRejected: "บัญชีของคุณไม่ได้รับการอนุมัติให้เข้าใช้งานระบบ",
    errorGeneric: "เกิดข้อผิดพลาดในการทำรายการ",
  },
  en: {
    // Auth & Navigation
    brandSubTitleRegister: "Register for Workspace",
    brandSubTitleSignIn: "Sign In to System",
    brandSubTitleForgot: "Reset Password",
    fullNameLabel: "Full Name:",
    fullNamePlaceholder: "John Doe",
    emailLabel: "Email:",
    emailPlaceholder: "example@relate.co",
    passwordLabel: "Password:",
    confirmPasswordLabel: "Confirm Password:",
    forgotPasswordLink: "Forgot Password?",
    btnProcessing: "Processing...",
    btnRegister: "Register",
    btnResetLink: "Send Reset Link",
    btnSignIn: "Sign In",
    btnGoRegister: "Don't have an account? Sign Up",
    btnGoSignIn: "Already have an account? Sign In",
    btnBackSignIn: "Back to Sign In",

    // Messages
    alertRegisterSuccess: "Registration successful. Please wait for Admin approval before signing in.",
    alertPasswordMismatch: "Passwords do not match.",
    alertPasswordLength: "Password must be at least 6 characters long.",
    alertResetSent: "A password reset link has been sent to your email. Please check your inbox.",
    errorAccountRejected: "Your account has not been approved to access the workspace.",
    errorGeneric: "An error occurred while processing your request.",
  },
};