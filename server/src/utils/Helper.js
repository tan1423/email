/**
 * General-purpose helper functions.
 */

const { ObjectId } = require('mongodb');
const _ = require('lodash');

module.exports = {

  /**
   * Checks if the ID is a valid MongoDB ObjectId
   */
  isValidObjectId(id) {
    return ObjectId.isValid(id);
  },

  /**
   * Used to handle async/await promises and catch errors without try/catch
   * @example const [err, result] = await to(someAsyncFunction());
   */
  to(promise) {
    return promise
      .then(data => [null, data])
      .catch(err => [err]);
  },

  /**
   * Checks if an object has a property (nested safe check)
   */
  hasProp(obj, prop) {
    return _.has(obj, prop);
  },

  /**
   * Formats error returned by Axios
   */
  formatAxiosError(err) {
    if (
      this.hasProp(err, 'response') &&
      this.hasProp(err.response, 'data') &&
      this.hasProp(err.response.data, 'error') &&
      this.hasProp(err.response.data.error, 'description')
    ) {
      err = err.response.data.error.description;
    } else if (this.hasProp(err, 'message')) {
      err = err.message;
    } else if (
      this.hasProp(err, 'response') &&
      this.hasProp(err.response, 'data') &&
      this.hasProp(err.response.data, 'error')
    ) {
      err = err.response.data.error;
    }

    // Remove config if present
    if (this.hasProp(err, 'config')) {
      delete err.config;
    }

    return err;
  }
};
