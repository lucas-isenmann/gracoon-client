import { AreaIndex, Percentage } from "../../generators/attribute";
import { GraphModifyer } from "../modifyer";

export const intoTournament = new GraphModifyer(
    "into_tournament",
    "Into tournament",
    `For every pair of non adjacent vertices, add an arc with random orientation.
    Thus the graph becomes a tournament.`,
     [new AreaIndex("area")]);


export const removeRandomLinks = new GraphModifyer(
    "removeRandomLinks",
    "Remove random links",
    `For every link, remove it with a certain probability.`,
        [new AreaIndex("area"), new Percentage("p")]);