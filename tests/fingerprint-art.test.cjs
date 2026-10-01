const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tintFingerprint, softenInkGaps } = require('../tools/fingerprint-art.cjs');

test('paper becomes transparent and dark ridges become softened colored ink', () => {
  const pixels = new Uint8ClampedArray([255,255,255,255, 0,0,0,255, 150,150,150,255]);
  const before = pixels.slice();
  const result = tintFingerprint(pixels, [101,44,70]);
  assert.deepEqual([...result.slice(0,4)], [101,44,70,0]);
  assert.deepEqual([...result.slice(4,8)], [101,44,70,214]);
  assert.ok(result[11] > 0 && result[11] < result[7]);
  assert.deepEqual(pixels, before);
});

test('transparent input stays transparent and empty input is supported', () => {
  assert.deepEqual([...tintFingerprint(new Uint8ClampedArray([0,0,0,0]), [112,85,128])], [112,85,128,0]);
  assert.equal(tintFingerprint(new Uint8ClampedArray(), [112,85,128]).length, 0);
});

test('ink treatment softens small ridge breaks without erasing the fingerprint pattern', () => {
  const pixels = new Uint8ClampedArray([
    100,80,90,200, 100,80,90,0, 100,80,90,200,
    100,80,90,0, 100,80,90,0, 100,80,90,0,
    100,80,90,0, 100,80,90,0, 100,80,90,0,
  ]);
  const before = pixels.slice();
  const result = softenInkGaps(pixels, 3, 3);
  assert.equal(result[3], 200, 'existing ridges retain their density');
  assert.equal(result[7], 96, 'broken ridge receives a soft ink edge');
  assert.equal(result[19], 96, 'diagonal neighbors soften small pinholes');
  assert.equal(result[31], 0, 'distant open space is not filled with invented ridges');
  assert.deepEqual([...result.slice(4, 7)], [100,80,90]);
  assert.deepEqual(pixels, before);
});

test('ink treatment handles boundaries and rejects inconsistent dimensions', () => {
  const single = new Uint8ClampedArray([100,80,90,180]);
  assert.deepEqual(softenInkGaps(single, 1, 1), single);
  assert.equal(softenInkGaps(new Uint8ClampedArray(), 0, 0).length, 0);
  for (const [width, height] of [[2,1], [-1,1], [1.5,1], [1,NaN]]) {
    assert.throws(() => softenInkGaps(single, width, height), RangeError);
  }
});