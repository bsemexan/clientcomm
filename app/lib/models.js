

const Promise = require('bluebird');
const db = require('../../app/db');

function undefinedValuesCheck(array) {
  let undefinedExists = false;

  array.forEach((ea) => {
    if (typeof ea === 'undefined') undefinedExists = true;
  });

  return undefinedExists;
}

class BaseModel {
  constructor(info) {
    this._info = info;
    info.columns.map((name) => {
      this[name] = info.data[name];
    });
  }

  update(params) {
    return new Promise((fulfill, reject) => {
      db(this.constructor.tableName)
      .where(
        this.constructor.primaryId,
        this[this.constructor.primaryId]
      ).update(this._cleanParams(params))
      .returning('*')
      .then((objs) => {
        // TODO? update params on this instance
        // and not just the new one so that
        // if it is re-used they are correct?
        this.constructor._getSingleResponse(objs, fulfill);
      }).catch(reject);
    });
  }

  _cleanParams(obj) {
    const out = {};
    const columnNames = this._info.columns;
    for (let i = 0; i < columnNames.length; i++) {
      if (obj.hasOwnProperty(columnNames[i])) {
        out[columnNames[i]] = obj[columnNames[i]];
      }
    }
    return out;
  }

  static _cleanParams(obj) {
    const instance = new this({});
    return instance._cleanParams(obj);
  }

  static _checkModelValidity() {
    this._checkForTableName();
    this._checkForPrimaryId();
  }

  static _checkForTableName() {
    if (!this.tableName) {
      throw new Error('This model needs a tableName!');
    }
  }

  static _checkForPrimaryId() {
    if (!this.primaryId) {
      throw new Error('This model needs a primaryId!');
    }
  }

  static create(modelObject) {
    return new Promise((fulfill, reject) => {
      db(this.tableName)
      .insert(this._cleanParams(modelObject)).returning('*')
      .then((objs) => {
        this._getSingleResponse(objs, fulfill);
      }).catch(reject);
    });
  }

  static where(attributes) {
    return new Promise((fulfill, reject) => {
      const keyLength = Object.keys(attributes).length;
      const cleanParams = this._cleanParams(attributes);
      if (keyLength > Object.keys(cleanParams).length) {
        reject(new Error('not all parameters were used in where method'));
      } else {
        db(this.tableName)
        .where(cleanParams)
        .returning('*')
        .then((objects) => {
          this._getMultiResponse(objects, fulfill);
        }).catch(reject);
      }
    });
  }

  static _getSingleResponse(objects, fulfill) {
    if (!objects || objects.length === 0) {
      fulfill(null);
    } else {
      // return class instance
      const instance = new this(objects[0]);
      fulfill(instance);
    }
  }

  static _getMultiResponse(objects, fulfill, model) {
    if (!model) {
      model = this;
    }
    fulfill(objects.map(object => new model(object)));
  }

  static findByID(id) {
    this._checkModelValidity();
    return new Promise((fulfill, reject) => {
      db(this.tableName)
      .where(this.primaryId, id)
      .limit(1)
      .then(objects => this._getSingleResponse(objects, fulfill, reject)).catch(reject);
    });
  }

  static findById(id) {
    // undefined will error, null will not
    id = (id === undefined) ? null : id;
    this._checkModelValidity();
    return new Promise((fulfill, reject) => {
      db(this.tableName)
      .where(this.primaryId, id)
      .limit(1)
      .then(objects => this._getSingleResponse(objects, fulfill, reject)).catch(reject);
    });
  }

  static findByIds(ids) {
    return new Promise((fulfill, reject) => {
      db(this.tableName)
        .whereIn(this.primaryId, ids)
        .then((objects) => {
          this._getMultiResponse(objects, fulfill);
        }).catch(reject);
    });
  }

  static findManyByAttribute(attributeName, value, otherOperations) {
    this._checkModelValidity();

    if (!otherOperations) {
      otherOperations = dbCall => dbCall;
    }

    return new Promise((fulfill, reject) => {
      if (typeof attributeName === 'object' || typeof value === 'object') {
        reject(new Error(`Neither attributeName nor value can be objects: ${attributeName}, ${value}`));
      } else {
        const basicDbCall = db(this.tableName)
                            .where(attributeName, value);
        otherOperations(basicDbCall)
        .then(objects => this._getMultiResponse(objects, fulfill)).catch(reject);
      }
    });
  }

  static findOneByAttribute(attributeName, value, otherOperations) {
    this._checkModelValidity();
    if (!otherOperations) {
      otherOperations = dbCall => dbCall;
    }

    return new Promise((fulfill, reject) => {
      if (typeof attributeName === 'object' || typeof value === 'object') {
        reject(new Error(`Neither attributeName nor value can be objects: ${attributeName}, ${value}`));
      } else {
        const basicDbCall = db(this.tableName)
                            .where(attributeName, value);
        otherOperations(basicDbCall)
        .then(objects => this._getSingleResponse(objects, fulfill, reject)).catch(reject);
      }
    });
  }

  static findByEmail(email) {
    return this.findOneByAttribute('email', email);
  }

}

module.exports = {
  undefinedValuesCheck,
  BaseModel,
};
