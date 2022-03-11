export class GameObject {
    /** @type Game */
    game;
    /** @type EventTarget */
    get events() { return this.game.events; }
    /** @type number */
    get state() { return this.game.state; }
    
    constructor(game) {
        this.game = game;
    }
}