// Helper function to format timezone display
const formatTimezoneDisplay = (tz) => {
    // Convert minutes to hours (API sends GMT in minutes)
    // const minutes = parseInt(tz.value.replace(/[^-\d]/g, ''));
    const minutes = parseInt(tz.value.replace(/[^-\d]/g, ''), 10);
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes >= 0 ? '+' : '-';

    // Format as (GMT±HH:MM) Location
    const gmtPart = `(GMT${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')})`;
    // Convert "Region/City" to just "City" and replace underscores with spaces
    const location = tz.key.split('/').pop().replace(/_/g, ' ');

    return `${gmtPart} ${location}`;
};
export default formatTimezoneDisplay;