import rawMoveData from "./moveData.json";
import type { MoveDataFile, MoveDataRecord } from "../types/pokemon";

const moveData = rawMoveData as MoveDataFile;

export function getMoveDataFile(): MoveDataFile {
  return moveData;
}

export function getMoveById(moveId: number | string | undefined): MoveDataRecord | undefined {
  if (moveId === undefined || moveId === "") {
    return undefined;
  }

  return moveData.moves[`${moveId}`];
}

export function getMoveRecords(): MoveDataRecord[] {
  return Object.values(moveData.moves).sort((firstMove, secondMove) => firstMove.id - secondMove.id);
}
