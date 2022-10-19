export class BaseSpecialEvent {
    public id: string;
    public description: string;

    constructor(id: string, description: string) {
        this.id = id;
        this.description = description;
    }
}