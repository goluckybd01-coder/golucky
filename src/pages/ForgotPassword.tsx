import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Lock, Shield, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = "input" | "otp" | "reset" | "success";

// Validation helpers
const validatePhone = (phone: string): string | null => {
  if (!phone) return null; // Don't show error for empty field initially
  if (phone.length < 10) return "Phone number must be at least 10 digits";
  if (phone.length > 15) return "Phone number is too long";
  if (!/^\d+$/.test(phone)) return "Phone number can only contain digits";
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email) return null; // Don't show error for empty field initially
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  if (email.length > 255) return "Email is too long";
  return null;
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("input");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [countryCode, setCountryCode] = useState("+880");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [touched, setTouched] = useState({ phone: false, email: false });

  // Real-time validation errors
  const phoneError = touched.phone ? validatePhone(phone) : null;
  const emailError = touched.email ? validateEmail(email) : null;

  // Check if form is valid for submission
  const isInputValid = method === "phone" 
    ? phone.length >= 10 && !validatePhone(phone)
    : email.length > 0 && !validateEmail(email);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark fields as touched for validation display
    setTouched({ phone: true, email: true });
    
    if (method === "phone") {
      const error = validatePhone(phone);
      if (!phone || error) {
        toast({ title: "Error", description: error || "Please enter your phone number", variant: "destructive" });
        return;
      }
    }
    if (method === "email") {
      const error = validateEmail(email);
      if (!email || error) {
        toast({ title: "Error", description: error || "Please enter your email", variant: "destructive" });
        return;
      }
    }

    setIsLoading(true);

    if (method === "email") {
      // Real Supabase reset-link email flow
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setIsLoading(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setStep("success");
      toast({
        title: "Reset link sent",
        description: `Check ${email} for a password reset link.`,
      });
      return;
    }

    // Simulate phone OTP flow (unchanged)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setStep("otp");
    startCountdown();

    toast({
      title: "OTP Sent!",
      description: `A 6-digit code has been sent to your phone.`,
    });
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter the complete 6-digit OTP", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call - Accept any 6-digit code for demo
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setStep("reset");
    
    toast({
      title: "OTP Verified!",
      description: "Please set your new password.",
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setStep("success");
    
    toast({
      title: "Password Reset!",
      description: "Your password has been successfully reset.",
    });
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    startCountdown();
    
    toast({
      title: "OTP Resent!",
      description: "A new code has been sent.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => step === "input" ? navigate("/login") : setStep("input")}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="text-white" size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Reset Password</h1>
      </header>

      <div className="px-6 py-8">
        {/* Step 1: Input Phone/Email */}
        {step === "input" && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-orange-500" size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Forgot Password?</h2>
              <p className="text-gray-500 mt-2">Enter your phone or email to receive a verification code</p>
            </div>

            {/* Method Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setMethod("phone")}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  method === "phone" 
                    ? "bg-white text-orange-500 shadow-sm" 
                    : "text-gray-500"
                }`}
              >
                <Phone size={18} />
                Phone
              </button>
              <button
                type="button"
                onClick={() => setMethod("email")}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  method === "email" 
                    ? "bg-white text-orange-500 shadow-sm" 
                    : "text-gray-500"
                }`}
              >
                <Mail size={18} />
                Email
              </button>
            </div>

            {/* Input Field */}
            {method === "phone" ? (
              <div className="space-y-2">
                <label className="text-gray-700 font-medium">Phone Number</label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-28 h-12 bg-white border-gray-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="+880">+880</SelectItem>
                      <SelectItem value="+91">+91</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                    className={`flex-1 h-12 bg-white border-gray-200 rounded-xl ${
                      phoneError ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    maxLength={15}
                  />
                </div>
                {phoneError && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-red-100 rounded-full text-center text-xs leading-4">!</span>
                    {phoneError}
                  </p>
                )}
                {!phoneError && phone.length >= 10 && (
                  <p className="text-green-500 text-sm flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-green-100 rounded-full text-center text-xs leading-4">✓</span>
                    Valid phone number
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-gray-700 font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  className={`h-12 bg-white border-gray-200 rounded-xl ${
                    emailError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  maxLength={255}
                />
                {emailError && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-red-100 rounded-full text-center text-xs leading-4">!</span>
                    {emailError}
                  </p>
                )}
                {!emailError && email.length > 0 && validateEmail(email) === null && (
                  <p className="text-green-500 text-sm flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-green-100 rounded-full text-center text-xs leading-4">✓</span>
                    Valid email address
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !isInputValid}
              className="w-full h-14 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-lg rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </Button>

            <p className="text-center text-gray-500">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-orange-500 font-medium"
              >
                Login
              </button>
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-orange-500" size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Verify OTP</h2>
              <p className="text-gray-500 mt-2">
                Enter the 6-digit code sent to<br />
                <span className="font-medium text-gray-700">
                  {method === "phone" ? `${countryCode} ${phone}` : email}
                </span>
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-12 h-14 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-orange-500"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Resend */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-gray-500">
                  Resend code in <span className="text-orange-500 font-bold">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-orange-500 font-medium"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-14 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-lg rounded-full shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-orange-500" size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Set New Password</h2>
              <p className="text-gray-500 mt-2">Create a strong password for your account</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-gray-700 font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 bg-white border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-700 font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-white border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-lg rounded-full shadow-lg"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-green-500" size={60} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Password Reset!</h2>
              <p className="text-gray-500 mt-2">Your password has been successfully changed.</p>
            </div>
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-14 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-lg rounded-full shadow-lg"
            >
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
