export const PuyoType = {
  Red: 'R',
  Green: 'G',
  Blue: 'B',
  Yellow: 'Y',
  Purple: 'P',
  Garbage: 'J',
  Hard: 'H',
  Point: 'N',
  Stone: 'T',
  Sun: 'S',
  Block: 'L',
  None: '0',
};

export function isColored(color: string): boolean {
  switch (color) {
    case PuyoType.Red:
    case PuyoType.Green:
    case PuyoType.Blue:
    case PuyoType.Yellow:
    case PuyoType.Purple:
      return true;
    default:
      return false;
  }
}

export class Puyo {
  /**
   * A character that corresponds to a color. See PuyoType
   */
  public p: string;

  /**
   * Column position of the Puyo
   */
  public x: number;

  /**
   * Row position of the Puyo
   */
  public y: number;

  /**
   * New row position of the Puyo when drop distance is calculated.
   */
  public newY: number;

  /**
   * The combination of connections this Puyo has to surrounding Puyos.
   */
  public connections: string;

  /**
   * A Puyo data object representing a field cell. Used in Field.js
   * @param color - 1 letter character from PuyoType
   * @param x - Column position of the Puyo
   * @param y - Row position of the Puyo
   */
  public constructor(color: string, x: number, y: number) {
    this.p = color;
    this.x = x;
    this.y = y;
    this.newY = y;
    this.connections = 'n';
  }

  public get isEmpty(): boolean {
    return this.p === PuyoType.None;
  }

  public get isColored(): boolean {
    return this.p === PuyoType.Red || this.p === PuyoType.Green || this.p === PuyoType.Blue || this.p === PuyoType.Yellow || this.p === PuyoType.Purple;
  }

  public get isGarbage(): boolean {
    return this.p === PuyoType.Garbage || this.p === PuyoType.Hard;
  }

  public get isBlock(): boolean {
    return this.p === PuyoType.Block;
  }

  public get isStone(): boolean {
    return this.p === PuyoType.Stone;
  }

  /**
   * Converts 1 letter color code to full name for use in selecting the correct sprite filenames.
   * @return The "full" name of the cell's color
   */
  public get name(): string {
    switch (this.p) {
      case PuyoType.Red:
        return 'red';
      case PuyoType.Green:
        return 'green';
      case PuyoType.Blue:
        return 'blue';
      case PuyoType.Yellow:
        return 'yellow';
      case PuyoType.Purple:
        return 'purple';
      case PuyoType.Garbage:
        return 'garbage';
      case PuyoType.Hard:
        return 'hard';
      case PuyoType.Block:
        return 'block';
      case PuyoType.Stone:
        return 'stone';
      default:
        return 'spacer';
    }
  }
}
