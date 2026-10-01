// components/AuditorForm.tsx
"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function AuditorForm() {
  const [sugEventId, setSugEventId] = useState("");
  const [sourceSheetId, setSourceSheetId] = useState("");
  const [destSheetId, setDestSheetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [noShows, setNoShows] = useState<any[]>([]);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setNoShows([]);

    try {
      const response = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sugEventId, sourceSheetId, destSheetId }),
      });
      const data = await response.json();

      if (data.success) {
        setStatus({
          type: "success",
          message: `Audit Complete! Found ${data.noShows.length} No Shows! It has been Saved to the Google Spreadsheet.`,
        });
        setNoShows(data.noShows);
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to complete reconciliation.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "A communication error occurred with the backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-10">
        <FileSpreadsheet className="w-8 h-8 text-teal-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            EVENT NO SHOWS
          </h2>
          <p className="text-sm text-gray-400 tracking-wider">
            Reconcile SignUpGenius slots against live check-in logs
          </p>
        </div>
      </div>

      <form onSubmit={handleAudit} className="space-y-10">
        <div>
          <label className="block text-base font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Sign-Up Genius Event URL
          </label>
          <input
            type="text"
            required
            value={sugEventId}
            onChange={(e) => setSugEventId(e.target.value)}
            placeholder="example: https://www.signupgenius.com/go/{eventId}/"
            className="w-full px-4 py-4 bg-gray-950 rounded-lg border border-gray-800 focus:border-teal-500 focus:outline-none text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Check-In Check-Out Spreadsheet URL
          </label>
          <input
            type="text"
            required
            value={sourceSheetId}
            onChange={(e) => setSourceSheetId(e.target.value)}
            placeholder="example: https://docs.google.com/spreadsheets/d/{spreadsheetId}/"
            className="w-full px-4 py-4 bg-gray-950 rounded-lg border border-gray-800 focus:border-teal-500 focus:outline-none text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            No-Show Spreadsheet URL
          </label>
          <input
            type="text"
            required
            value={destSheetId}
            onChange={(e) => setDestSheetId(e.target.value)}
            placeholder="example: https://docs.google.com/spreadsheets/d/{spreadsheetId}/"
            className="w-full px-4 py-4 bg-gray-950 rounded-lg border border-gray-800 focus:border-teal-500 focus:outline-none text-white text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-800 text-gray-950 disabled:text-gray-500 font-bold py-3 rounded-lg transition duration-200 text-base mt-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Comparing Systems..." : "Run Audit"}
        </button>
      </form>

      {status && (
        <div
          className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${
            status.type === "success"
              ? "bg-emerald-950/30 border-emerald-800 text-emerald-400"
              : "bg-rose-950/30 border-rose-800 text-rose-400"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span className="text-lg font-medium tracking-wider">{status.message}</span>
        </div>
      )}

      {noShows.length > 0 && (
        <div className="mt-6 border-t border-gray-800 pt-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-3 tracking-wider">
            Identified ({noShows.length}) NO SHOWS 
          </h3>
          <div className="bg-gray-950 rounded-xl border border-gray-800 divide-y divide-gray-900">
            {/* Table-like Header row on screen for readability */}
            <div className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider grid grid-cols-3 gap-4 bg-gray-900/50">
              <span>Email</span>
              <span>Name</span>
              <span>Assigned Role</span>
            </div>

            {/* List items mapping matching your layout order rules */}
            {noShows.map((person, idx) => (
              <div
                key={idx}
                className="p-3 text-xs grid grid-cols-3 gap-4 items-center text-gray-300 hover:bg-gray-900/30 transition duration-150"
              >
                <span
                  className="font-mono text-gray-400 truncate"
                  title={person.email}
                >
                  {person.email}
                </span>
                <span className="font-medium text-white truncate">
                  {person.firstname} {person.lastname}
                </span>
                <span className="text-teal-400 truncate font-medium">
                  {person.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
