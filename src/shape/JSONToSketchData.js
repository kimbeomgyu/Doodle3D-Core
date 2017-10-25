import { Color, Matrix4 } from 'three';
import { Vector, Matrix } from '@doodle3d/cal';
import semver from 'semver';
import { recursivePromiseApply } from '../utils/async.js';
import { base64ToImage, base64ToVectorArray } from '../utils/binaryUtils.js';
import { LEGACY_HEIGHT_STEP } from '../constants/d3Constants.js';

async function JSONToSketchData({ data, appVersion }) {
  let sketchData = JSON.parse(data, (key, value) => {
    if (semver.lt(appVersion, '0.1.2')) {
      if (key === 'imageData') {
        return base64ToImage(value);
      }
    }

    if (value.metadata && value.metadata.type) {
      switch (value.metadata.type) {
        case 'Vector':
          return new Vector().fromJSON(value);

        case 'Matrix':
          return new Matrix().fromJSON(value);

        case 'VectorArray':
          return base64ToVectorArray(value);

        case 'Image':
          return base64ToImage(value);

        case 'Matrix4':
          return new Matrix4().copy(value);

        case 'Color':
          return new Color(value.data).getHex();

        default:
          break;
      }
      return value;
    }

    // legacy, convert { r: Float, g: Float, b: Float } to hex
    if (typeof value.r === 'number' && typeof value.g === 'number' && typeof value.b === 'number') {
      return new Color(value.r, value.g, value.b).getHex();
    }

    return value;
  });
  sketchData = await recursivePromiseApply(sketchData);

  if (semver.lt(appVersion, '0.4.0')) {
    sketchData = {
      spaces: [{
        matrix: new Matrix4(),
        objects: sketchData
      }]
    };
  }

  if (semver.lt(appVersion, '0.10.0')) {
    for (const space of sketchData.spaces) {
      for (const object of space.objects) {
        const { sculpt, height } = object;

        object.sculpt = sculpt.map((scale, i) => ({
          pos: Math.min(1, (i * LEGACY_HEIGHT_STEP) / height),
          scale
        }));
      }
    }
  }

  return sketchData;
}

export default JSONToSketchData;
