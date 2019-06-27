export default class CoreSettings {
  public rows: number;
  public cols: number;
  public hiddenRows: number;
  public targetPoint: number;
  public puyoToPop: number;
  public garbageInHiddenRowBehavior: string;
  public chainPower: number[];
  public colorBonus: number[];
  public groupBonus: number[];
  public pointPuyo: number;

  /**
   * Creates a CoreSettings object. Loads modern Tsu settings by default.
   * @param rows - Number of field rows (including hidden row)
   * @param cols - Number of field columns
   * @param hiddenRows - Number of hidden rows
   * @param targetPoint - Score needed to send 1 garbage
   * @param puyoToPop - Number of Puyos in one group needed to pop
   * @param garbageInHiddenRowBehavior - In SEGA games, garbage can be cleared if colored Puyos are popped underneath them in the visible rows. In COMPILE Puyo, garbage can't be cleared that way.
   * @param chainPower - Power table array
   * @param colorBonus - Color bonus array
   * @param groupBonus - Group bonus array
   * @param pointPuyo - Point Puyo value
   */
  public constructor(
    rows = 13,
    cols = 6,
    hiddenRows = 1,
    targetPoint = 70,
    puyoToPop = 4,
    garbageInHiddenRowBehavior = 'sega',
    chainPower = [0, 8, 16, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576, 608, 640, 672],
    colorBonus = [0, 3, 6, 12, 24],
    groupBonus = [0, 2, 3, 4, 5, 6, 7, 10],
    pointPuyo = 50
  ) {
    this.rows = rows;
    this.cols = cols;
    this.hiddenRows = hiddenRows;
    this.targetPoint = targetPoint;
    this.puyoToPop = puyoToPop;
    this.garbageInHiddenRowBehavior = garbageInHiddenRowBehavior;
    this.chainPower = chainPower;
    this.colorBonus = colorBonus;
    this.groupBonus = groupBonus;
    this.pointPuyo = pointPuyo;
  }
}
