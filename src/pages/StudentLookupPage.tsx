import React, { useState } from "react";
import { StudentService } from "@/services";
import { SmartPhoneInput } from "@/components/ui/smart-phone-input";

type Tab = "email" | "phone";

export default function StudentLookupPage() {
  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await StudentService.lookupByEmail(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send email");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await StudentService.sendQrSms(phone);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send text");
    } finally {
      setSubmitting(false);
    }
  };

  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    setSent(false);
    setError("");
  };

  const successMessage =
    tab === "email"
      ? "If an account exists, we emailed your QR code."
      : "If an account exists, we texted a link to your QR code.";

  return (
    <div className="container mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Find my QR code</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "email"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => switchTab("email")}
        >
          Email
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "phone"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => switchTab("phone")}
        >
          Phone
        </button>
      </div>

      {sent ? (
        <div className="text-green-700">{successMessage}</div>
      ) : (
        <>
          {tab === "email" ? (
            <form className="grid gap-3" onSubmit={handleEmailSubmit}>
              {error && <div className="text-red-600">{error}</div>}
              <input
                type="email"
                placeholder="Email"
                className="border p-2 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white rounded px-4 py-2"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Email me my QR"}
              </button>
            </form>
          ) : (
            <form className="grid gap-3" onSubmit={handlePhoneSubmit}>
              {error && <div className="text-red-600">{error}</div>}
              <SmartPhoneInput
                label="Phone Number"
                value={phone}
                onChange={(value) => setPhone(value)}
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white rounded px-4 py-2"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Text me my QR"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
