"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface CreateScoutProps {
  onClose: () => void;
  onCreated?: () => void;
}

const CreateScout = ({ onClose, onCreated }: CreateScoutProps) => {
  const router = useRouter();
  const [scoutName, setScoutName] = React.useState("");
  const [scoutURL, setScoutURL] = React.useState("");
  const [scoutDescription, setScoutDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!scoutName || !scoutURL) {
      setError("Scout name and URL are required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/scouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: scoutName,
          url: scoutURL,
          description: scoutDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create scout");
      }

      console.log("Scout created successfully!", data);
      setScoutName("");
      setScoutURL("");
      setScoutDescription("");
      onClose();
      if (onCreated) {
        onCreated();
      }
    } catch (err) {
      console.error("Error creating scout:", err);
      setError(err instanceof Error ? err.message : "Failed to create scout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bg-gray-900 text-violet-200 w-[60vw] h-[70vh] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl border-white border-2 flex flex-col items-center justify-center gap-5 z-50">
      {/* cross button */}
      <button
        className="absolute top-4 right-4 text-gray-200 hover:text-gray-700"
        onClick={onClose}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div>
        <form className="grid grid-cols-2 gap-4 w-96">
          <label className="col-span-2 text-lg text-center mb-2">
            Enter Scout Details
          </label>

          <label className="col-span-2">Scout Name:</label>
          <input
            type="text"
            placeholder="Scout Name"
            className="col-span-2 p-2 rounded border-gray-300 border-2 bg-gray-800 text-white"
            value={scoutName}
            onChange={(e) => setScoutName(e.target.value)}
            disabled={loading}
          />

          <label className="col-span-2">Scout URL:</label>
          <input
            type="text"
            placeholder="Scout URL"
            className="col-span-2 p-2 rounded border-gray-300 border-2 bg-gray-800 text-white"
            value={scoutURL}
            onChange={(e) => setScoutURL(e.target.value)}
            disabled={loading}
          />

          <label className="col-span-2">Scout Description:</label>
          <textarea
            placeholder="Scout Description"
            className="col-span-2 p-2 rounded border-gray-300 border-2 h-32 bg-gray-800 text-white min-h-20 max-h-50"
            value={scoutDescription}
            onChange={(e) => setScoutDescription(e.target.value)}
            disabled={loading}
          ></textarea>

          {error && (
            <p className="col-span-2 text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="col-span-2 bg-violet-700 hover:bg-violet-900 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            onClick={handleClick}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Scout"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateScout;