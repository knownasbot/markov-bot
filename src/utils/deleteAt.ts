interface String {
    deleteAt(index: number): string
}

String.prototype.deleteAt = function(index) {
    return this.substring(0, index) + this.substring(index + 1);
}