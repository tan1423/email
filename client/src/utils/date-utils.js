import moment from 'moment-timezone';

// Convert date to user's timezone
export const convertToTimezone = (dateString, timezone) => {
    if (!dateString) return 'Invalid date';

    const key = timezone?.key || 'Asia/Kolkata'; // default to India timezone
    const m = moment(dateString);
    if (!m.isValid()) return 'Invalid date';

    return m.tz(key).format('ddd, MMM D, YYYY, h:mm A');
};