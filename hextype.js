const COLUMNS = 12;
const ROWS = 10;
const SEED = Date.now();

function seedRand(a) {
    // mulberry32 RNG
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

function isValid(x, y) {
    return x >= 0 && x < COLUMNS && y >= 0 && y < ROWS;
}

function drawCell(cell) {
    const { x, y } = cell;

    const container = document.createElement("div");
    container.style.left = x * 100 + (y % 2) * 50 + "px";
    container.style.top = y * 91 + "px";
    container.className = "cell";

    const hex = document.createElement("div");
    hex.innerHTML = "&#x2B22;";
    hex.className = "hex";
    container.appendChild(hex);

    if (cell.heat) {
        const heat = document.createElement("div");
        heat.textContent = cell.heat;
        heat.className = "annotation heat";
        container.appendChild(heat);
    }

    if (cell.enemy) {
        const enemy = document.createElement("div");
        enemy.textContent = cell.enemy;
        enemy.className = "annotation enemy";
        container.appendChild(enemy);
    }

    window.cellsContainer.appendChild(container);
    return container;
}

function drawOffsetLabel(x, y, pos, text, additionalClass) {
    if (!text)
        return;

    const div = document.createElement("div");

    let left = x * 100 + (y % 2) * 50 + 63;
    if (pos < 3) {
        left += 10;
        if (pos === 1)
            left += 50;
        div.style.left = left + "px";
    } else {
        left -= 10;
        if (pos === 4)
            left -= 50;
        div.style.right = `calc(100% - ${left}px)`;
    }

    let yPos = pos > 2 ? 5 - pos : pos;
    let top = (y + yPos) * 91;
    div.style.top = top + "px";

    div.textContent = text;
    div.className = "label";
    if (pos > 2)
        div.className += " left";
    if (additionalClass)
        div.classList.add(additionalClass);
    window.labelsContainer.appendChild(div);
}

const offsetX = [0, 1, 0, -1, -1, -1];
const offsetY = [-1, 0, 1, 1, 0, -1];
function offsetCoords(x, y, pos) {
    if (y % 2 === 0 || pos === 1 || pos === 4)
        return [x + offsetX[pos], y + offsetY[pos]];
    else
        return [x + offsetX[pos] + 1, y + offsetY[pos]];
}

function coordsToIndex(x, y) {
    return x + COLUMNS * y;
}

function show(cell) {
    if (cell.visible)
        return;

    cell.visible = true;
    cell.element.classList.add("visible");
    if (cell.heat === 0) {
        for (let i = 0; i < 6; i++) {
            const [nx, ny] = offsetCoords(cell.x, cell.y, i);
            if (isValid(nx, ny)) {
                const nextCell = cells[coordsToIndex(nx, ny)];
                if (!nextCell.visible) {
                    show(nextCell);
                }
            }
        }
    }
}

function damagePlayer(amount) {
    player.health -= amount;
    healthElem.textContent = player.health;
    if (amount <= 0)
        return;

    document.body.classList.add("hurt");
    setTimeout(() => document.body.classList.remove("hurt"), 10);

    if (player.health <= 0) {
        player.alive = false;
        document.body.classList.add("dead");
        promptElem.textContent = ":(";
    }
}
function addPlayerXp(amount) {
    player.xp += amount;
    xpElem.textContent = player.xp;
    player.level = (player.xp / 10 >> 0) + 1;
    levelElem.textContent = player.level;
    if (player.xp >= maxXp) {
        player.won = true;
        document.body.classList.add("won");
        promptElem.textContent = ":)";
    }
}
function damageCell(cell) {
    cell.health -= player.level;
    if (cell.health > 0) {
        cell.combatWord = getRandomWord();
        cell.element.classList.add("inCombat");
        cell.inCombat = true;
        // 30% to 80% visible
        let dmg = cell.health / cell.enemy * 50 + 30
        cell.element.querySelector(".hex").style = `background: -webkit-linear-gradient(#333 0%, #333 ${dmg}%, #555 ${dmg}%, #555);`
    } else {
        cell.combatWord = null;
        cell.element.classList.remove("inCombat");
        cell.inCombat = false;
        cell.element.querySelector(".hex").style = "";
    }
}


const rand = seedRand(SEED);
shuffle(words);

// getRandomWord returns any random word not on the grid
const randMin = COLUMNS * ROWS;
function getRandomWord() {
    const ix = randMin + Math.floor(rand() * (words.length - randMin));
    return words[ix];
}


// prepare enemies
const enemyLevels = [12, 6, 3, 2, 2]; // 12 level 1s, 6 levels 2s, etc.
let maxXp = 0;
const enemies = enemyLevels.reduce((out, count, index) => {
    for (let i = 0; i < count; i++) {
        out.push(index + 1);
        maxXp += index + 1;
    }
    return out;
}, []);
function isEnemyAllowed(x, y) {
    return y > 0 && y < ROWS - 1 && x > 0 && x < COLUMNS - 1;
}
let enemySlots = enemies.length;
for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLUMNS; x++) {
        if (isEnemyAllowed(x, y)) {
            if (enemySlots > 0) {
                enemySlots--; // reserve slot
            } else {
                enemies.push(0); // fill enough non-enemy slots for whole grid excluding edge cells
            }
        }
    }
}
shuffle(enemies);

// prepare cells
const cells = [];
for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLUMNS; x++) {
        let enemy = 0;
        if (isEnemyAllowed(x, y)) {
            enemy = enemies.shift();
        }
        cells.push({
            x: x,
            y: y,
            enemy: enemy,
            health: enemy,
            heat: 0,
            visible: false,
            element: null,
            combatWord: null,
            inCombat: false
        });
    }
}

// calculate heat and draw cells
for (let x = 0; x < COLUMNS; x++) {
    for (let y = 0; y < ROWS; y++) {
        const cell = cells[coordsToIndex(x, y)];
        for (let i = 0; i < 6; i++) {
            const [nx, ny] = offsetCoords(x, y, i);
            if (isValid(nx, ny)) {
                cell.heat += cells[coordsToIndex(nx, ny)].enemy;
            }
        }
        cell.element = drawCell(cell);
    }
}

// reveal border cells
for (let x = 0; x < COLUMNS; x++) {
    show(cells[coordsToIndex(x, 0)]);
    show(cells[coordsToIndex(x, ROWS - 1)]);
}
for (let y = 0; y < ROWS; y++) {
    show(cells[coordsToIndex(0, y)]);
    show(cells[coordsToIndex(COLUMNS - 1, y)]);
}

const player = {
    x: 0,
    y: 0,
    level: 1,
    health: 10,
    xp: 0,
    alive: true,
    won: false
};
let nextWordCoords;
function tryMovePlayer(targetX, targetY) {
    if (!isValid(targetX, targetY))
        return false;

    // handle combat
    let canMove = true;
    const targetCell = cells[coordsToIndex(targetX, targetY)];
    if (targetCell.enemy && targetCell.health > 0) {
        damageCell(targetCell);
        if (targetCell.health > 0) {
            // target still alive, damage player for difference between levels
            damagePlayer(targetCell.enemy - player.level);
            canMove = false;
        } else {
            // target dead
            addPlayerXp(targetCell.enemy);
        }
    }

    if (canMove) {
        // update player
        player.x = targetX;
        player.y = targetY;
        for (let act of document.getElementsByClassName("active")) {
            act.classList.remove("active");
        }
        targetCell.element.classList.add("active");
        show(targetCell);

        // update camera
        worldElem.style.left = "calc(50vw - " + (targetCell.element.offsetLeft + 63) + "px";
        worldElem.style.top = "calc(50vh - " + (targetCell.element.offsetTop + 107) + "px";
    }

    // draw/update adjacent cell labels
    window.labelsContainer.innerHTML = "";
    nextWordCoords = {};
    for (let i = 0; i < 6; i++) {
        const coords = offsetCoords(player.x, player.y, i);
        if (isValid(...coords)) {
            const index = coordsToIndex(...coords);
            const adjCell = cells[index];
            const word = adjCell.combatWord ?? words[index];
            nextWordCoords[word] = coords;
            drawOffsetLabel(player.x, player.y, i, word, adjCell.inCombat ? "inCombat" : "");
        }
    }

    return canMove;
}

tryMovePlayer(0, 0);
damagePlayer(0);
addPlayerXp(0);

let time = 0;
function updateTime() {
    if (!player.alive || player.won) {
        clearInterval(timeUpdater);
        return;
    }

    let seconds = time % 60;
    let minutes = Math.floor(time / 60);
    if (seconds < 10)
        seconds = "0" + seconds;
    timeElem.textContent = `${minutes}:${seconds}`;
    time++;
}
const timeUpdater = setInterval(updateTime, 1000);
updateTime();

let currentWord = "";
window.addEventListener("keydown", ev => {
    if (!player.alive)
        return;

    //console.log(ev);
    if (ev.keyCode >= 65 && ev.keyCode <= 90 || ev.key === "-") {
        // letter or hyphen
        currentWord += ev.key.toLowerCase();
    } else if (ev.keyCode === 32 || ev.keyCode === 13) {
        // space or enter
        if (currentWord) {
            const targetCoords = nextWordCoords[currentWord];
            if (targetCoords)
                tryMovePlayer(...targetCoords);
            else
                damagePlayer(1);
            currentWord = "";
        }
    } else if (ev.keyCode === 46 || (ev.ctrlKey && ev.keyCode === 8)) {
        // delete or ctrl+backspace - clear whole word
        currentWord = "";
    } else if (ev.keyCode === 8) {
        // backspace - remove last letter
        if (currentWord)
            currentWord = currentWord.substr(0, currentWord.length - 1);
    }
    currentWordElem.textContent = currentWord;
});
