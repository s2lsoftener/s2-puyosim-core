# s2-puyosim-core

```ts
import ChainsimCore, { MatrixFunctions } from 's2-puyosim-core';

const testMatrix = [
  ['0', '0', '0', '0', '0', '0'],
  ['0', '0', '0', '0', '0', '0'],
  ['0', '0', '0', '0', '0', '0'],
  ['0', '0', '0', '0', '0', '0'],
  ['0', '0', '0', '0', '0', 'G'],
  ['0', '0', '0', '0', '0', 'G'],
  ['0', '0', '0', '0', 'G', 'R'],
  ['0', '0', 'J', 'J', 'G', 'R'],
  ['0', '0', 'J', 'J', 'R', 'B'],
  ['G', '0', 'J', 'J', 'R', 'P'],
  ['G', 'R', 'B', 'Y', 'P', 'P'],
  ['G', 'G', 'R', 'B', 'Y', 'Y'],
  ['R', 'R', 'B', 'B', 'Y', 'P'],
]; // GTR!

// It's easier to visualize a chain when it's laid out by row;
// however, the simulator needs the arrays ordered by columns.
// You can use this helper function to transpose matrices that
// are currently arranged by row.
const input = MatrixFunctions.transposeMatrix(testMatrix);

// Create a new simulator object.
const simulator = new ChainsimCore({ inputMatrix: input });

// Simulate the chain.
simulator.simulateChain();

// Result
console.log(simulator.matrixText);
/* Expected output:
[ [ '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'J' ],
  [ '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'B' ] ]
*/

// Re-transposed result
console.log(MatrixFunctions.transposeMatrix(simulator.matrixText));
/* Expected output:
[ [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', '0', '0', '0' ],
  [ '0', '0', '0', 'J', '0', 'B' ] ]
*/

console.log(`
  Chain Length: ${simulator.chainLength}
  Total Score: ${simulator.totalScore}
  Total Garbage: ${simulator.totalGarbage}
`);
// Chain Length: 5
// Total Score: 4840
// Total Garbage: 69

// Reload the chain simulator with the initial chain.
simulator.reloadInputMatrix();

// Output link to Puyo Nexus so you can double check the result.
// If you run this method in node.js, it'll log a url.
// If you run this method in the browser, it'll open the webpage.
simulator.urlToPuyoNexus();
// https://puyonexus.com/chainsim/?w=6&h=12&chain=000000000000000000000000000007000007000074001174001145701148745688774566445568
```