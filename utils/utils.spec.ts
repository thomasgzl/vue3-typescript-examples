import { addDecimalMonth } from '@/utils/date';
import { bankRound, floorRound } from '@/utils/numbers';
import { describe, expect, it } from 'vitest';

describe('Date', () => {
  it('addDecimalMonth', () => {
    const testDate = '2020-05-01';

    expect(addDecimalMonth(testDate, 2).format('YYYY-MM-DD')).toEqual('2020-07-01');
    expect(addDecimalMonth(testDate, 10).format('YYYY-MM-DD')).toEqual('2021-03-01');
    expect(addDecimalMonth(testDate, 26).format('YYYY-MM-DD')).toEqual('2022-07-01');
  });
});

describe('Numbers', () => {
  it('bankRound', () => {
    expect(bankRound(24.5532)).toEqual(24.55);
    expect(bankRound(24.5592)).toEqual(24.56);
    expect(bankRound(24.0001)).toEqual(24);
    expect(bankRound(24.0001, 4)).toEqual(24.0001);
    expect(bankRound(24.99999)).toEqual(25);
    expect(bankRound(24.99999, 4)).toEqual(25);
  });

  it('floorRound', () => {
    expect(floorRound(24)).toEqual(24);
    expect(floorRound(24.99999)).toEqual(24.99);
    expect(floorRound(24.99999, 4)).toEqual(24.9999);
    expect(floorRound(24.0001, 4)).toEqual(24.0001);
  });
});