import MatrixFunctions, { createUniformArray, coercePuyoMatrix, resetArrayUniformly, transposeMatrix } from './MatrixFunctions';
import CoreSettings from './CoreSettings';
import { Puyo, PuyoType } from './Puyo';

export { MatrixFunctions, CoreSettings, Puyo, PuyoType };

interface ChainsimCoreOptions {
  inputMatrix?: string[][];
  settings?: CoreSettings;
  callback?: (state: unknown) => unknown;
}

export default class ChainsimCore {
  /**
   * Holds a copy of the string matrix the ChainsimCore was instantiated with.
   */
  public inputMatrix: string[][];

  /**
   * The core settings to use for the simulator.
   */
  public settings: CoreSettings;

  /**
   * The Puyo Matrix object used for calculations.
   */
  public matrix: Puyo[][];

  /**
   * A list of Puyo objects that have met the Puyo to Pop threshold.
   */
  public poppingGroups: Puyo[][];

  /**
   * The unique colors popping in the current step of the chain.
   */
  public poppingColors: string[];

  public chainLength: number;
  public linkScore: number;
  public totalScore: number;
  public linkBonusMultiplier: number;
  public linkPuyoMultiplier: number;
  public leftoverNuisancePoints: number;
  public totalGarbage: number;
  public linkGarbage: number;
  public hasPops: boolean;
  public hasDrops: boolean;

  /**
   * The distance each Puyo needs to drop if gravity is applied in the field's current state.
   */
  public dropDistances: number[][];

  /**
   * The expected result matrix after applying the calculated drops.
   */
  public droppedMatrix: Puyo[][];

  /**
   * The garbage "hardness level" at each cell of the field.
   */
  public garbageClearCountMatrix: number[][];

  /**
   * The current state of the chain simulator.
   */
  public simState: string;

  /**
   * The callback function to run after each chain step finishes.
   */
  private callback: (state: unknown) => unknown;

  /**
   * Constructs a simulator field with simulation methods.
   * @param CoreSettings - Import field settings.
   * @param matrix - Import initial field.
   * @param callback - Callback function to run if the caller needs to know the Chainsim Core's state.
   */
  // public constructor(
  //   matrix: string[][] = createUniformArray('0', 6, 13),
  //   callback?: (state: unknown) => unknown,
  //   settings: CoreSettings = new CoreSettings()
  // ) {
  public constructor({ inputMatrix, callback, settings }: ChainsimCoreOptions) {
    this.inputMatrix = inputMatrix || createUniformArray('0', 6, 13);
    this.settings = settings || new CoreSettings();
    this.callback = callback || ((): void => {});
    this.matrix = coercePuyoMatrix(this.inputMatrix, this.settings);
    this.poppingGroups = [];
    this.poppingColors = [];
    this.chainLength = 0;
    this.linkScore = 0;
    this.totalScore = 0;
    this.linkBonusMultiplier = 0;
    this.linkPuyoMultiplier = 0;
    this.leftoverNuisancePoints = 0;
    this.totalGarbage = 0;
    this.linkGarbage = 0;
    this.hasPops = false;
    this.hasDrops = false;
    this.dropDistances = createUniformArray(0, this.settings.cols, this.settings.rows);
    this.droppedMatrix = [];
    this.garbageClearCountMatrix = createUniformArray(0, this.settings.cols, this.settings.rows);
    this.simState = 'idle';
  }

  /**
   * Emits states to the caller whenever simulateLink() finishes running.
   */
  private emitState(): void {
    this.callback({
      simState: this.simState,
      matrix: this.matrix,
      chainLength: this.chainLength,
      linkScore: this.linkScore,
      totalScore: this.totalScore,
      linkGarbage: this.linkGarbage,
      totalGarbage: this.totalGarbage,
      hasPops: this.hasPops,
      hasDrops: this.hasDrops,
    });
  }

  /**
   * Loops over the Puyo field to determine the connection directions for each Puyo
   */
  public setConnectionData(): ChainsimCore {
    for (let x = 0; x < this.settings.cols; x++) {
      for (let y = this.settings.hiddenRows; y < this.settings.rows; y++) {
        if (y < this.settings.hiddenRows) {
          this.matrix[x][y].connections = 'n';
        } else if (this.dropDistances[x][y] > 0) {
          this.matrix[x][y].connections = 'n';
        } else if (
          this.matrix[x][y].p === PuyoType.None ||
          this.matrix[x][y].isGarbage ||
          this.matrix[x][y].isBlock ||
          this.matrix[x][y].isStone
        ) {
          this.matrix[x][y].connections = 'n';
        } else {
          let connection = '';

          // Check up
          if (
            this.matrix[x][y].y > this.settings.hiddenRows &&
            this.matrix[x][y].p === this.matrix[x][y - 1].p &&
            this.dropDistances[x][y - 1] === 0
          ) {
            connection += 'u';
          }
          // Check right
          if (
            this.matrix[x][y].x < this.settings.cols - 1 &&
            this.matrix[x][y].p === this.matrix[x + 1][y].p &&
            this.dropDistances[x + 1][y] === 0
          ) {
            connection += 'r';
          }
          // Check down
          if (
            this.matrix[x][y].y < this.settings.rows - 1 &&
            this.matrix[x][y].p === this.matrix[x][y + 1].p &&
            this.dropDistances[x][y + 1] === 0
          ) {
            connection += 'd';
          }
          // Check left
          if (this.matrix[x][y].x > 0 && this.matrix[x][y].p === this.matrix[x - 1][y].p && this.dropDistances[x - 1][y] === 0) {
            connection += 'l';
          }

          if (connection === '') {
            connection = 'n';
          }

          this.matrix[x][y].connections = connection;
        }
      }
    }

    return this;
  }

  /**
   * Check for Puyo groups that meet the pop requirement.
   */
  public checkForColorPops(): ChainsimCore {
    // Generate boolean matrix to track which cells have already been checked.
    const checkMatrix: boolean[][] = [];
    for (let x = 0; x < this.settings.cols; x++) {
      checkMatrix[x] = [];
      for (let y = 0; y < this.settings.rows; y++) {
        checkMatrix[x][y] = false;
      }
    }

    const poppingGroups = [];
    const colors = [];

    // Loop through the matrix. If the loop comes across a Puyo, start a "group search".
    for (let x = 0; x < this.settings.cols; x++) {
      for (let y = this.settings.hiddenRows; y < this.settings.rows; y++) {
        if (this.matrix[x][y].isColored && checkMatrix[x][y] === false) {
          checkMatrix[x][y] = true;

          const group: Puyo[] = [];
          group.push(this.matrix[x][y]);
          for (const puyo of group) {
            // Check up
            if (
              puyo.y > this.settings.hiddenRows &&
              puyo.p === this.matrix[puyo.x][puyo.y - 1].p &&
              checkMatrix[puyo.x][puyo.y - 1] === false
            ) {
              checkMatrix[puyo.x][puyo.y - 1] = true;
              group.push(this.matrix[puyo.x][puyo.y - 1]);
            }
            // Check down
            if (
              puyo.y < this.settings.rows - 1 &&
              puyo.p === this.matrix[puyo.x][puyo.y + 1].p &&
              checkMatrix[puyo.x][puyo.y + 1] === false
            ) {
              checkMatrix[puyo.x][puyo.y + 1] = true;
              group.push(this.matrix[puyo.x][puyo.y + 1]);
            }
            // Check left
            if (puyo.x > 0 && puyo.p === this.matrix[puyo.x - 1][puyo.y].p && checkMatrix[puyo.x - 1][puyo.y] === false) {
              checkMatrix[puyo.x - 1][puyo.y] = true;
              group.push(this.matrix[puyo.x - 1][puyo.y]);
            }
            // Check right
            if (
              puyo.x < this.settings.cols - 1 &&
              puyo.p === this.matrix[puyo.x + 1][puyo.y].p &&
              checkMatrix[puyo.x + 1][puyo.y] === false
            ) {
              checkMatrix[puyo.x + 1][puyo.y] = true;
              group.push(this.matrix[puyo.x + 1][puyo.y]);
            }
          }
          if (group.length >= this.settings.puyoToPop) {
            poppingGroups.push(group);
            colors.push(group[0].p); // Push a color code
          }
        }
      }
    }

    // Get set of colors popping without duplicates
    const poppingColors = colors.filter((value, index, self): boolean => {
      return self.indexOf(value) >= index;
    });

    this.poppingGroups = poppingGroups;
    this.poppingColors = poppingColors;

    this.hasPops = poppingGroups.length > 0;

    // Reset connection data
    this.setConnectionData();

    return this;
  }

  /**
   * Check if there's empty space below any one of the Puyos on the field.
   */
  public checkForDrops(): ChainsimCore {
    const checkBelowEachCell = (): boolean => {
      for (let x = 0; x < this.settings.cols; x++) {
        for (let y = 0; y < this.settings.rows - 1; y++) {
          if (!this.matrix[x][y].isBlock && !this.matrix[x][y].isEmpty && this.matrix[x][y + 1].isEmpty) {
            return true;
          }
        }
      }
      return false;
    };

    this.hasDrops = checkBelowEachCell();

    return this;
  }

  /**
   * Check for garbage to clear that's surrounding the current poppingGroups
   */
  public checkForGarbagePops(): ChainsimCore {
    for (let x = 0; x < this.settings.cols; x++) {
      for (let y = 0; y < this.settings.rows; y++) {
        this.garbageClearCountMatrix[x][y] = 0;
      }
    }

    for (const group of this.poppingGroups) {
      for (const puyo of group) {
        // Check up.
        // SEGA behavior: garbage can be cleared while they're still in the hidden rows if Puyos pop underneath
        // COMPILE behavior: garbage can't be cleared while they're in the hidden rows
        if (this.settings.garbageInHiddenRowBehavior === 'sega') {
          if (puyo.y > this.settings.hiddenRows - 1 && this.matrix[puyo.x][puyo.y - 1].isGarbage) {
            this.garbageClearCountMatrix[puyo.x][puyo.y - 1] += 1;
          }
        } else if (this.settings.garbageInHiddenRowBehavior === 'compile') {
          if (puyo.y > this.settings.hiddenRows && this.matrix[puyo.x][puyo.y - 1].isGarbage) {
            this.garbageClearCountMatrix[puyo.x][puyo.y - 1] += 1;
          }
        }

        // Check down
        if (puyo.y < this.settings.rows - 1 && this.matrix[puyo.x][puyo.y + 1].isGarbage) {
          this.garbageClearCountMatrix[puyo.x][puyo.y + 1] += 1;
        }

        // Check left
        if (puyo.x > 0 && this.matrix[puyo.x - 1][puyo.y].isGarbage) {
          this.garbageClearCountMatrix[puyo.x - 1][puyo.y] += 1;
        }

        // Check right
        if (puyo.x < this.settings.cols - 1 && this.matrix[puyo.x + 1][puyo.y].isGarbage) {
          this.garbageClearCountMatrix[puyo.x + 1][puyo.y] += 1;
        }
      }
    }

    return this;
  }

  /**
   * Determine how far each floating Puyo needs to drop.
   */
  public calculateDropDistances(): ChainsimCore {
    // i don't know how this works but don't delete!!!
    const droppedMatrix = [];
    for (let x = 0; x < this.matrix.length; x++) {
      const slicePoints = [-1];
      const slices: Puyo[][] = [];
      let newColumn: Puyo[] = [];

      for (let y = 0; y < this.matrix[x].length; y++) {
        if (this.matrix[x][y].p === PuyoType.Block) {
          slicePoints.push(y);
        }
      }

      slicePoints.forEach((v, i): void => {
        i === slicePoints.length - 1
          ? slices.push(this.matrix[x].slice(v + 1, this.matrix[x].length))
          : slices.push(this.matrix[x].slice(v + 1, slicePoints[i + 1] + 1));
      });

      slices.forEach((slice): void => {
        const emptyCells = slice.filter((puyo): boolean => puyo.p === PuyoType.None);
        const PuyoCells = slice.filter((puyo): boolean => puyo.p !== PuyoType.None);
        newColumn = [...newColumn, ...emptyCells, ...PuyoCells];
      });

      droppedMatrix[x] = newColumn;
    }

    this.droppedMatrix = droppedMatrix;

    for (let x = 0; x < this.settings.cols; x++) {
      for (let y = 0; y < this.settings.rows; y++) {
        this.droppedMatrix[x][y].newY = y;
      }
    }

    for (let x = 0; x < this.settings.cols; x++) {
      for (let y = 0; y < this.settings.rows; y++) {
        this.dropDistances[x][y] = this.matrix[x][y].newY - y;
      }
    }

    this.setConnectionData();

    return this;
  }

  /**
   * Calculate the score generated by the current poppinGroups if they're cleared.
   * Currently, this doesn't account for Point Puyos or SEGA Garbage behavior.
   * (A slight amount of extra damage is sent when clearing garbage in PP20th onwards).
   */
  public calculateLinkScore(): ChainsimCore {
    let linkGroupBonus = 0;
    for (const group of this.poppingGroups) {
      if (this.settings.puyoToPop < 4) {
        if (group.length >= 11 - (4 - this.settings.puyoToPop)) {
          linkGroupBonus += this.settings.groupBonus[this.settings.groupBonus.length - 1];
        } else {
          linkGroupBonus += this.settings.groupBonus[group.length - this.settings.puyoToPop];
        }
      } else {
        if (group.length >= 11) {
          linkGroupBonus += this.settings.groupBonus[this.settings.groupBonus.length - 1];
        } else {
          linkGroupBonus += this.settings.groupBonus[group.length - 4];
        }
      }
    }

    const linkColorBonus = this.settings.colorBonus[this.poppingColors.length - 1];

    const linkChainPower = this.settings.chainPower[this.chainLength - 1];

    let linkPuyoCleared = 0;
    for (const group of this.poppingGroups) {
      linkPuyoCleared += group.length;
    }

    let linkTotalBonus = linkGroupBonus + linkColorBonus + linkChainPower;
    if (linkTotalBonus < 1) {
      linkTotalBonus = 1;
    } else if (linkTotalBonus > 999) {
      linkTotalBonus = 999;
    }

    const linkScore = 10 * linkPuyoCleared * linkTotalBonus;
    this.linkScore = linkScore;
    this.linkPuyoMultiplier = 10 * linkPuyoCleared;
    this.linkBonusMultiplier = linkTotalBonus;
    this.totalScore += this.linkScore;

    return this;
  }

  /**
   * Calculate the amount of garbage generated by the current link.
   * The remainder from target point division is saved as leftoverNuisancePoints.
   */
  public calculateGarbage(): ChainsimCore {
    const nuisancePoints = this.linkScore / this.settings.targetPoint + this.leftoverNuisancePoints;
    const nuisanceCount = Math.floor(nuisancePoints);
    this.leftoverNuisancePoints = nuisancePoints - nuisanceCount;
    this.totalGarbage += nuisanceCount;
    this.linkGarbage = nuisanceCount;

    return this;
  }

  /**
   * Turn the "color" of each Puyo in poppingGroups to PuyoType.None
   */
  public popPuyos(): ChainsimCore {
    for (const group of this.poppingGroups) {
      for (const puyo of group) {
        this.matrix[puyo.x][puyo.y].p = PuyoType.None;
      }
    }

    return this;
  }

  /**
   * Turn the "color" of popping Garbage Puyos to PuyoType.None
   */
  public popGarbage(): ChainsimCore {
    for (let x = 0; x < this.settings.cols; x++) {
      for (let y = 0; y < this.settings.rows; y++) {
        if (this.garbageClearCountMatrix[x][y] === 1) {
          if (this.matrix[x][y].p === PuyoType.Garbage) {
            this.matrix[x][y].p = PuyoType.None;
          } else if (this.matrix[x][y].p === PuyoType.Hard) {
            this.matrix[x][y].p = PuyoType.Garbage;
          }
        } else if (this.garbageClearCountMatrix[x][y] >= 2) {
          this.matrix[x][y].p = PuyoType.None;
        }
      }
    }

    return this;
  }

  /**
   * Change the state of this.matrix to the calculated drops.
   */
  public dropPuyos(): ChainsimCore {
    this.matrix = this.droppedMatrix;
    return this;
  }

  /**
   * Refresh linkScore, linkBonusMultiplier, linkPuyoMultiplier, linkGarbage, dropDistances, garbageClearCountMatrix, droppedMatrix, and groups
   */
  public refreshLinkData(): ChainsimCore {
    this.poppingGroups = [];
    this.poppingColors = [];
    this.linkScore = 0;
    this.linkBonusMultiplier = 0;
    this.linkPuyoMultiplier = 0;
    this.linkGarbage = 0;
    resetArrayUniformly(this.dropDistances, 0);
    resetArrayUniformly(this.garbageClearCountMatrix, 0);
    this.droppedMatrix = [];

    return this;
  }

  /**
   * Set the new locations of each Puyo object.
   */
  public refreshPuyoPositionData(): ChainsimCore {
    for (let x = 0; x < this.settings.cols; x++) {
      for (let y = 0; y < this.settings.rows; y++) {
        this.matrix[x][y].x = x;
        this.matrix[x][y].y = y;
        this.dropDistances[x][y] = 0;
      }
    }

    return this;
  }

  /**
   * Update this.matrix with a different Puyo[][] matrix.
   * @param newMatrix 2D array of strings using PuyoTypes
   */
  public updateFieldMatrix(newMatrix: string[][]): ChainsimCore {
    this.matrix = coercePuyoMatrix(newMatrix, this.settings);
    return this;
  }

  public reloadInputMatrix(): ChainsimCore {
    this.matrix = coercePuyoMatrix(this.inputMatrix, this.settings);
    return this;
  }

  /**
   * Opens a link to the Puyo Nexus chain simulator of the current chain.
   * Doesn't support all PuyoTypes yet.
   */
  public urlToPuyoNexus(): void {
    const pnMatrix = transposeMatrix(this.matrixText);

    interface ConversionScheme {
      R: number;
      G: number;
      B: number;
      Y: number;
      P: number;
      J: number;
      '0': number;
    }

    const conversionScheme: ConversionScheme = {
      R: 4,
      G: 7,
      B: 5,
      Y: 6,
      P: 8,
      J: 1,
      '0': 0,
    };

    // Need to type check pnMatrix[y][x] to make sure it's an index in ConversionScheme;
    function isValidCode(code: string): code is keyof typeof conversionScheme {
      return code in conversionScheme;
    }

    let urlString = '';
    for (let y = 0; y < this.settings.rows; y++) {
      for (let x = 0; x < this.settings.cols; x++) {
        const code = pnMatrix[y][x];

        if (isValidCode(code)) {
          urlString += conversionScheme[code];
        } else {
          urlString += '0';
        }
      }
    }

    const url = `https://puyonexus.com/chainsim/?w=${this.settings.cols}&h=${this.settings.rows -
      this.settings.hiddenRows}&chain=${urlString}`;

    if (typeof window !== 'undefined') {
      window.open(url);
    } else {
      console.log(url);
    }
  }

  /**
   * Simulate the current link. The callback function supplied in the constructor will get called when this method finishes.
   * @param param0 An options object. Supply { repeat: true } to make simulateLink simulate the full chain.
   */
  public simulateLink({ repeat }: { repeat: boolean }): ChainsimCore {
    this.checkForDrops();
    let performedDrop = false;
    let performedPop = false;

    if (this.hasDrops) {
      this.calculateDropDistances()
        .setConnectionData()
        .dropPuyos()
        .refreshLinkData()
        .refreshPuyoPositionData();

      this.hasDrops = false;
      performedDrop = true;
    } else {
      this.checkForColorPops();

      if (this.hasPops) {
        this.chainLength++;
        this.checkForGarbagePops()
          .calculateLinkScore()
          .calculateGarbage()
          .popPuyos()
          .popGarbage()
          .refreshLinkData();
        this.hasPops = false;
        performedPop = true;

        this.checkForDrops();
        if (this.hasDrops) {
          this.calculateDropDistances()
            .dropPuyos()
            .refreshLinkData()
            .refreshPuyoPositionData();

          this.hasDrops = false;
          performedDrop = true;
        }
      }
    }

    this.emitState();

    if (repeat && (performedDrop || performedPop)) {
      return this.simulateLink({ repeat: true });
    } else {
      return this;
    }
  }

  public simulateChain(): ChainsimCore {
    return this.simulateLink({ repeat: true });
  }

  /**
   * Get the colors of this.matrix in string form.
   */
  public get matrixText(): string[][] {
    const textMatrix: string[][] = [];
    for (let x = 0; x < this.settings.cols; x++) {
      textMatrix[x] = [];
      for (let y = 0; y < this.settings.rows; y++) {
        textMatrix[x][y] = this.matrix[x][y].p;
      }
    }

    return textMatrix;
  }
}
