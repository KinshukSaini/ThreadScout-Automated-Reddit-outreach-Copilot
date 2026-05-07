"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import ScoutCard from "@/components/scoutCard";
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
  const [burgerOpen, setBurgerOpen] = useState(false);
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

    {/* burger menu */}
      <button onClick={() => setBurgerOpen(!burgerOpen)} className="absolute top-5 left-5 z-50">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.633h16.5M3.75 12h16.5m-16.5 5.367h16.5" />
      </svg>
    </button>

        {/* burger menu sidebar */}
      <>
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${burgerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setBurgerOpen(false)}
        />
        <div className={`fixed top-0 left-0 z-50 h-screen w-72 bg-gray-700 border-r-2 border-white shadow-2xl flex flex-col pt-20 px-4 gap-2 transform transition-transform duration-300 ease-out ${burgerOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => { setBurgerOpen(false); }} className="block w-full text-left px-4 py-3 rounded hover:border-white hover:border-1 border-1 border-transparent text-white">
            Home
          </button>
          <button onClick={() => { setBurgerOpen(false); }} className="block w-full text-left px-4 py-3 rounded hover:border-white hover:border-1 border-1 border-transparent text-white">
            Scouts
          </button>
          <button onClick={() => { setBurgerOpen(false); }} className="block w-full text-left px-4 py-3 rounded hover:border-white hover:border-1 border-1 border-transparent text-white">
            Upgrade
          </button>
          <button onClick={() => { setBurgerOpen(false); }} className="block w-full text-left px-4 py-3 rounded hover:border-white hover:border-1 border-1 border-transparent text-white">
            Profile
          </button>
        </div>
      </>

    {/* scouts */}
    <div className="flex flex-row space-between w-full justify-center">
      <div className="w-[60%] text-align-left text-3xl p-0 m-5" >your scouts</div>
      <button className="p-2 border-white border-2 rounded text-white hover:bg-violet-900 hover:transition-all mb-5 w-auto">
        + Create Scout
      </button>
    </div>
    <hr className="w-[70%] border-gray-300 border mb-5" />
    
    <div className="bg-gray-800 w-[70%]">
      <div className="flex flex-row flex-wrap">
        {scouts.map(scout => (
          <ScoutCard key={scout.id} id={scout.id} name={scout.name} scoutURL={scout.scoutURL} description={scout.description} />
        ))}      
          <ScoutCard id={0} name={"Create new scout"} scoutURL={""} description={"Click here to create a new scout"} />
      </div>
    </div>
    </div>
  );
}