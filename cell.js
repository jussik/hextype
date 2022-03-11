import { GameObject } from "./gameObject.js";

export class Cell extends GameObject {
    map;
    x;
    y;
    enemy;
    health;
    heat;
    visible;
    word;
    combatWord;
    inCombat;

    constructor(game, map, x, y, word, enemy) {
        super(game);

        this.map = map;
        this.x = x;
        this.y = y;
        this.enemy = enemy;
        this.health = enemy;
        this.heat = 0;
        this.visible = false;
        this.word = word;
        this.combatWord = null;
        this.inCombat = false;
    }

    show() {
        if (this.visible)
            return;

        this.visible = true;
        this.events.dispatchEvent(new CellEvent(CellEvents.Shown, this));
    }

    damageCell() {
        this.health--;
        if (this.health > 0) {
            this.combatWord = this.map.getWord(this.enemy);
            this.inCombat = true;
        } else {
            this.combatWord = null;
            this.inCombat = false;
        }
        this.events.dispatchEvent(new CellEvent(CellEvents.Damaged, this));
    }
}

export const CellEvents = {
    Shown: "cell.shown",
    Damaged: "cell.damaged"
}

export class CellEvent extends Event {
    cell;
    constructor(type, cell) {
        super(type);
        this.cell = cell;
    }
}
