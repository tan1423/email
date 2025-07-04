const ct = require('countries-and-timezones');
function getGmtOffset(timezone) {
    const timezoneData = ct.getTimezone(timezone);

    if (!timezoneData) {
        throw new Error(`Invalid timezone: ${timezone}`);
    }

    const date = new Date();
    const utcOffset = -date.getTimezoneOffset() / 60; // Get UTC offset in hours
    const timezoneOffset = ct.getTimezone(timezone).utcOffset;
    return `(GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset})`;
}
module.exports = { getGmtOffset };