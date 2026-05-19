import React from 'react'

type scoutsType = {
    id: number,
    name: string,
    scoutURL: string,
    description: string,
};
const scoutCard = (props: scoutsType) => {
    const handleScoutClick = () => {
        // route to /project/[id] page
        window.location.href = `/project/${props.id}`;
    }
    if (props.id === 0) {
        return (
            <div className="bg-gray-800 m-2 p-5 rounded-2xl border-white border-2 w-80 h-40 flex items-center justify-center">  
                <h2 className='text-4xl font-bold'>+</h2>
            </div>
        )
    }

    return (
        <div onClick={handleScoutClick} className="bg-gray-800 m-2 p-5 rounded-2xl border-white border-2 w-80 h-40">  
            <h2 className='text-1xl'>{props.name}</h2>
            <p>{props.description}</p>
            <a href={props.scoutURL} target="_blank" rel="noopener noreferrer">
                {props.scoutURL}
            </a>
        </div>
    )
}

export default scoutCard