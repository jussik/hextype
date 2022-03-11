import { seedRand, shuffleArray } from "./utils.js";
import { words } from "./words.js";
import { Cell, CellEvents } from "./cell.js";
import { Player, PlayerEvents } from "./player.js";
import { InputEvent } from "./game.js";
import { WordEvents } from "./wordPrompt.js";
import { GameObject } from "./gameObject.js";
import { GameState } from "./gameState.js";

export class Map extends GameObject {
    columns;
    rows;
    seed;
    rand;
    player;
    cells = [];
    wordTargets = {};
    time = 0;
    timeUpdater = null;
    wordsByDifficulty = [];

    constructor(game, columns, rows, seed) {
        super(game);

        this.columns = columns;
        this.rows = rows;
        this.seed = seed;
        this.rand = seedRand(seed);
        this.player = new Player(this.game);
    }
    
    create() {
        shuffleArray(words, this.rand);

        // prepare words, 0 to 5 based on length
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

        const isEnemyAllowed = (x, y) => {
            return y > 0 && y < this.rows - 1 && x > 0 && x < this.columns - 1;
        }

        let enemySlots = enemies.length;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.columns; x++) {
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
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.columns; x++) {
                let enemy = 0;
                if (isEnemyAllowed(x, y)) {
                    enemy = enemies.shift();
                }
                // cell word difficulty goes up by a level every 2 cells from edge
                const wordDiff = Math.min(6, y, this.rows - y - 1, x, this.columns - x - 1) / 2 >> 0;
                this.cells.push(new Cell(this.game, this, x, y, this.getWord(wordDiff), enemy));
            }
        }

        // calculate heat and draw cells
        for (let x = 0; x < this.columns; x++) {
            for (let y = 0; y < this.rows; y++) {
                const cell = this.cells[this.coordsToIndex(x, y)];
                for (let i = 0; i < 6; i++) {
                    const [nx, ny] = this.offsetCoords(x, y, i);
                    if (this.isValidCell(nx, ny)) {
                        cell.heat += this.cells[this.coordsToIndex(nx, ny)].enemy;
                    }
                }
            }
        }

        this.events.addEventListener(InputEvent.Character, () => this.start());
        this.events.addEventListener(WordEvents.Accepted, ev => this.onWordAccepted(ev.word));
        this.events.addEventListener(PlayerEvents.Hurt, () => {
            if (this.player.health <= 0) {
                this.setState(GameState.Failed);
            }
        });
        this.events.addEventListener(PlayerEvents.GainedXp, () => {
            if (this.player.xp >= this.maxXp) {
                this.setState(GameState.Won);
            }
        });
        this.events.addEventListener(CellEvents.Shown, ev => {
            if (ev.cell.heat === 0) {
                for (let i = 0; i < 6; i++) {
                    const [nx, ny] = this.offsetCoords(ev.cell.x, ev.cell.y, i);
                    if (this.isValidCell(nx, ny)) {
                        const nextCell = this.cells[this.coordsToIndex(nx, ny)];
                        if (!nextCell.visible) {
                            nextCell.show();
                        }
                    }
                }
            }
        });

        this.setState(GameState.Created);

        // reveal border cells
        for (let x = 0; x < this.columns; x++) {
            this.cells[this.coordsToIndex(x, 0)].show();
            this.cells[this.coordsToIndex(x, this.rows - 1)].show();
        }
        for (let y = 0; y < this.rows; y++) {
            this.cells[this.coordsToIndex(0, y)].show();
            this.cells[this.coordsToIndex(this.columns - 1, y)].show();
        }
        
        // set initial position
        this.tryMovePlayer(0, 0);
    }

    setState(state) {
        this.game.setState(state);
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
            targetCell.show();
            this.player.move(targetX, targetY);
        }

        // update possible word targets
        this.wordTargets = {};
        for (let i = 0; i < 6; i++) {
            const coords = this.offsetCoords(this.player.x, this.player.y, i);
            if (this.isValidCell(...coords)) {
                const index = this.coordsToIndex(...coords);
                const adjCell = this.cells[index];
                const word = adjCell.combatWord ?? adjCell.word;
                this.wordTargets[word] = {
                    x: this.player.x,
                    y: this.player.y,
                    cell: adjCell,
                    offset: i,
                    word: word
                };
            }
        }
        this.events.dispatchEvent(new MapEvent(MapEvents.WordTargetsUpdated, this));

        return canMove;
    }

    onWordAccepted(word) {
        const target = this.wordTargets[word];
        if (target) {
            this.tryMovePlayer(target.cell.x, target.cell.y);
        } else {
            // take damage equivalent to fighting strongest in combat enemy in range, or 1 if not in combat
            let dmg = 1;
            for (let { cell } of Object.values(this.wordTargets)) {
                if (cell.inCombat) {
                    dmg = Math.max(dmg, cell.enemy - this.player.level);
                }
            }
            this.player.damagePlayer(dmg);
        }
    }

    stepTime() {
        if (this.state !== GameState.Playing) {
            clearInterval(this.timeUpdater);
            return;
        }

        this.time++;
        
        this.events.dispatchEvent(new MapEvent(MapEvents.TimeUpdated, this));
    }

    start() {
        if (this.state === GameState.Created) {
            this.setState(GameState.Playing);
            this.timeUpdater = setInterval(() => this.stepTime(), 1000);
        }
    }
}

export const MapEvents = {
    WordTargetsUpdated: "map.wordTargetsUpdated",
    TimeUpdated: "map.timeUpdated"
}

export class MapEvent extends Event {
    map;
    constructor(type, map) {
        super(type);
        this.map = map;
    }
}
