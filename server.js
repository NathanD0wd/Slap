// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve static files from the 'public' folder

let players = []; // Array to track players

// Handle a connection from a client
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    if (players.length < 2) {
        let playerNumber = 1;
        if (players.length == 1 && players[0].number == 1) {
            playerNumber = 2;
        }
        players.push({ id: socket.id, number: playerNumber });

        socket.emit('playerAssigned', playerNumber);
        console.log(`Assigned Player ${playerNumber} to socket ${socket.id}`);
    } else {
        socket.emit('roomFull');
        console.log('Room is full');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);

        // Remove the player from the players array
        players = players.filter(player => player.id !== socket.id);
        
        console.log(`Removed Player with socket ID ${socket.id}. Remaining players:`, players);
    });

    // PLAYER ACTIONS
    // Playing a card
    socket.on('playCard', (player) => {
        if (player == currentPlayer) {
            handleTurn(player);
        }
    });

    // Slapping
    socket.on('checkSlap', (player) => {
        slapType = checkForSlap(player);
        io.emit('slap', slapType, player + 1);
    });

    // Starting the game
    socket.on('startGame', () => {
        // Initialize Game
        createDeck();
        dealCards();
        io.emit('updatePile', '');
        io.emit('showCardCount', playerHands[0].length, playerHands[1].length);
        io.emit('gameStart');
        console.log('Game started');
        io.emit('isTurn', currentPlayer + 1);
    });

    // Ending the game
    socket.on('endGame', () => {
        endGame("neither player");
    });
});

// Set the server to listen on the port provided by Heroku or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
});


// GAME LOGIC

// Basic Game Variables
let deck = []; // Filled with standard deck
let playerHands = [[], []]; // [0] is the player, [1] is the computer
let pile = []; // Holds center pile
let currentPlayer = 0; // 0 for player 1, 1 for player 2
let topIsFace = false;
let facePlayed = false;
let faceCardTurns = 0; // Remaining turns after face card is played
let justFalseSlapped = false; // True if there was a false slap on current top card
// Prevents slapping when new bottom card fulfils top bottom condition

// Utility sleep function that returns a promise
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Game Set Up
function createDeck() {
    const suits = ['HEART', 'DIAMOND', 'CLUB', 'SPADE'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push(`${suit}-${value}`);
        }
    }
    shuffleDeck();
}

// GSU
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// GSU
function dealCards() {
    playerHands[0] = deck.slice(0, 26); // Half deck for player
    playerHands[1] = deck.slice(26);    // Half deck for computer
}

// Checks if card is a face
function isFace(cardValue) {
    justVal = cardValue.split('-')[1];
    return ['J', 'Q', 'K', 'A'].some(face => justVal.includes(face));
}

// Returns card limit of given face
function faceCardLimit(cardValue) {
    justVal = cardValue.split('-')[1];
    switch (justVal) {
        case 'J': return 1;
        case 'Q': return 2;
        case 'K': return 3;
        case 'A': return 4;
        default: return 0;
    }
}

// Game Break Down
function checkForWin() {
    
    // Iterate through player hands and check if all but one have 0 cards
    let emptyHandCount = 0;
    let winner = 0;
    for (let player = 0; player < playerHands.length; player++) {
        if (playerHands[player] == 0) {
            emptyHandCount += 1;
        }
        else {
            winner = player;
        }
    }

    // If only one player has cards and no slap is available, they win
    if (emptyHandCount == playerHands.length - 1 && checkForSlap(-1) != -1) {
        return winner;
    }
    return -1;
}

// GBD
function endGame(winner) {
    io.emit('gameOver', winner);
    deck = [];
    playerHands = [[], []];
    pile = [];
    currentPlayer = 0;
    io.emit('showCardCount', playerHands[0].length, playerHands[1].length);
    io.emit('updatePile', '');
}

// Gives middle pile to specified player
function givePileTo(player) {
    playerHands[player] = playerHands[player].concat(pile);
    pile = [];
    io.emit('updatePile', '');
    io.emit('showCardCount', playerHands[0].length, playerHands[1].length);
    currentPlayer = player;

    let winner = checkForWin();
    if (winner != -1) {
        endGame(winner);
    }

    facePlayed = false;
    faceCardTurns = 0;

    io.emit('isTurn', currentPlayer + 1);
    // console.log('Gave pile to player ' + player)
}

// Places card on bottom of deck for incorrect slapper
async function slapPunishment(player) {
    justFalseSlapped = true;
    const card = playerHands[player].shift();
    pile.unshift(card);
    await sleep(100);
    io.emit('falseSlap', card);
    io.emit('showCardCount', playerHands[0].length, playerHands[1].length);
    let winner = checkForWin();
    if (winner != -1) {
        endGame(winner);
    }
}

// Checks if slap is possible
// Gives pile to slapper if it is, replaces bottom card if not
function checkForSlap(slapper) {
    canSlap = -1;
    // console.log(slapper + ' is checking for slap');
    if (pile.length < 2) return canSlap; // return if 1 or less cards
    
    // checks if two false slaps in a row
    if (justFalseSlapped && slapper != -1) { 
        slapPunishment(slapper);
        // console.log('Double slapped');
        return canSlap;
    }

    const topCard = pile[pile.length - 1].split('-')[1];
    const secondCard = pile[pile.length - 2].split('-')[1];

    // Check for doubles
    if (topCard === secondCard) {
        canSlap = 1;
    }

    // Check for marriage
    if ((topCard == 'K' && secondCard == 'Q') || (topCard == 'Q' && secondCard == 'K')) {
        canSlap = 4;
    }

    // Check for sandwich
    if (pile.length >= 3) {
        const thirdCard = pile[pile.length - 3].split('-')[1];
        if (topCard === thirdCard) {
            canSlap = 2;
        }
    }

    // Check for mega sando
    const bottomCard = pile[0].split('-')[1];
    if (topCard === bottomCard) {
        canSlap = 3;
    }

    // If correct slap for player, give them pile
    if (canSlap != -1 && slapper != -1) {
        // console.log('Line 262: ' + canSlap);
        givePileTo(slapper);
        return canSlap;
    }

    // Punishment if you can't slap
    if ( canSlap == -1 && slapper != -1) {
        slapPunishment(slapper);
    }
    // console.log('Line 272: ' + canSlap);
    return canSlap;
}

// Plays card for certain player
async function handleTurn(player) {
    const card = playerHands[player].shift(); // Top card of player hand
    console.log('Player ' + player + ' plays ' + card);
    pile.push(card); // Add to pile
    justFalseSlapped = false; // Reset false slap tracker
    io.emit('showCardCount', playerHands[0].length, playerHands[1].length);
    // If a face has been played decrement turns available to play
    if (facePlayed) {
        faceCardTurns -= 1;
        // console.log('face card turns is ' + faceCardTurns);
    }

    // Get name of top card
    let topCard = pile[pile.length - 1]
    
    // Check if top is face
    topIsFace = isFace(topCard);
    if (topIsFace) {
        facePlayed = true; // Set true once one face has been played
        faceCardTurns = faceCardLimit(topCard);
        // console.log('NEW face card turns is ' + faceCardTurns);
    }

    io.emit('updatePile', topCard);
    // Check if face card turns has hit 0 and give pile if it has
    if (facePlayed && faceCardTurns == 0 && checkForSlap(-1) == -1) {
        await sleep(2000);
        if (currentPlayer == 1)
            givePileTo(0);
        else
            givePileTo(1);
    }

    // Checks if game is over
    let winner = checkForWin();
    if (winner != -1) {
        endGame(winner);
    }

    // Swaps current player if a face hasn't been played or the top card is a face
    // Doesn't swap if the middle pile was just taken
    if ((topIsFace || !facePlayed) && pile.length != 0) {
        if (currentPlayer == 0)
            currentPlayer = 1;
        else
            currentPlayer = 0;
    }

    io.emit('isTurn', currentPlayer + 1);
}