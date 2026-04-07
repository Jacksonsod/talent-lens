"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", { email, password });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-card">

        {/* Heading */}
        <div className="lp-header">
          <h1 className="lp-title">Login</h1>
          <p className="lp-subtitle">Welcome! Please fill in the details to get started.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="lp-error" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="lp-field">
            <label htmlFor="lp-email" className="lp-label">Email</label>
            <input
              id="lp-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lp-input"
              required
            />
          </div>

          {/* Password */}
          <div className="lp-field">
            <label htmlFor="lp-password" className="lp-label">Password</label>
            <div className="lp-input-wrap">
              <input
                id="lp-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="lp-input"
                required
              />
              <button
                type="button"
                className="lp-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Sign In */}
          <button
            id="lp-submit"
            type="submit"
            className="lp-submit"
            disabled={loading}
          >
            {loading ? <span className="lp-spinner" /> : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p className="lp-footer">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="lp-signup-link">Sign up</Link>
        </p>

      </div>
    </div>
  );
}
