export class GameObject {
    /** @type Game */
    game;
    /** @type EventTarget */
    get events() { return this.game.events; }
    
    constructor(game) {
        this.game = game;
    }
}