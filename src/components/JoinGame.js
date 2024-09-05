import React, { useState } from 'react';
import './GameForms.css';

function JoinGame({ onJoinGame }) {
    const [roomCode, setRoomCode] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onJoinGame(roomCode, name);
    };

    return (
        <form onSubmit={handleSubmit} className="game-form">
            <h2>Join Game</h2>
            <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Room code"
                required
                autoFocus
            />
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
            />
            <button type="submit">Join Game</button>
        </form>
    );
}

export default JoinGame;