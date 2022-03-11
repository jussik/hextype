import { seedRand, shuffleArray } from "./utils.js";
import { words } from "./words.js";
import { Cell } from "./cell.js";
import { Player } from "./player.js";

export class Map {
    game;
    columns;
    rows;
    seed;
    rand;
    player;
    cells;
    nextWordCoords;
    wordsByDifficulty;

    constructor(game, columns, rows, seed) {
        this.game = game;
        this.columns = columns;
        this.rows = rows;
        this.seed = seed;

        this.rand = seedRand(seed);
        shuffleArray(words, this.rand);

        this.nextWordCoords = {};
        this.time = 0;
        this.timeUpdater = null;

        // prepare words
        this.wordsByDifficulty = []; // 0 to 5 based on length
        for (let word of words) {
            let diff = word.length - 2;
            diff = diff / 2 >> 0;
            if (diff > 5)
                diff = 5;
            (this.wordsByDifficulty[diff] ??= []).push(word);
        }

        // prepare enemies
        const enemyLevels = [12, 6, 3, 2, 2]; // 12 level 1s, 6 levels 2s, etc.
        this.maxXp = 0;
        const enemies = enemyLevels.reduce((out, count, index) => {
            for (let i = 0; i < count; i++) {
                out.push(index + 1);
                this.maxXp += index + 1;
            }
            return out;
        }, []);

        function isEnemyAllowed(x, y) {
            return y > 0 && y < rows - 1 && x > 0 && x < columns - 1;
        }

        let enemySlots = enemies.length;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                if (isEnemyAllowed(x, y)) {
                    if (enemySlots > 0) {
                        enemySlots--; // reserve slot
                    } else {
                        enemies.push(0); // fill enough non-enemy slots for whole grid excluding edge cells
                    }
                }
            }
        }
        shuffleArray(enemies, this.rand);

        // prepare cells
        this.cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                let enemy = 0;
                if (isEnemyAllowed(x, y)) {
                    enemy = enemies.shift();
                }
                // cell word difficulty goes up by a level every 2 cells from edge
                const wordDiff = Math.min(6, y, rows - y - 1, x, columns - x - 1) / 2 >> 0;
                this.cells.push(new Cell({
                    game: this.game,
                    map: this,
                    x: x,
                    y: y,
                    enemy: enemy,
                    health: enemy,
                    heat: 0,
                    visible: false,
                    element: null,
                    word: this.getWord(wordDiff),
                    combatWord: null,
                    inCombat: false
                }));
            }
        }

        // calculate heat and draw cells
        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                const cell = this.cells[this.coordsToIndex(x, y)];
                for (let i = 0; i < 6; i++) {
                    const [nx, ny] = this.offsetCoords(x, y, i);
                    if (this.isValidCell(nx, ny)) {
                        cell.heat += this.cells[this.coordsToIndex(nx, ny)].enemy;
                    }
                }
                cell.element = cell.drawCell();
            }
        }

        // reveal border cells
        for (let x = 0; x < columns; x++) {
            this.cells[this.coordsToIndex(x, 0)].show();
            this.cells[this.coordsToIndex(x, rows - 1)].show();
        }
        for (let y = 0; y < rows; y++) {
            this.cells[this.coordsToIndex(0, y)].show();
            this.cells[this.coordsToIndex(columns - 1, y)].show();
        }

        // create player
        this.player = new Player({
            game: this.game,
            x: 0,
            y: 0,
            level: 1,
            health: 10,
            xp: 0,
            maxXp: this.maxXp,
            alive: true,
            won: false
        });

        this.tryMovePlayer(0, 0);
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.columns && y >= 0 && y < this.rows;
    }

    static offsetX = [0, 1, 0, -1, -1, -1];
    static offsetY = [-1, 0, 1, 1, 0, -1];

    offsetCoords(x, y, pos) {
        if (y % 2 === 0 || pos === 1 || pos === 4)
            return [x + Map.offsetX[pos], y + Map.offsetY[pos]];
        else
            return [x + Map.offsetX[pos] + 1, y + Map.offsetY[pos]];
    }

    coordsToIndex(x, y) {
        return x + this.columns * y;
    }

    // getWord returns any random word not on the grid
    getWord(difficulty) {
        return this.wordsByDifficulty[difficulty].pop();
    }

    tryMovePlayer(targetX, targetY) {
        if (!this.isValidCell(targetX, targetY))
            return false;

        // handle combat
        let canMove = true;
        const targetCell = this.cells[this.coordsToIndex(targetX, targetY)];
        if (targetCell.enemy && targetCell.health > 0) {
            targetCell.damageCell();
            if (targetCell.health > 0) {
                // target still alive, damage player for difference between levels
                this.player.damagePlayer(targetCell.enemy - this.player.level);
                canMove = false;
            } else {
                // target dead
                this.player.addPlayerXp(targetCell.enemy);
            }
        }

        if (canMove) {
            // update player
            this.player.x = targetX;
            this.player.y = targetY;
            for (let act of document.getElementsByClassName("active")) {
                act.classList.remove("active");
            }
            targetCell.element.classList.add("active");
            targetCell.show();

            // update camera
            this.game.ui.worldElem.style.left = "calc(50vw - " + (targetCell.element.offsetLeft + 63) + "px";
            this.game.ui.worldElem.style.top = "calc(50vh - " + (targetCell.element.offsetTop + 107) + "px";
        }

        // draw/update adjacent cell labels
        this.game.ui.labelsContainer.innerHTML = "";
        this.nextWordCoords = {};
        for (let i = 0; i < 6; i++) {
            const coords = this.offsetCoords(this.player.x, this.player.y, i);
            if (this.isValidCell(...coords)) {
                const index = this.coordsToIndex(...coords);
                const adjCell = this.cells[index];
                const word = adjCell.combatWord ?? adjCell.word;
                this.nextWordCoords[word] = coords;
                adjCell.drawOffsetLabel(this.player.x, this.player.y, i, word);
            }
        }

        return canMove;
    }

    updateTime() {
        if (!this.player.alive || this.player.won) {
            clearInterval(this.timeUpdater);
            return;
        }

        let seconds = this.time % 60;
        let minutes = Math.floor(this.time / 60);
        if (seconds < 10)
            seconds = "0" + seconds;
        this.game.ui.timeElem.textContent = `${minutes}:${seconds}`;
        this.time++;
    }

    startTimer() {
        if (this.timeUpdater)
            return;

        this.timeUpdater = setInterval(() => this.updateTime(), 1000);
        this.updateTime();
    }
}