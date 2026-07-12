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
    <div className="min-h-screen flex items-center justify-center overflow-hidden p-4 bg-zinc-950 relative">
      {/* Ambient background glows for professional aesthetic */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-orange-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-zinc-500/5 blur-[130px] pointer-events-none"></div>

      <div className="w-full relative max-w-5xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl bg-zinc-900 border border-zinc-800/80">
        
        {/* Left Side decorative design panel */}
        <div className="bg-black text-white p-8 md:p-12 md:w-1/2 relative min-h-[320px] md:min-h-[520px] flex flex-col justify-between overflow-hidden">
          <div className="w-full h-full z-2 absolute bg-linear-to-t from-transparent to-black inset-0"></div>
          
          <div className="flex absolute z-2 overflow-hidden backdrop-blur-2xl inset-0">
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[40rem] z-2 w-[4rem] bg-linear-90 from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
          </div>
          
          <div className="w-[15rem] h-[15rem] bg-orange-500 absolute z-1 rounded-full -bottom-10 -left-10 opacity-90"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-0 left-20 opacity-80"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-5 left-10 opacity-80"></div>

          <div className="relative z-10 flex items-center gap-2 mb-6">
            <div className="text-orange-500">
              <Sunburst className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">AssetFlow</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-medium leading-tight z-10 tracking-tight relative mt-auto">
            Smart asset tracking and flow management for modern teams.
          </h1>
        </div>

        {/* Right Side Auth Form */}
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col bg-zinc-900/90 z-10 text-zinc-100">
          <div className="flex flex-col items-left mb-8">
            <div className="text-orange-500 mb-4 md:hidden">
              <Sunburst className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-medium mb-2 tracking-tight text-white">
              {isLogin ? "Welcome back" : "Get Started"}
            </h2>
            <p className="text-left text-zinc-400 text-sm">
              {isLogin
                ? "Welcome back to AssetFlow — Log in to your account"
                : "Welcome to AssetFlow — Let's get started"}
            </p>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-950/40 text-red-400 text-sm rounded-lg border border-red-900/50">
              {apiError}
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm mb-1.5 font-medium text-zinc-300">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  className={`text-sm w-full py-2.5 px-3.5 border rounded-lg focus:outline-none focus:ring-2 bg-zinc-950/60 text-white placeholder-zinc-600 focus:ring-orange-500/20 focus:border-orange-500 border-zinc-800 transition-all ${
                    nameError ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20" : ""
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  aria-invalid={!!nameError}
                  aria-describedby="name-error"
                />
                {nameError && (
                  <p id="name-error" className="text-red-400 text-xs mt-1">
                    {nameError}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm mb-1.5 font-medium text-zinc-300">
                Your email
              </label>
              <input
                type="email"
                id="email"
                placeholder="hi@hextastudio.in"
                className={`text-sm w-full py-2.5 px-3.5 border rounded-lg focus:outline-none focus:ring-2 bg-zinc-950/60 text-white placeholder-zinc-600 focus:ring-orange-500/20 focus:border-orange-500 border-zinc-800 transition-all ${
                  emailError ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20" : ""
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!emailError}
                aria-describedby="email-error"
              />
              {emailError && (
                <p id="email-error" className="text-red-400 text-xs mt-1">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-1.5 font-medium text-zinc-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className={`text-sm w-full py-2.5 px-3.5 border rounded-lg focus:outline-none focus:ring-2 bg-zinc-950/60 text-white placeholder-zinc-600 focus:ring-orange-500/20 focus:border-orange-500 border-zinc-800 transition-all ${
                  passwordError ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20" : ""
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!passwordError}
                aria-describedby="password-error"
              />
              {passwordError && (
                <p id="password-error" className="text-red-400 text-xs mt-1">
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create a new account"}
            </button>

            <div className="text-center text-zinc-500 text-sm mt-3">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-orange-500 hover:text-orange-400 font-medium underline cursor-pointer transition-colors"
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
