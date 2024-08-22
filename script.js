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
    const card = playerHands[player].shift(); // Top card of player hand
    pile.push(card); // Add to pile
    // If a face has been played decrement turns available to play
    if (facePlayed) {
        faceCardTurns -= 1;
    }
    updatePile(); // Update pile
    // Check if face card turns has hit 0 and give pile if it has
    if (facePlayed && faceCardTurns == 0) {
        setTimeout(function() { // Give cards after 0.5 seconds
            if (currentPlayer == 1)
                givePileTo(0);
            else
                givePileTo(1);
        }, 500);
    }
    showCardCount(); // Update card counts
    justFalseSlapped = false; // Reset false slap tracker

    // Checks if game is over
    let winner = checkForWin();
    if (winner != -1) {
        endGame(winner);
    }

    // Swaps current player if a face hasn't been played or the top card is a face
    if (topIsFace || !facePlayed) {
        if (currentPlayer == 0)
            currentPlayer = 1;
        else
            currentPlayer = 0;
    }

    // If it's bot turn, simulate
    if (currentPlayer == 0) {
        botTurn();
    }
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
    
    // Check if top is face
    topIsFace = isFace(topCard);
    if (topIsFace) {
        facePlayed = true; // Set true once one face has been played
        faceCardTurns = faceCardLimit(topCard);
    }

    // Set the innerHTML to display the SVG
    console.log(topCard);
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

    facePlayed = false;
    faceCardTurns = 0;

    if (currentPlayer == 0) {
        setTimeout(function() {
            botTurn();
        }, 400);
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
    if (pile.length < 2) return canSlap; // return if 1 or less cards
    
    // checks if two false slaps in a row
    if (justFalseSlapped && slapper != -1) { 
        slapPunishment(slapper);
        return;
    }

    const topCard = pile[pile.length - 1].split('-')[1];
    const secondCard = pile[pile.length - 2].split('-')[1];

    // Check for doubles
    if (topCard === secondCard) {
        canSlap = true;
    }

    // Check for marriage
    if ((topCard == 'K' && secondCard == 'Q') || (topCard == 'Q' && secondCard == 'K')) {
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
        return canSlap;
    }

    // Punishment if you can't slap
    if ( !canSlap && slapper != -1) {
        slapPunishment(slapper);
    }

    return canSlap;
}

// Simulate the bots turn
function botTurn() {
    // PROBLEM HERE: calling botTurn in the handleTurn call, so there are nested slap checks when its facing a face card
    setTimeout(function() { // Computer plays card after 1.0 second
        if (currentPlayer == 0)
            handleTurn(currentPlayer);
    }, 500);
    setTimeout(function() { // Computer slaps after 0.4 seconds
        if (checkForSlap(-1)) {
            givePileTo(0);
        }
    }, 1000);
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
    if (currentPlayer === 1 && gameRunning == 1) {
        handleTurn(currentPlayer);
        setTimeout(function() { // Computer slaps after 0.4 seconds
            if (checkForSlap(-1))
                givePileTo(0);
        }, 400);
    }
});

// Restart the game with esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        endGame("No one");
    }
});