
export default class LookUp {
    constructor(size) {
        this.size = size;
        this.lookup = new Float32Array(size);
        for (let i = 0; i <= size + 1; i++) {
            this.lookup[i] = Math.pow(1 + Math.pow(i / size, 10), 1 / 10);
        }
    }

    distance(x, y) {
        if (y > x) {
            [x, y] = [y, x];
        }
        r = y / x;
        pos = r * this.size;
        i = Math.round(pos);
        interpolation = this.lookup[i] + (pos-i) * (this.lookup[i+1] - this.lookup[i]);
        return x * interpolation;
    }
}
