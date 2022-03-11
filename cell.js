import { GameObject } from "./gameObject.js";

export class Cell extends GameObject {
    x;
    y;
    enemy;
    health;
    heat;
    visible;
    /** @deprecated */
    element;
    word;
    combatWord;
    inCombat;

    constructor(game, opts) {
        super(game);
        
        // TODO: explicit arguments
        Object.assign(this, opts);
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
            this.combatWord = this.game.map.getWord(this.enemy);
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
