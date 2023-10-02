import { BigNumber } from 'bignumber.js';

export function bankRound(n: number, fixed = 2) {
  return +new BigNumber(new BigNumber(n).toFixed(fixed + 2, BigNumber.ROUND_HALF_EVEN)).toFixed(fixed, BigNumber.ROUND_HALF_EVEN);
}

export function floorRound(n: number, fixed = 2) {
  return +new BigNumber(new BigNumber(n).toFixed(fixed + 2, BigNumber.ROUND_FLOOR)).toFixed(fixed, BigNumber.ROUND_FLOOR);
}
