import React, { useState } from 'react';
import './Game.css';

function Game({ story, players, alivePlayers, playerInfo, onSubmitAction, winner }) {
    const [action, setAction] = useState('');
    const [actionSubmitted, setActionSubmitted] = useState(false);

    const parseText = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const handleSubmitAction = (e) => {
        e.preventDefault();
        onSubmitAction(action);
        setAction('');
        setActionSubmitted(true);
    };

    return (
        <div className="game-container">
            <h2>Hunger Games</h2>
            <div className="story-container">{parseText(story)}</div>
            {winner ? (
                <h3>Winner: {winner}</h3>
            ) : (
                <>
                    <h3>Alive Players:</h3>
                    <ul className="players-list">
                        {players.filter(p => alivePlayers.includes(p.id)).map(player => (
                            <li key={player.id}>
                                {player.name} - {player.characteristic}
                            </li>
                        ))}
                    </ul>
                    {alivePlayers.includes(playerInfo.id) && !actionSubmitted && (
                        <form onSubmit={handleSubmitAction} className="action-form">
                            <input
                                type="text"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                placeholder="Enter your next action"
                                required
                                autoFocus
                            />
                            <button type="submit">Submit Action</button>
                        </form>
                    )}
                    {actionSubmitted && (
                        <p>Waiting...</p>
                    )}
                </>
            )}
        </div>
    );
}

export default Game;