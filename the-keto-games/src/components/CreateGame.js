import React, { useState } from 'react';
import './GameForms.css';

function CreateGame({ onCreateGame }) {
    const [numPlayers, setNumPlayers] = useState(2);
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateGame(numPlayers, name);
    };

    return (
        <form onSubmit={handleSubmit} className="game-form">
            <h2>Create New Game</h2>
            <input
                type="number"
                value={numPlayers}
                onChange={(e) => setNumPlayers(e.target.value)}
                min="2"
                required
                placeholder="Number of players"
            />
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
            />
            <button type="submit">Create Game</button>
        </form>
    );
}

export default CreateGame;