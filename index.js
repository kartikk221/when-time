const TimeTask = require('./src/TimeTask.js');

/**
 * Returns a TimeTask instance with equalTo mode for the time point.
 *
 * @param {String} time_string
 * @returns {TimeTask} TimeTask
 */
function isEqualTo(time_string) {
    return new TimeTask(time_string);
}

module.exports = {
    isEqualTo: isEqualTo,
};
