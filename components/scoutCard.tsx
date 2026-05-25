import React, { useState } from "react";

type scoutsType = {
  id: string | number;
  name: string;
  scoutURL: string;
  description: string;
  onDeleted?: () => void;
};

const scoutCard = (props: scoutsType) => {
  const [deleting, setDeleting] = useState(false);

  const handleScoutClick = () => {
    // route to /project/[id] page with scout data encoded in URL
    const encodedName = encodeURIComponent(props.name);
    const encodedUrl = encodeURIComponent(props.scoutURL);
    const encodedDescription = encodeURIComponent(props.description);
    window.location.href = `/project/${props.id}/${encodedName}/${encodedUrl}/${encodedDescription}`;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (props.id === 0 || typeof props.id === "number") return; // Don't delete the "create new" card

    if (!confirm("Are you sure you want to delete this scout?")) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/scouts/${props.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete scout");
      }

      console.log("Scout deleted successfully!");
      if (props.onDeleted) {
        props.onDeleted();
      }
    } catch (error) {
      console.error("Error deleting scout:", error);
      alert("Failed to delete scout");
    } finally {
      setDeleting(false);
    }
  };

  if (props.id === 0) {
    return (
      <div className="bg-gray-800 m-2 p-5 rounded-2xl border-white border-2 w-80 h-40 flex items-center justify-center">
        <h2 className="text-4xl font-bold">+</h2>
      </div>
    );
  }

  return (
    <div
      onClick={handleScoutClick}
      className="bg-gray-800 m-2 p-5 rounded-2xl border-white border-2 w-80 h-40 relative group cursor-pointer hover:bg-gray-700 transition-colors"
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>

      <h2 className="text-1xl">{props.name}</h2>
      <p>{props.description}</p>
    </div>
  );
};

export default scoutCard;