import CommandInterface from "./CommandInterface";

export default interface SubCommandInterface extends CommandInterface {
    type: "SUB_COMMAND";
};