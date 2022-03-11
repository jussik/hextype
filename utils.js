export function seedRand(a) {
    // mulberry32 RNG
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function shuffleArray(a, rand) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

export function isWordChar(key) {
    if (key === "-")
        return true;
    if (key.length !== 1)
        return false;
    const charCode = key.toLowerCase().charCodeAt(0);
    return charCode >= 97 && charCode <= 122;
}