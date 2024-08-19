// Basic Game Variables
let gameRunning = 0; // 1 if running, 0 if not
let deck = []; // Filled with standard deck
let playerHands = [[], []]; // [0] is the computer, [1] is the player
let pile = []; // Holds center pile
let currentPlayer = 1; // 0 for computer, 1 for player
let topIsFace = false;
let facePlayed = false;
let faceCardTurns = 0; // Remaining turns after face card is played
let justFalseSlapped = false; // True if there was a false slap on current top card
// Prevents slapping when new bottom card fulfils top bottom condition

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
    playerHands[0] = deck.slice(0, 26); // Half deck for computer
    playerHands[1] = deck.slice(26);    // Half deck for player
    gameRunning = 1;
}

// Displays cards in each players hands
function showCardCount() {
    let player = document.getElementById('your-icon');
    let computer = document.getElementById('player-1');

    let playerCards = playerHands[1].length;
    let computerCards = playerHands[0].length;

    player.innerHTML = `<p>${playerCards}</p>`;
    computer.innerHTML = `<p>${computerCards}</p>`;
}

// Checks if card is a face
function isFace(cardValue) {
    justVal = cardValue.split('-')[1];
    return ['J', 'Q', 'K', 'A'].some(face => justVal.includes(face));
}

// Returns card limit of given face
function faceCardLimit(cardValue) {
    switch (cardValue) {
        case 'J': return 1;
        case 'Q': return 2;
        case 'K': return 3;
        case 'A': return 4;
        default: return 0;
    }
}

// Game Break Down
function checkForWin() {
    // Check if a slap is available
    if (checkForSlap(-1)) {
        return -1;
    }
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
    if (emptyHandCount == playerHands.length - 1) {
        return winner;
    }
    return -1;
}

// GBD
function endGame(winner) {
    gameRunning = 0;
    deck = [];
    playerHands = [[], []];
    pile = [];
    currentPlayer = 1;
    showCardCount();
    updatePile();
    alert(winner + " is the winner!!");
}

// Plays card for certain player
function handleTurn(player) {
    const card = playerHands[player].shift();
    pile.push(card);
    updatePile();
    showCardCount();
    justFalseSlapped = false;

    // Checks if game is over
    let winner = checkForWin();
    if (winner != -1) {
        endGame(winner);
    }

    // Swaps current player
    if (currentPlayer == 0) { 
        currentPlayer = 1;
    }
    else {
        currentPlayer = 0;
    }

    if (topIsFace) {
        handleFace(currentPlayer);
    }
    return card;
}

// Updates center pile to show top card
function updatePile() {
    // Select the div with id 'card-pile'
    let cardPileDiv = document.getElementById('card-pile');

    if (pile.length == 0) { // Check there is a top card
        cardPileDiv.innerHTML = ``;
        return;
    }
    // Get name of top card
    let topCard = pile[pile.length - 1]
    topIsFace = isFace(topCard);
    // Set the innerHTML to display the SVG
    cardPileDiv.innerHTML = `<img id="card-img" src="icons/cards/${topCard}.svg" alt="${topCard}">`;
}

// Gives middle pile to specified player
function givePileTo(player) {
    playerHands[player] = playerHands[player].concat(pile);
    pile = [];
    updatePile();
    showCardCount();
    currentPlayer = player;

    let winner = checkForWin();
    if (winner != -1) {
        endGame(winner);
    }
}

// Places card on bottom of deck for incorrect slapper
function slapPunishment(player) {
    justFalseSlapped = true;
    const card = playerHands[player].shift();
    pile.unshift(card);
    alert("New bottom card is " + card);
    showCardCount();
    let winner = checkForWin();
    if (winner != -1) {
        endGame(winner);
    }
}

// Checks if slap is possible
// Gives pile to slapper if it is, replaces bottom card if not
function checkForSlap(slapper) {
    canSlap = false;

    if (justFalseSlapped && slapper != -1) {
        slapPunishment(slapper);
        return;
    }

    if (pile.length < 2) return canSlap;

    const topCard = pile[pile.length - 1].split('-')[1];
    const secondCard = pile[pile.length - 2].split('-')[1];

    // Check for doubles
    if (topCard === secondCard) {
        canSlap = true;
    }

    // Check for sandwich
    if (pile.length >= 3) {
        const thirdCard = pile[pile.length - 3].split('-')[1];
        if (topCard === thirdCard) {
            canSlap = true;
        }
    }

    // Check for top and bottom match
    const bottomCard = pile[0].split('-')[1];
    if (topCard === bottomCard) {
        canSlap = true;
    }

    // If correct slap for player, give them pile
    if (canSlap && slapper != -1) {
        givePileTo(slapper);
    }

    if ( !canSlap && slapper != -1) {
        slapPunishment(slapper);
    }

    return canSlap;
}

// Starts game when enter is pressed and a game is not already running
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && gameRunning == 0) {
        // Initialize Game
        createDeck();
        dealCards();
        updatePile();
        showCardCount();
    }
});

// Counts as slap when middle pile is pressed
document.getElementById('card-pile').addEventListener('click', () => {
    checkForSlap(1);
});

// If space 
document.addEventListener('keydown', function(event) {
    if (event.key === ' ') {
        checkForSlap(1);
    }
});


// If player area is pressed, plays card
document.getElementById('your-player-area').addEventListener('click', () => {
    if (currentPlayer === 1) {
        handleTurn(currentPlayer);
        setTimeout(function() { // Computer slaps after 0.5 seconds
            if (checkForSlap(-1))
                givePileTo(0);
        }, 400);
        setTimeout(function() { // Computer plays card after another 1.5 seconds
            if (currentPlayer == 0)
                handleTurn(currentPlayer);
        }, 1000);
    }
});

// Restart the game with esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        endGame("No one");
    }
});