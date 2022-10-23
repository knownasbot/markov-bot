import CommandInterface from "./CommandInterface";

export default interface SubCommandGroupInterface extends CommandInterface {
    type: "SUB_COMMAND_GROUP";
};