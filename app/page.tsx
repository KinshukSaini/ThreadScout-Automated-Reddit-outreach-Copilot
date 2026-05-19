"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import ScoutCard from "@/components/scoutCard";
import CreateScout from "@/components/createScout";
const scouts = [
  {
    id: 1,
    name: "Scout 1",
    scoutURL: "abc.com",
    description: "This is scout 1",
  },
  {
    id: 2,
    name: "Scout 2",
    scoutURL: "def.com",
    description: "This is scout 2",
  },
  {
    id: 3,
    name: "Scout 3",
    scoutURL: "ghi.com",
    description: "This is scout 3",
  },
  {
    id: 4,
    name: "Scout 4",
    scoutURL: "jkl.com",
    description: "This is scout 4",
  },

];
export default function Home() {
  const [createScoutOpen, setCreateScoutOpen] = useState(false);
  
  
  const handleCreateScout = () => {
    setCreateScoutOpen(true);
  }
  
  
  return (
    <div className="bg-gray-800 text-violet-200 min-h-screen w-full px-4 py-10 flex flex-col items-center relative overflow-x-hidden">
    
    {/* heading */}
    <div className="p-10">
      <h1 className="text-6xl text-center font-bold">ThreadScout</h1>
    </div>
    
    {/* sign-in button */}
    <div className="absolute top-5 right-5">
      <button
        onClick={() => signIn("github")}
        className=" hover:bg-violet-900 hover:transition-all text-white font-bold py-2 px-4 rounded border-white border-2"
      >
        Sign in
      </button>
    </div>
    
    {/*  */}
    {createScoutOpen && <div className="absolute inset-0 z-40 bg-black/40" onClick={() => setCreateScoutOpen(false)}></div>}
    {createScoutOpen && <CreateScout onClose={() => setCreateScoutOpen(false)} />}
    
    {/* scouts */}
    <div className="flex flex-row space-between w-full justify-center">
      <div className="w-[60%] text-align-left text-3xl p-0 m-5" >your scouts</div>
      <button onClick={() => handleCreateScout()} className="p-2 border-white border-2 rounded text-white hover:bg-violet-900 hover:transition-all mb-5 w-auto">
        + Create Scout
      </button>
    </div>
    <hr className="w-[70%] border-gray-300 border mb-5" />
    
    <div className="bg-gray-800 w-[70%]">
      <div className="flex flex-row flex-wrap">
        {scouts.map(scout => (
          <ScoutCard key={scout.id} id={scout.id} name={scout.name} scoutURL={scout.scoutURL} description={scout.description} />
        ))}      
          <div onClick={handleCreateScout} className="cursor-pointer">
          <ScoutCard id={0} name={"Create new scout"} scoutURL={""} description={"Click here to create a new scout"} />
          </div>
          
      </div>
    </div>
    </div>
  );
}