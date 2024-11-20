// src/utils/interpolation.ts
export function interpolate(
  xValues: number[],
  yValues: number[],
  targetX: number[]
): number[] {
  if (xValues.length !== yValues.length) {
    throw new Error("Input arrays must have the same length");
  }
  if (xValues.length < 2) {
    throw new Error(
      "Input arrays must have at least 2 points for interpolation"
    );
  }

  return targetX.map((x) => {
    // 범위를 벗어난 경우 처리
    if (x <= xValues[0]) return yValues[0];
    if (x >= xValues[xValues.length - 1]) return yValues[yValues.length - 1];

    // 이진 탐색으로 인접한 포인트 찾기
    let left = 0;
    let right = xValues.length - 1;

    while (right - left > 1) {
      const mid = Math.floor((left + right) / 2);
      if (xValues[mid] > x) {
        right = mid;
      } else {
        left = mid;
      }
    }

    // 선형 보간
    const xRange = xValues[right] - xValues[left];
    const yRange = yValues[right] - yValues[left];
    const ratio = (x - xValues[left]) / xRange;

    return yValues[left] + yRange * ratio;
  });
}
