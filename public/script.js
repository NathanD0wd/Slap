// Server info
const socket = io();
let playerNumber = null;
let player1Name = null;
let player2Name = null;

let gameRunning = false;
let currentPlayer = 0; 
const MAX_EVENTS_SHOWED = 12;


// Utility sleep function that returns a promise
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// When a player joins get a name
function askPlayerName() {
    let playerName = '';

    while (playerName === '' || playerName.length > 15) {
        playerName = prompt('Please enter your name (max 15 characters):');

        if (playerName === null) {
            playerName = 'Player ' + playerNumber; // Default name if they cancel
            break;
        } else if (playerName.length > 15) {
            alert('Name too long! Please enter a name with a maximum of 15 characters.');
        } else if (playerName === '') {
            alert('Name cannot be empty! Please enter a valid name.');
        }
    }

    return playerName;
}

// When server assigns name, also locally assign name
socket.on('assignedName', (name, number) => {
    let happenings = document.getElementById('slaps');
    happenings.innerHTML += `<p>${name} joined the game</p>`;
    if (number == playerNumber) {
        happenings.innerHTML += `<p>That is to say, you did</p>`;
    }
    if (number == 1) {
        player1Name = name;
    }
    else {
        player2Name = name;
    }
});

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
        player.innerHTML = `<p>${player1Name}: ${player1CardCount}</p>`;
        opponent.innerHTML = `<p>${player2Name}: ${player2CardCount}</p>`;
    }
    else {
        player.innerHTML = `<p>${player2Name}: ${player2CardCount}</p>`;
        opponent.innerHTML = `<p>${player1Name}: ${player1CardCount}</p>`;
    }
});

// Updates center pile to show top card
socket.on('updatePile', async (topCard, player) => {
    // Select the div with id 'card-pile'
    let cardPileDiv = document.getElementById('card-pile');

    if (topCard.length == 0) { // Check there is a top card
        cardPileDiv.innerHTML = ``;
        return;
    }

    // Set the innerHTML to display the SVG
    cardPileDiv.innerHTML = `<img class="card-img" src="icons/cards/${topCard}.svg" alt="${topCard}">`;

    await sleep(500);

    // Update happenings if there is a player
    if (player != -1) {
        let happenings = document.getElementById('slaps');
        if (player == 1) {
            happenings.innerHTML += `<p>${player1Name} played ${topCard}</p>`;
        }
        else {
            happenings.innerHTML += `<p>${player2Name} played ${topCard}</p>`;
        }

        // Remove slaps if over threshold
        if (happenings.children.length > MAX_EVENTS_SHOWED) {
            happenings.removeChild(happenings.firstChild);
        }
    }
});

// Alerts new bottom card on false slap
socket.on('falseSlap', (card) => {
    console.log('False slap, new bottom card is ' + card);
    let happenings = document.getElementById('slaps');
    happenings.innerHTML += `<p>New bottom card is ${card}</p>`;

    // Remove slaps if over threshold
    if (happenings.children.length > MAX_EVENTS_SHOWED) {
        happenings.removeChild(happenings.firstChild);
    }
});

socket.on('slap', (slapType, slapper) => {
    console.log(slapType, slapper);
    let happenings = document.getElementById('slaps');
    switch(slapType) {
        case -1: 
            happenings.innerHTML += `<p>${slapper} did an oopsie...</p>`;
            break;
        case 1:
            happenings.innerHTML += `<p>${slapper} slapped a pair!</p>`;
            break;
        case 2:
            happenings.innerHTML += `<p>${slapper} slapped a sando!</p>`;
            break;
        case 3:
            happenings.innerHTML += `<p>${slapper} slapped a mega sando!</p>`;
            break;
        case 4:
            happenings.innerHTML += `<p>${slapper} slapped a marriage!</p>`;
            break;
        default: break;
    }

    // Removes events if over threshold
    console.log(happenings.children.length);
    if (happenings.children.length > MAX_EVENTS_SHOWED) {
        happenings.removeChild(happenings.firstChild);
    }
});

// Updates game has ended
socket.on('gameOver', (winner) => {
    gameRunning = false;
    alert('Player ' + winner + " is the winner!!!");
    updateVisibility();
    let happenings = document.getElementById('slaps');
    happenings.innerHTML = ``;
});

// Updates game has started
socket.on('gameStart', () => {
    gameRunning = true;
    updateVisibility();
});

socket.on('isTurn', (player) => {
    let playerCardArea = document.querySelector('.bottom-player-cards');
    let opponentCardArea = document.querySelector('.top-player-cards');
    if (player == playerNumber) {
        playerCardArea.classList.add('isTurn');
        opponentCardArea.classList.remove('isTurn');
    }
    else {
        playerCardArea.classList.remove('isTurn');
        opponentCardArea.classList.add('isTurn');
    }
});

// Starts game when enter is pressed and a game is not already running
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !gameRunning) {
        socket.emit('startGame');
    }
});

// Counts as slap when middle pile is pressed
document.getElementById('card-pile').addEventListener('click', () => {
    socket.emit('checkSlap',  playerNumber - 1);
});

// If space, slap for player
document.addEventListener('keydown', function(event) {
    if (event.key === ' ') {
        socket.emit('checkSlap',  playerNumber - 1);
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
document.querySelector('.bottom-player-cards').addEventListener('click', () => {
    if (gameRunning == 1) {
        socket.emit('playCard', playerNumber - 1);
    }
    else {
        socket.emit('startGame');
    }
});

// Restart the game with esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        socket.emit('endGame');
    }
});

// SERVER CONTROLS START HERE

// Upon entering website assigns player number and gets name input
socket.on('playerAssigned', (number) => {
    playerNumber = number;
    console.log('playerAssigned');
    let playerName = askPlayerName();
    socket.emit('setPlayerName', playerName, playerNumber);
    alert(`You are Player ${playerNumber}`);
});

// Tells new entrant room is full
socket.on('roomFull', () => {
    window.onload = function() {
        alert('The room is full. Please try again later.');
    };
});