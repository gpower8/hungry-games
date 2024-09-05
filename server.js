const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
//const crypto = require('crypto');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const { HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro", safetySettings: safetySettings });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3001;

// Store game rooms
const gameRooms = {};

// Helper function to generate a random room code
function generateRoomCode() {
    const randomNumber = Math.floor(Math.random() * 100);
    return randomNumber.toString().padStart(2, '0');
}

// Helper function to get OpenAI response
async function getAIResponse(prompt) {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating AI content:", error);
        return `Error generating story: ${error.message}`;
    }
}

io.on('connection', (socket) => {
    console.log('A user connected');

    // Create a new game room
    socket.on('createGame', ({ numPlayers, name }) => {
        const roomCode = generateRoomCode();
        gameRooms[roomCode] = {
            players: [{ id: socket.id, name, characteristic: '' }],
            maxPlayers: numPlayers,
            gameState: 'lobby',
            fullStory: '',
            currentStoryPart: '',
            alivePlayerIds: [],
            pendingActions: {}
        };
        socket.join(roomCode);
        socket.emit('gameCreated', { roomCode, playerInfo: { id: socket.id, name } });
        io.to(roomCode).emit('updateLobby', gameRooms[roomCode].players);
    });

    // Join an existing game room
    socket.on('joinGame', ({ roomCode, name }) => {
        const room = gameRooms[roomCode];
        if (room && room.players.length < room.maxPlayers) {
            room.players.push({ id: socket.id, name, characteristic: '' });
            socket.join(roomCode);
            socket.emit('gameJoined', { roomCode, playerInfo: { id: socket.id, name } });
            io.to(roomCode).emit('updateLobby', room.players);
            console.log(room.players.length + 'max' + room.maxPlayers)
            if (room.players.length == room.maxPlayers) {
                console.log('inside if statement')
                startCharacteristicPhase(roomCode);
            }
        } else {
            socket.emit('error', 'Room not found or full');
        }
    });

    // Receive characteristic for a player
    socket.on('submitCharacteristic', ({ roomCode, targetId, characteristic }) => {
        const room = gameRooms[roomCode];
        if (room) {
            const targetPlayer = room.players.find(p => p.id === targetId);
            if (targetPlayer) {
                targetPlayer.characteristic = characteristic;
                io.to(roomCode).emit('characteristicUpdated', { playerId: targetId, characteristic });

                if (room.players.every(p => p.characteristic)) {
                    startGame(roomCode);
                }
            }
        }
    });

    // Receive action from a player
    socket.on('submitAction', ({ roomCode, action }) => {
        const room = gameRooms[roomCode];
        if (room && room.gameState === 'inProgress') {
            room.pendingActions[socket.id] = action;
            io.to(roomCode).emit('actionSubmitted', { playerId: socket.id });

            if (Object.keys(room.pendingActions).length === room.alivePlayerIds.length) {
                progressGame(roomCode);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Handle player disconnect (remove from game, etc.)
    });
});

function startCharacteristicPhase(roomCode) {
    console.log('Characteristic Phase Starting')
    const room = gameRooms[roomCode];
    room.gameState = 'characteristics';

    // Assign each player another player to give a characteristic
    const shuffledPlayers = [...room.players].sort(() => 0.5 - Math.random());
    shuffledPlayers.forEach((player, index) => {
        const targetPlayer = shuffledPlayers[(index + 1) % shuffledPlayers.length];
        io.to(player.id).emit('assignCharacteristic', { targetId: targetPlayer.id, targetName: targetPlayer.name });
    });
}

async function startGame(roomCode) {
    const room = gameRooms[roomCode];
    room.gameState = 'inProgress';
    room.alivePlayerIds = room.players.map(p => p.id);

    // Generate initial story
    const initialPrompt = `Please play out a hungers scenario between the following characters. Make sure to use their characteristics in all of their actions and make it funny. Please play out the first day of the hunger games beginning scenario. There are weapons in the centre. The characters are competing against eachother to the death. Don't have any of the chracters die yet. Here are the characters and next to each character is one characteristic about them: ${room.players.map(p => `${p.name} characteristic: (${p.characteristic})`).join(', ')}`;
    room.fullStory = await getAIResponse(initialPrompt);
    room.currentStoryPart = room.fullStory;
    io.to(roomCode).emit('gameStarted', { story: room.currentStoryPart });
    promptForActions(roomCode);
}

function promptForActions(roomCode) {
    const room = gameRooms[roomCode];
    room.pendingActions = {};
    io.to(roomCode).emit('promptActions', { alivePlayers: room.alivePlayerIds });
}

async function progressGame(roomCode) {
    const room = gameRooms[roomCode];

    // Generate next part of the story based on actions and previous story
    const actionPrompt = `Here's what has happened so far in the Hunger Games:

${room.story}

Continue the Hunger Games story. Current alive players and their characteristics: ${room.alivePlayerIds.map(id => {
        const player = room.players.find(p => p.id === id);
        return `${player.name} characteristic: (${player.characteristic})`;
    }).join(', ')}. 

Each characters intention/action for this round: ${Object.entries(room.pendingActions).map(([id, action]) => {
        const player = room.players.find(p => p.id === id);
        return player ? `${player.name} action: ${action}` : `Unknown player action: ${action}`;
    }).join('. ')}.

Write the next part of the story, incorporating these intention (their intended action could fail) and ensuring at least one alive player dies. Make the story funny and absurd. Make sure the story is consistent with what has happened before.

At the end of your response, please include a line that starts with "DECEASED:" followed by the name(s) of the player(s) who died, separated by commas if there are multiple deaths.`;

    const newStoryPart = await getAIResponse(actionPrompt);
    console.log(actionPrompt)
    room.fullStory += '\n' + newStoryPart;
    room.currentStoryPart = newStoryPart;

    // Parse the newStoryPart to determine who died
    const deceasedMatch = newStoryPart.match(/DECEASED:(.*)/i); // Case-insensitive matching
    let deceasedPlayers = [];
    if (deceasedMatch) {
        deceasedPlayers = deceasedMatch[1].split(',').map(name => name.trim());
        deceasedPlayers.forEach(deadPlayerName => {
            // Remove asterisks from the deadPlayerName
            const cleanDeadPlayerName = deadPlayerName.replace(/\*/g, '').trim();

            const deadPlayer = room.players.find(p =>
                p.name.toLowerCase().replace(/\*/g, '') === cleanDeadPlayerName.toLowerCase()
            );

            if (deadPlayer) {
                room.alivePlayerIds = room.alivePlayerIds.filter(id => id !== deadPlayer.id);
            } else {
                console.log(`Warning: Player "${cleanDeadPlayerName}" not found. Possible name mismatch.`);
            }
        });
    }

    // If no deaths were specified, fallback to random selection
    // if (deceasedPlayers.length === 0) {
    //     const deadPlayerId = room.alivePlayerIds[Math.floor(Math.random() * room.alivePlayerIds.length)];
    //     room.alivePlayerIds = room.alivePlayerIds.filter(id => id !== deadPlayerId);
    //     const deadPlayer = room.players.find(p => p.id === deadPlayerId);
    //     deceasedPlayers.push(deadPlayer.name);
    // }

    if (room.alivePlayerIds.length > 1) {
        io.to(roomCode).emit('gameProgressed', {
            story: room.currentStoryPart,
            deceasedPlayers: deceasedPlayers,
            alivePlayers: room.alivePlayerIds
        });
        promptForActions(roomCode);
    } else {
        // Game over
        const winner = room.players.find(p => p.id === room.alivePlayerIds[0]);
        const finalPrompt = `Conclude the Hunger Games story. ${winner.name} is the victor. Describe what they go on to do after winning in a short paragraph, make it really funny and make ${winner.name} dishonor the other dead comptetitors. considering all that has happened in the story so far:

${room.fullStory}`;
        const conclusion = await getAIResponse(finalPrompt);
        room.fullStory += '\n\n' + conclusion;
        room.currentStoryPart = room.currentStoryPart + '\n\n' + conclusion;
        io.to(roomCode).emit('gameOver', {
            story: room.currentStoryPart,
            winner: winner.name
        });
    }
}

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});