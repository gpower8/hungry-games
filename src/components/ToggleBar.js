import React, { useState } from 'react';

const ToggleBar = ({ onToggle }) => {
    const [activeOption, setActiveOption] = useState('join');

    const handleToggle = (option) => {
        setActiveOption(option);
        onToggle(option);
    };

    return (
        <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-start rounded-full bg-gray-200 p-1.5">
                <button
                    type="button"
                    className={`relative group inline-flex items-center justify-center whitespace-nowrap rounded-full py-2 px-6 align-middle text-lg font-bold transition-all duration-300 ease-in-out ${activeOption === 'join'
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    onClick={() => handleToggle('join')}
                >
                    <span className={activeOption === 'join' ? 'relative z-10' : ''}>Join Game</span>
                    {activeOption === 'join' && (
                        <span className="absolute inset-0 rounded-full border-2 border-black"></span>
                    )}
                </button>
                <button
                    type="button"
                    className={`relative group inline-flex items-center justify-center whitespace-nowrap rounded-full py-2 px-6 align-middle text-lg font-bold transition-all duration-300 ease-in-out ${activeOption === 'create'
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    onClick={() => handleToggle('create')}
                >
                    <span className={activeOption === 'create' ? 'relative z-10' : ''}>Create Game</span>
                    {activeOption === 'create' && (
                        <span className="absolute inset-0 rounded-full border-2 border-black"></span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ToggleBar;