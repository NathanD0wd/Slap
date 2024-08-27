// Server info
const socket = io();
let playerNumber = null;

let gameRunning = false;
let currentPlayer = 0; 
let eventFlag = true; // Pauses all events while in sleep

// Function to hide and display certain elements while game is or isn't running
function updateVisibility() {
    const elementsForPlay = document.querySelectorAll('.inPlay');
    const elementsForRest = document.querySelectorAll('.notInPlay');
    
    if (gameRunning) {
        elementsForRest.forEach(element => element.classList.add('hidden'));
        elementsForPlay.forEach(element => element.classList.remove('hidden'));
    } else {
        elementsForRest.forEach(element => element.classList.remove('hidden'));
        elementsForPlay.forEach(element => element.classList.add('hidden'));
    }
}

// Displays cards in each players hands
socket.on('showCardCount', (player1CardCount, player2CardCount) => {
    let player = document.getElementById('bottom-player-area');
    let opponent = document.getElementById('top-player-area');

    if (playerNumber == 1) { 
        player.innerHTML = `<p>Player 1: ${player1CardCount}</p>`;
        opponent.innerHTML = `<p>Player 2: ${player2CardCount}</p>`;
    }
    else {
        player.innerHTML = `<p>Player 1: ${player2CardCount}</p>`;
        opponent.innerHTML = `<p>Player 2: ${player1CardCount}</p>`;
    }
});

// Updates center pile to show top card
socket.on('updatePile', (topCard) => {
    // Select the div with id 'card-pile'
    let cardPileDiv = document.getElementById('card-pile');

    if (topCard.length == 0) { // Check there is a top card
        cardPileDiv.innerHTML = ``;
        return;
    }

    // Set the innerHTML to display the SVG
    cardPileDiv.innerHTML = `<img class="card-img" src="icons/cards/${topCard}.svg" alt="${topCard}">`;
});

socket.on('falseSlap', (card) => {
    alert("New bottom card is " + card);
});

socket.on('gameOver', (winner) => {
    gameRunning = false;
    alert('Player ' + winner + " is the winner!!!");
    updateVisibility();
});

socket.on('gameStart', () => {
    gameRunning = true;
    updateVisibility();
});

// Starts game when enter is pressed and a game is not already running
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !gameRunning) {
        socket.emit('startGame');
    }
});

// Counts as slap when middle pile is pressed
document.getElementById('card-pile').addEventListener('click', () => {
    socket.emit('slap',  playerNumber - 1);
});

// If space, slap for player
document.addEventListener('keydown', function(event) {
    if (event.key === ' ') {
        socket.emit('slap',  playerNumber - 1);
    }
});

// If player area is pressed, plays card
// If game isn't running, starts a game. Used for phone play
document.getElementById('bottom-player-area').addEventListener('click', () => {
    if (gameRunning == 1) {
        socket.emit('playCard', playerNumber - 1);
    }
    else {
        socket.emit('startGame');
    }
});

// Plays card when press onto player pile
// document.getElementById('bottom-player-cards').addEventListener('click', () => {
//     if (gameRunning == 1) {
//         socket.emit('playCard', playerNumber - 1);
//     }
//     else {
//         socket.emit('startGame');
//     }
// });

// Restart the game with esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        socket.emit('endGame');
    }
});

// SERVER CONTROLS START HERE

// Upon entering website assigns player number
socket.on('playerAssigned', (number) => {
    playerNumber = number;
    alert(`You are Player ${playerNumber}`);
});

socket.on('roomFull', () => {
    window.onload = function() {
        alert('The room is full. Please try again later.');
    };
});