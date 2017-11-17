import { shapeDataToShape } from '../shape/shapeDataUtils.js';
// import R from 'ramda';

export default class ShapesManager {
  constructor(objectContainerActive, objectContainerInactive) {
    this.objectContainerActive = objectContainerActive;
    this.objectContainerInactive = objectContainerInactive;

    this._shapes = {};
    this._activeObjectUIDs = [];
    this._inactiveObjectUIDs = [];
  }
  // activeShapes is an array with object id's that are active
  update(state) {
    const needRender = { active: false, inactive: false };

    const selectedObjects = state.selection.objects.map(({ id }) => id);
    // determine if shape is "active", meaning it will be updated frequently
    const activeShapes = Object.keys(state.objectsById)
      .filter(id => state.d2.activeShape === id || selectedObjects.indexOf(id) !== -1);

    const { objectsById } = state;

    if (
      this._objectsById === objectsById &&
      true &&
      state.activeSpace === this._activeSpace
    ) {
      return needRender;
    }

    // object ids that are in the current space
    const spaceObjectIds = state.spaces[state.activeSpace].objectIds;

    // remove shapes
    if (this._objectsById !== undefined) {
      for (const id in this._objectsById) {
        if (spaceObjectIds.indexOf(id) === -1) {
          this._handleShapeRemove(id, needRender);
        }
      }
    }

    const newActiveObjectUIDs = [];
    const newInactiveObjectUIDs = [];

    for (const UID of spaceObjectIds) {
      const active = activeShapes.indexOf(UID) !== -1;
      if (active) {
        newActiveObjectUIDs.push(UID);
      } else {
        newInactiveObjectUIDs.push(UID);
      }

      const shapeData = objectsById[UID];
      const shape = this._shapes[shapeData.UID] || this._createShape(shapeData);

      // Put shapes into the right container; active or inactive
      if (!active && this._activeObjectUIDs.indexOf(UID) !== -1) {
        this.objectContainerActive.remove(shape);
        needRender.active = true;
      } else if (active && this._inactiveObjectUIDs.indexOf(UID) !== -1) {
        this.objectContainerInactive.remove(shape);
        needRender.inactive = true;
      }

      if (!active && this._inactiveObjectUIDs.indexOf(UID) === -1) {
        this.objectContainerInactive.add(shape);
        needRender.inactive = true;
      } else if (active && this._activeObjectUIDs.indexOf(UID) === -1) {
        this.objectContainerActive.add(shape);
        needRender.active = true;
      }

      // update shape properties
      if (!this._objectsById || !this._objectsById[UID]) continue;

      const update = shape.update(shapeData);
      if (update) {
        if (active) needRender.active = true;
        else needRender.inactive = true;
      }
    }

    this._activeObjectUIDs = newActiveObjectUIDs;
    this._inactiveObjectUIDs = newInactiveObjectUIDs;

    this._objectsById = objectsById;
    this._activeShapes = activeShapes;
    this._activeSpace = state.activeSpace;
    return needRender;
  }

  updateTransparent(selectedUIDs) {
    for (const UID in this._shapes) {
      const shape = this._shapes[UID];
      const selected = selectedUIDs.indexOf(UID) !== -1;
      const opaque = selected || selectedUIDs.length === 0;

      shape.setOpaque(opaque);
    }
  }

  _handleShapeRemove(UID, needRender) {
    const shape = this._shapes[UID];
    delete this._shapes[UID];

    // check which container
    const active = this._activeObjectUIDs.indexOf(UID) !== -1;

    if (active) {
      this.objectContainerActive.remove(shape);
      needRender.active = true;
    } else {
      this.objectContainerInactive.remove(shape);
      needRender.inactive = true;
    }
  }

  _createShape(shapeData) {
    const shape = shapeDataToShape(shapeData);

    this._shapes[shapeData.UID] = shape;

    return shape;
  }
}