import React from 'react'

interface CreateScoutProps {
  onClose: () => void;
}

const createScout = ({ onClose }: CreateScoutProps) => {
  return (
    <div className="absolute bg-gray-900 text-violet-200 w-[60vw] h-[70vh] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl border-white border-2 flex flex-col items-center justify-center gap-5 z-50">
        {/* cross button */}
        <button className="absolute top-4 right-4 text-gray-200 hover:text-gray-700" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div>
            <form className="grid grid-cols-2 gap-4 w-96">
                <label className="col-span-2 text-lg text-center mb-2">Enter Scout Details</label>
                
                <label className="col-span-2">Scout Name:</label>
                <input type="text" placeholder="Scout Name" className="col-span-2 p-2 rounded border-gray-300 border-2 bg-gray-800 text-white" />
                
                <label className="col-span-2">Scout URL:</label>
                <input type="text" placeholder="Scout URL" className="col-span-2 p-2 rounded border-gray-300 border-2 bg-gray-800 text-white" />
                
                <label className="col-span-2">Scout Description:</label>
                <textarea placeholder="Scout Description" className="col-span-2 p-2 rounded border-gray-300 border-2 h-32 bg-gray-800 text-white min-h-20 max-h-50"></textarea>
                
                <button type="submit" className="col-span-2 bg-violet-700 hover:bg-violet-900 text-white font-bold py-2 px-4 rounded">
                    Create Scout
                </button>
            </form>
        </div>
    </div>
  )
}

export default createScout