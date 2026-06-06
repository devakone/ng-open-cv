import type { OpenCV, OpenCVModule } from '../public_api';

describe('OpenCV type exports', () => {
  it('should expose OpenCV.js types for TypeScript consumers', () => {
    const createMat = (cv: OpenCVModule): OpenCV.Mat => {
      return cv.matFromArray(1, 1, cv.CV_8UC1, [0]);
    };

    expect(createMat).toEqual(jasmine.any(Function));
  });
});
