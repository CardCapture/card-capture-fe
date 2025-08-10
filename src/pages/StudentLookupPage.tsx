import React, { useState } from "react";
import { StudentService } from "@/services";

export default function StudentLookupPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await StudentService.lookupByEmail(email);
      setSent(res.sent);
    } catch (err: any) {
      setError(err?.message || "Failed to send email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Find my QR code</h1>
      {sent ? (
        <div className="text-green-700">If an account exists, we emailed your QR code.</div>
      ) : (
        <form className="grid gap-3" onSubmit={submit}>
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
      )}
    </div>
  );
}


