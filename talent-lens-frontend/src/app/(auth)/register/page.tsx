"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/register", {
        firstName,
        lastName,
        email,
        password,
      });
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-card">
        <div className="lp-header">
          <h1 className="lp-title">Create an Account</h1>
          <p className="lp-subtitle">
            Join us! Please fill in the details to get started.
          </p>
        </div>

        {error && <div className="lp-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="lp-field">
            <label htmlFor="lp-firstName" className="lp-label">
              First Name
            </label>
            <input
              id="lp-firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="lp-input"
              required
            />
          </div>

          <div className="lp-field">
            <label htmlFor="lp-lastName" className="lp-label">
              Last Name
            </label>
            <input
              id="lp-lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="lp-input"
              required
            />
          </div>

          <div className="lp-field">
            <label htmlFor="lp-email" className="lp-label">
              Email
            </label>
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

          <div className="lp-field">
            <label htmlFor="lp-password" className="lp-label">
              Password
            </label>
            <div className="lp-input-wrap">
              <input
                id="lp-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          <button
            id="lp-submit"
            type="submit"
            className="lp-submit"
            disabled={loading}
          >
            {loading ? <span className="lp-spinner" /> : "Sign Up"}
          </button>
        </form>

        <div className="lp-divider">
          <span>or</span>
        </div>

        <button type="button" id="lp-google" className="lp-google">
          <svg
            width="20"
            height="20"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.562c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.044l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956L3.964 7.288C4.672 5.161 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Sign up with Google
        </button>

        <p className="lp-footer">
          Already have an account?{" "}
          <Link href="/login" className="lp-signup-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
