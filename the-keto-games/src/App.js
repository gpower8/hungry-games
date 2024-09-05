import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [gameState, setGameState] = useState('initial');
  const [roomCode, setRoomCode] = useState('');
  const [playerInfo, setPlayerInfo] = useState(null);
  const [players, setPlayers] = useState([]);
  const [story, setStory] = useState('');
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [winner, setWinner] = useState(null);
  const [alivePlayers, setAlivePlayers] = useState([]);
  const [characteristicSubmitted, setCharacteristicSubmitted] = useState(false);

  useEffect(() => {
    socket.on('gameCreated', ({ roomCode, playerInfo }) => {
      setRoomCode(roomCode);
      setPlayerInfo(playerInfo);
      setGameState('lobby');
    });

    socket.on('gameJoined', ({ roomCode, playerInfo }) => {
      setRoomCode(roomCode);
      setPlayerInfo(playerInfo);
      setGameState('lobby');
    });

    socket.on('updateLobby', (players) => {
      setPlayers(players);
    });

    socket.on('assignCharacteristic', ({ targetId, targetName }) => {
      setTargetPlayer({ id: targetId, name: targetName });
      setGameState('characteristics');
      setCharacteristicSubmitted(false);
    });

    socket.on('characteristicUpdated', ({ playerId, characteristic }) => {
      setPlayers(players => players.map(p =>
        p.id === playerId ? { ...p, characteristic } : p
      ));
    });

    socket.on('gameStarted', ({ story }) => {
      setStory(story);
      setGameState('inProgress');
    });

    socket.on('promptActions', ({ alivePlayers }) => {
      setAlivePlayers(alivePlayers);
    });

    socket.on('gameProgressed', ({ story, deadPlayerId, alivePlayers }) => {
      setStory(story);
      setPlayers(players => players.map(p =>
        p.id === deadPlayerId ? { ...p, alive: false } : p
      ));
      setAlivePlayers(alivePlayers);
    });

    socket.on('gameOver', ({ story, winner }) => {
      setStory(story);
      setWinner(winner);
      setGameState('gameOver');
    });

    return () => {
      socket.off('gameCreated');
      socket.off('gameJoined');
      socket.off('updateLobby');
      socket.off('assignCharacteristic');
      socket.off('characteristicUpdated');
      socket.off('gameStarted');
      socket.off('promptActions');
      socket.off('gameProgressed');
      socket.off('gameOver');
    };
  }, []);

  const createGame = (numPlayers, name) => {
    socket.emit('createGame', { numPlayers, name });
  };

  const joinGame = (roomCode, name) => {
    socket.emit('joinGame', { roomCode, name });
  };

  const submitCharacteristic = (characteristic) => {
    if (characteristic.trim() !== '') {
      socket.emit('submitCharacteristic', { roomCode, targetId: targetPlayer.id, characteristic });
      setCharacteristicSubmitted(true);
    }
  };

  const submitAction = (action) => {
    if (action.trim() !== '') {
      socket.emit('submitAction', { roomCode, action });
    }
  };

  return (
    <div className="App" style={{
      backgroundImage: 'url(/forest.gif)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh'
    }}>
      {playerInfo && (
        <header className="sticky-header">
          {playerInfo && <h1>{playerInfo.name}</h1>}
        </header>
      )}
      <main className="main-content">
        {gameState === 'initial' && (
          <div className="initial-screen">
            <JoinGame onJoinGame={joinGame} />
            <CreateGame onCreateGame={createGame} />
          </div>
        )}
        {gameState === 'lobby' && (
          <Lobby players={players} roomCode={roomCode} />
        )}
        {gameState === 'characteristics' && !characteristicSubmitted && (
          <div className="characteristic-input">
            <h2>Assign a characteristic to {targetPlayer.name}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.elements.characteristic;
              submitCharacteristic(input.value);
              input.value = '';
            }}>
              <input
                type="text"
                name="characteristic"
                placeholder="Enter characteristic"
                required
                autoFocus
              />
              <button type="submit">Submit Characteristic</button>
            </form>
          </div>
        )}
        {gameState === 'characteristics' && characteristicSubmitted && (
          <div className="waiting-message">
            <h2>Waiting...</h2>
          </div>
        )}
        {(gameState === 'inProgress' || gameState === 'gameOver') && (
          <Game
            story={story}
            players={players}
            alivePlayers={alivePlayers}
            playerInfo={playerInfo}
            onSubmitAction={submitAction}
            winner={winner}
          />
        )}
      </main>
    </div>
  );
}

export default App;