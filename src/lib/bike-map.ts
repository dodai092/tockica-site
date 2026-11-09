// Bike map layout: two columns of 10, aisle after the fifth row (row 6). Same numbers as prototype/src/layout.js.
// Defined for 20 bikes. A class with another capacity still draws 20 and disables the extra bikes.
export const BIKE_COUNT = 20;

export function bikePosition(bikeNo: number): { column: 1 | 2; row: number } {
  const fromBottom = (bikeNo - 1) % 10;
  return {
    column: bikeNo <= 10 ? 2 : 1,
    row: fromBottom < 5 ? 11 - fromBottom : 10 - fromBottom,
  };
}
