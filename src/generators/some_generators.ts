import { GeneratorId } from "gramoloss";
import { Integer, Percentage } from "./attribute";
import { GraphGenerator } from "./generator";


const independentGenerator = new GraphGenerator(GeneratorId.IndependentCircle, "independent", [new Integer("n", 3)])
const cliqueGenerator = new GraphGenerator(GeneratorId.CliqueCircle, "clique Kn", [new Integer("n", 3)])
const randomTournament = new GraphGenerator(GeneratorId.RandomTournament, "random tournament", [new Integer("n", 3)])
const randomGNP = new GraphGenerator(GeneratorId.RandomGNP, "GNP", [new Integer("n", 3), new Percentage("p")]);
const randomStar = new GraphGenerator(GeneratorId.Star, "star", [new Integer("n", 3)])
const completeBipartite = new GraphGenerator(GeneratorId.CompleteBipartite, "complete bipartie Knm", [new Integer("n",1),new Integer("m",1)]);
const gridGenerator = new GraphGenerator(GeneratorId.Grid, "grid", [new Integer("n (column)",1),new Integer("m (row)",1)]);
const aztecDiamondGenerator = new GraphGenerator(GeneratorId.AztecDiamond, "aztecDiamond", [new Integer("n",1)]);

export let generators_available = new Array<GraphGenerator>();
generators_available.push(independentGenerator);
generators_available.push(cliqueGenerator);
generators_available.push(randomGNP);
generators_available.push(randomStar);
generators_available.push(completeBipartite);
generators_available.push(gridGenerator);
generators_available.push(randomTournament);
generators_available.push(aztecDiamondGenerator);

