import React from 'react';

const textStyle = {
    color: 'white',
    textShadow: `-1px -1px 0 #000,  
                1px -1px 0 #000,
                -1px 1px 0 #000,
                1px 1px 0 #000`,
    fontSize: '30px',
    margin: '10px 0'
};

const headerStyle = {
    ...textStyle,
    fontSize: '40px'
};

function Lobby({ players, roomCode }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <h1 style={headerStyle}>Room Code: {roomCode}</h1>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {players.map((player) => (
                    <li key={player.id} style={textStyle}>
                        {player.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Lobby;