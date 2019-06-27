import { Puyo, PuyoType } from './Puyo';
import CoreSettings from './CoreSettings';

/**
 * Transposes matrices of any data type
 * @param {any[][]} inputMatrix
 */
export function transposeMatrix<T>(inputMatrix: T[][]): T[][] {
  const transpose: T[][] = [];
  for (let y = 0; y < inputMatrix[0].length; y++) {
    transpose[y] = [];
    for (let x = 0; x < inputMatrix.length; x++) {
      transpose[y][x] = inputMatrix[x][y];
    }
  }

  return transpose;
}

/**
 * Creates a 2D array with the same value in every cell
 * @param value
 * @param cols
 * @param rows
 */
export function createUniformArray<T>(value: T, cols: number, rows: number): T[][] {
  const matrix: T[][] = [];
  for (let x = 0; x < cols; x++) {
    matrix[x] = [];
    for (let y = 0; y < rows; y++) {
      matrix[x][y] = value;
    }
  }

  return matrix;
}

/**
 * Creates a 2D array with empty Puyos in every cell
 * @param {number} cols
 * @param {number} rows
 */
export function createEmptyPuyoArray(cols: number, rows: number): Puyo[][] {
  const matrix: Puyo[][] = [];
  for (let x = 0; x < cols; x++) {
    matrix[x] = [];
    for (let y = 0; y < rows; y++) {
      matrix[x][y] = new Puyo('0', x, y);
    }
  }

  return matrix;
}

export function convertPuyoToStringArray(PuyoMatrix: Puyo[][]): string[][] {
  const matrix: string[][] = [];
  for (let x = 0; x < PuyoMatrix.length; x++) {
    matrix[x] = [];
    for (let y = 0; y < PuyoMatrix[x].length; y++) {
      matrix[x][y] = PuyoMatrix[x][y].p;
    }
  }

  return matrix;
}

export function copyPrimitiveArray<T extends number | string>(primitiveArray: T[][]): T[][] {
  const matrix: T[][] = [];
  for (let x = 0; x < primitiveArray.length; x++) {
    matrix[x] = [];
    for (let y = 0; y < primitiveArray[x].length; y++) {
      matrix[x][y] = primitiveArray[x][y];
    }
  }

  return matrix;
}

/**
 * Coerces imported matrix if it doesn't fit the dimensions defined by simulator settings.
 * @param inputMatrix
 * @param settings
 */
export function coercePuyoMatrix(inputMatrix: string[][], settings: CoreSettings): Puyo[][] {
  const matrix = createEmptyPuyoArray(settings.cols, settings.rows);

  if (inputMatrix[0].length < settings.rows) {
    // If inputMatrix is shorter than the matrix defined by settings,
    // shift the cells down to the new bottom of the matrix
    for (let x = 0; x < inputMatrix.length; x++) {
      for (let y = 0; y < inputMatrix[x].length; y++) {
        matrix[x][y + settings.rows - inputMatrix[x].length] = new Puyo(inputMatrix[x][y], x, y + settings.rows - inputMatrix[x].length);
      }
    }
  } else if (inputMatrix[0].length > settings.rows) {
    // If inputMatrix is larger than the matrix defined by settings,
    // shift the cells up to the new bottom of the matrix
    for (let x = 0; x < settings.cols; x++) {
      for (let y = 0; y < settings.rows; y++) {
        if (inputMatrix.length <= settings.cols && x < inputMatrix.length) {
          matrix[x][y] = new Puyo(inputMatrix[x][y + inputMatrix[0].length - settings.rows], x, y);
        } else {
          matrix[x][y] = new Puyo(PuyoType.None, x, y);
        }
      }
    }
  } else {
    // If the heights are the same, just copy in place
    for (let x = 0; x < settings.cols; x++) {
      for (let y = 0; y < settings.rows; y++) {
        if (inputMatrix.length <= settings.cols && x < inputMatrix.length) {
          matrix[x][y] = new Puyo(inputMatrix[x][y], x, y);
        }
      }
    }
  }

  return matrix;
}

export function resetArrayUniformly<T>(arr: T[][], value: T): void {
  for (let x = 0; x < arr.length; x++) {
    for (let y = 0; y < arr[0].length; y++) {
      arr[x][y] = value;
    }
  }
}

export function rebuild2DArrayFromString(fieldString: string, settings: CoreSettings): string[][] {
  const matrix: string[][] = [];
  for (let x = 0; x < settings.cols; x++) {
    matrix[x] = [];
    for (let y = 0; y < settings.rows; y++) {
      matrix[x][y] = fieldString[x * settings.rows + y];
    }
  }

  return matrix;
}

export default {
  coercePuyoMatrix,
  convertPuyoToStringArray,
  copyPrimitiveArray,
  createEmptyPuyoArray,
  createUniformArray,
  rebuild2DArrayFromString,
  resetArrayUniformly,
  transposeMatrix,
};
