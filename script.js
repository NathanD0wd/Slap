// Basic Game Variables
let deck = [];
let playerHands = [[], []]; // [0] is the computer, [1] is the player
let pile = [];
let currentPlayer = 1; // 0 for computer, 1 for player
let isFaceCard = false;
let faceCardTurns = 0;
let GameRunning = 0;

// Utility Functions
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

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards() {
    playerHands[0] = deck.slice(0, 26); // Half deck for computer
    playerHands[1] = deck.slice(26);    // Half deck for player
    GameRunning = 1;
}

function playCard(player) {
    if (playerHands[player].length === 0) return null;
    const card = playerHands[player].shift();
    pile.push(card);
    updatePile();
    return card;
}

function updatePile() {
    const cardDisplay = document.getElementById('card-pile');
    const svgFilePath = `icons/${cardName}.svg`;

    fetch(svgFilePath)
        .then(response => response.text())
        .then(svgContent => {
            cardDisplay.innerHTML = svgContent;
        })
        .catch(error => console.error('Error loading SVG:', error));
}

function handleTurn() {
    const card = playCard(currentPlayer);
    const cardValue = card.split('-')[1];

    
}

function isFace(cardValue) {
    return ['J', 'Q', 'K', 'A'].includes(cardValue);
}

function faceCardLimit(cardValue) {
    switch (cardValue) {
        case 'J': return 1;
        case 'Q': return 2;
        case 'K': return 3;
        case 'A': return 4;
        default: return 0;
    }
}

function givePileTo(player) {
    playerHands[player] = playerHands[player].concat(pile);
    pile = [];
    updatePile();
}

function checkForSlap() {
    if (pile.length < 2) return;

    const topCard = pile[pile.length - 1].split('-')[0];
    const secondCard = pile[pile.length - 2].split('-')[0];

    // Check for doubles
    if (topCard === secondCard) {
        givePileTo(currentPlayer);
        return;
    }

    // Check for sandwich
    if (pile.length >= 3) {
        const thirdCard = pile[pile.length - 3].split('-')[0];
        if (topCard === thirdCard) {
            givePileTo(currentPlayer);
            return;
        }
    }

    // Check for top and bottom match
    const bottomCard = pile[0].split('-')[0];
    if (topCard === bottomCard) {
        givePileTo(currentPlayer);
    }
}

// Event Listeners
document.getElementById('card-pile').addEventListener('click', () => {
    checkForSlap();
    let gameOver = checkForWin();
    if (gameOver) {
        gameRunning = 0;
        deck = [];
        playerHands = [[], []];
        pile = [];
        currentPlayer = 1;
    }
});

document.getElementById('your-player-area').addEventListener('click', () => {
    if (currentPlayer === 1) {
        handleTurn();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && GameRunning == 0) {
        // Initialize Game
        createDeck();
        dealCards();
        updatePile();
    }
});

