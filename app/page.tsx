"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import ScoutCard from "@/components/scoutCard";
import CreateScout from "@/components/createScout";

export default function Home() {
  const { data: session } = useSession();
  const [createScoutOpen, setCreateScoutOpen] = useState(false);
  const [scouts, setScouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScouts = async () => {
      if (!session) return;

      try {
        const response = await fetch("/api/scouts");
        const data = await response.json();
        setScouts(data.scouts || []);
      } catch (error) {
        console.error("Failed to fetch scouts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScouts();
  }, [session]);

  const handleCreateScout = () => {
    setCreateScoutOpen(true);
  };

  const handleScoutCreated = () => {
    // Refresh scouts list
    const fetchScouts = async () => {
      try {
        const response = await fetch("/api/scouts");
        const data = await response.json();
        setScouts(data.scouts || []);
      } catch (error) {
        console.error("Failed to fetch scouts:", error);
      }
    };
    fetchScouts();
  };

  return (
    <div className="bg-gray-800 text-violet-200 min-h-screen w-full px-4 py-10 flex flex-col items-center relative overflow-x-hidden">
      {/* heading */}
      <div className="p-10">
        <h1 className="text-6xl text-center font-bold">ThreadScout</h1>
      </div>

      {/* sign-in button */}
      <div className="absolute top-5 right-5">
        {session ? (
          <div
            onClick={() => signOut()}
            className="flex items-center gap-4  border rounded-full p-2 border-white"
          >
            <img
              src={session.user?.image}
              alt={session.user?.name}
              className="w-10 h-10 rounded-full"
            />
          </div>
        ) : (
          <button
            onClick={() => signIn("github")}
            className=" hover:bg-violet-900 hover:transition-all text-white font-bold py-2 px-4 rounded border-white border-2"
          >
            Sign in
          </button>
        )}
      </div>

      {/* create scout modal */}
      {createScoutOpen && (
        <div
          className="absolute inset-0 z-40 bg-black/40"
          onClick={() => setCreateScoutOpen(false)}
        ></div>
      )}
      {createScoutOpen && (
        <CreateScout
          onClose={() => setCreateScoutOpen(false)}
          onCreated={handleScoutCreated}
        />
      )}

      {/* scouts section */}
      <div className="flex flex-row space-between w-full justify-center">
        <div className="w-[60%] text-align-left text-3xl p-0 m-5">
          your scouts
        </div>
        <button
          onClick={() => handleCreateScout()}
          className="p-2 border-white border-2 rounded text-white hover:bg-violet-900 hover:transition-all mb-5 w-auto"
        >
          + Create Scout
        </button>
      </div>
      <hr className="w-[70%] border-gray-300 border mb-5" />

      <div className="bg-gray-800 w-[70%]">
        <div className="flex flex-row flex-wrap">
          {loading ? (
            <p>Loading scouts...</p>
          ) : (
            <>
              {scouts.map((scout) => (
                <ScoutCard
                  key={scout.id}
                  id={scout.id}
                  name={scout.name}
                  scoutURL={scout.url}
                  description={scout.description}
                  onDeleted={handleScoutCreated}
                />
              ))}
              <div onClick={handleCreateScout} className="cursor-pointer">
                <ScoutCard
                  id={0}
                  name={"Create new scout"}
                  scoutURL={""}
                  description={"Click here to create a new scout"}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}