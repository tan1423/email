const Response = require('../../utils/Response')
const ct = require('countries-and-timezones');
const User = require('../../models/User');
const { getGmtOffset } = require('../../utils/timeZone');
const Logs = require('../../utils/Logs');

module.exports = {
    /**
     * Get The list Of The timezone by country
     * @param {*} req 
     * @param {*} res 
     */
    getTimezonesByCountry: (req, res) => {
        try {
            const countries = ct.getAllCountries();
            const formattedTimezones = [];

            for (const countryCode in countries) {
                const country = countries[countryCode];

                country.timezones.forEach((timezone) => {
                    const gmtOffset = getGmtOffset(timezone);
                    formattedTimezones.push({ key: timezone, value: gmtOffset });
                });
            }
            res.status(200).json(Response.success("Timezones fetched successfully", formattedTimezones));
        } catch (error) {
            Logs.error("Error in fetching timezones: ", error);
        }

    },

    /**
     * Save The Timezone into user account
     * @param {*} req 
     * @param {*} res 
     */
    saveTimeZone: async (req, res) => {
        try {
            const userId = req.user.id;
            const { timezone } = req.body;

            if (!timezone) {
                return res.status(400).json(Response.error('timezone are required'));
            }

            const gmtOffset = getGmtOffset(timezone);
            if (!gmtOffset) {
                return res.status(400).json(Response.error('Invalid timezone'));
            }
            const timezoneData = {
                key: timezone,
                value: gmtOffset,
            };
            await User.findOneAndUpdate(
                { userId },
                { timezone: timezoneData },
            );
            // Save the timezone (use a database in production)
            return res.status(200).json(Response.success('Timezone saved successfully', { timezone, gmtOffset }));
        } catch (error) {
            Logs.error("Error in saving timezone: ", error);
            return res.status(500).json(Response.error("Error while saving timezone", error));
        }

    }
}