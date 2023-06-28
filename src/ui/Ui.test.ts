import { getAppPosition } from './Ui';

describe('getAppPosition', () => {
  test('should return correct position when there is enough space', () => {
    const accountIdsLength = 1;
    const displayWidth = 500;
    const displayHeight = 500;
    const appWidth = 100;
    const appHeight = 100;
    const gap = 10;

    const result = getAppPosition(accountIdsLength, displayWidth, displayHeight, appWidth, appHeight, gap);
    expect(result).toEqual({ appPosX: 110, appPosY: 25 });
  });

// Test
  describe("getAppPosition", () => {
    test('should return object with appPosX and appPosY when there is not enough space in width, but enough space in height', () => {
      const accountIdsLength = 5;
      const displayWidth = 500;
      const displayHeight = 500;
      const appWidth = 100;
      const appHeight = 100;
      const gap = 10;

      const result = getAppPosition(accountIdsLength, displayWidth, displayHeight, appWidth, appHeight, gap);
      expect(result).toEqual({ appPosX: 110, appPosY: 135 });
    });
  });

  test('should return null when there is not enough space in height', () => {
    const accountIdsLength = 5;
    const displayWidth = 500;
    const displayHeight = 200;
    const appWidth = 100;
    const appHeight = 100;
    const gap = 10;

    const result = getAppPosition(accountIdsLength, displayWidth, displayHeight, appWidth, appHeight, gap);
    expect(result).toBeNull();
  });
});
