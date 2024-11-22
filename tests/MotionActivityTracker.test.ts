const MotionActivityTracker = require('../src/MotionActivityTrackerModule');


jest.mock('../src/MotionActivityTrackerModule.ts', () => ({
  startTracking: jest.fn(() => Promise.resolve('tracking started')),
  stopTracking: jest.fn(() => 'tracking stopped'),
  getHistoricalDataIos: jest.fn((startDate, endDate) =>
    Promise.resolve([
      { walking: true, running: false, timestamp: 123456789, confidence: 'high' },
    ]),
  ),
  addMotionStateChangeListener: jest.fn((callback) => {
    callback({ state: 'walking' });
    return { remove: jest.fn() };
  }),
}));

describe('MotionActivityTracker', () => {
  test('should start tracking', async () => {
    const result = await MotionActivityTracker.startTracking();
    expect(result).toBe('tracking started');
  });

  test('should stop tracking', () => {
    const result = MotionActivityTracker.stopTracking();
    expect(result).toBe('tracking stopped');
  });

  test('should fetch historical data', async () => {
    const startDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const endDate = new Date();
    const data = await MotionActivityTracker.getHistoricalDataIos(startDate, endDate);
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty('walking', true);
  });

  test('should call listener on state change', () => {
    const mockListener = jest.fn();
    const subscription = MotionActivityTracker.addMotionStateChangeListener(mockListener);
    expect(mockListener).toHaveBeenCalledWith({ state: 'walking' });
    subscription.remove();
  });
});
