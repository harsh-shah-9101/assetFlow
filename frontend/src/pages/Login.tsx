import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SunIcon as Sunburst, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validatePassword = (value: string) => {
    return value.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    // Validate Email
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }

    // Validate Password
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }

    // Validate Name (only if signing up)
    if (!isLogin && !name.trim()) {
      setNameError("Please enter your name.");
      valid = false;
    } else {
      setNameError("");
    }

    if (!valid) return;

    setIsLoading(true);
    setApiError("");

    try {
      if (isLogin) {
        const response = await api.post("/auth/login", { email, password });
        login(response.data.token, response.data.user);
        navigate("/");
      } else {
        await api.post("/auth/signup", { name, email, password });
        // Automatically login after signup
        const loginResponse = await api.post("/auth/login", { email, password });
        login(loginResponse.data.token, loginResponse.data.user);
        navigate("/");
      }
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmailError("");
    setPasswordError("");
    setNameError("");
    setApiError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden p-4 bg-[var(--color-background)]">
      <div className="w-full relative max-w-5xl overflow-hidden flex flex-col md:flex-row shadow-2xl rounded-3xl bg-surface border border-[var(--color-border)]">
        
        {/* Left Side decorative design panel */}
        <div className="bg-black text-white p-8 md:p-12 md:w-1/2 relative min-h-[300px] md:min-h-[500px] flex flex-col justify-between overflow-hidden">
          <div className="w-full h-full z-2 absolute bg-linear-to-t from-transparent to-black inset-0"></div>
          
          <div className="flex absolute z-2 overflow-hidden backdrop-blur-2xl inset-0">
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
          </div>
          
          <div className="w-[15rem] h-[15rem] bg-orange-500 absolute z-1 rounded-full -bottom-10 -left-10"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-0 left-20"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-5 left-10"></div>

          <div className="relative z-10 flex items-center gap-2 mb-6">
            <div className="text-orange-500">
              <Sunburst className="h-8 w-8 animate-spin-slow" />
            </div>
            <span className="text-2xl font-bold tracking-tight">AssetFlow</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-medium leading-tight z-10 tracking-tight relative mt-auto">
            Smart asset tracking and flow management for modern teams.
          </h1>
        </div>

        {/* Right Side Auth Form */}
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col bg-slate-50 dark:bg-zinc-900 z-10 text-slate-800 dark:text-zinc-100">
          <div className="flex flex-col items-left mb-8">
            <div className="text-orange-500 mb-4 md:hidden">
              <Sunburst className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-medium mb-2 tracking-tight">
              {isLogin ? "Welcome back" : "Get Started"}
            </h2>
            <p className="text-left opacity-80 text-sm">
              {isLogin
                ? "Welcome back to AssetFlow — Log in to your account"
                : "Welcome to AssetFlow — Let's get started"}
            </p>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50">
              {apiError}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm mb-2 font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  className={`text-sm w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 bg-white text-black focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                    nameError ? "border-red-500" : "border-gray-300 dark:border-zinc-700"
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  aria-invalid={!!nameError}
                  aria-describedby="name-error"
                />
                {nameError && (
                  <p id="name-error" className="text-red-500 text-xs mt-1">
                    {nameError}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm mb-2 font-medium">
                Your email
              </label>
              <input
                type="email"
                id="email"
                placeholder="hi@hextastudio.in"
                className={`text-sm w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 bg-white text-black focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                  emailError ? "border-red-500" : "border-gray-300 dark:border-zinc-700"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!emailError}
                aria-describedby="email-error"
              />
              {emailError && (
                <p id="email-error" className="text-red-500 text-xs mt-1">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className={`text-sm w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 bg-white text-black focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                  passwordError ? "border-red-500" : "border-gray-300 dark:border-zinc-700"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!passwordError}
                aria-describedby="password-error"
              />
              {passwordError && (
                <p id="password-error" className="text-red-500 text-xs mt-1">
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create a new account"}
            </button>

            <div className="text-center text-gray-500 text-sm mt-2">
              {isLogin ? "Already have account? " : "Already have account? "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-orange-600 dark:text-orange-400 font-medium underline cursor-pointer hover:text-orange-700"
              >
                {isLogin ? "Create account" : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
