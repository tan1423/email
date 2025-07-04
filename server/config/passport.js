// ✅ Load environment variables from .env
require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Logs = require('../src/utils/Logs-util');
const Helper = require('../src/utils/Helper-util');
const Accounts = require('../src/utils/Accounts-utils');

// ✅ Verify JWT_SECRET exists
if (!process.env.JWT_SECRET) {
    throw new Error(process.env.JWT_SECRET);
}

const LOCAL_STRATEGY_CONFIG = {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false
};

const JWT_STRATEGY_CONFIG = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: false
};

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser(async (user, done) => {
    done(null, user);
});

// Basic Auth strategy
passport.use(new BasicStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({ "api.apiKey": username, "api.secretKey": password });

            if (!user) return done('Incorrect credentials.', false);

            const [err, response] = await Helper.to(Accounts.getUserById(user.user_id));

            if (err || response.status === 'error' || !response.data) {
                throw err || response.message || "User not exist!";
            }

            return done(null, response.data);
        } catch (err) {
            Logs.error(err);
            return done(null, false, { message: 'User not found!' });
        }
    }
));

// ✅ JWT strategy
passport.use('jwt', new JwtStrategy(JWT_STRATEGY_CONFIG, async (payload, done) => {
    try {
        const user = await User.findOne({ user_id: payload.id });

        if (!user) return done('Incorrect credentials.', false);

        const [err, response] = await Helper.to(Accounts.getUserById(user.user_id));

        if (err || response.status === 'error' || !response.data) {
            throw err || response.message || "User not exist!";
        }

        return done(null, response.data);
    } catch (err) {
        Logs.error(err);
        return done(null, false, { message: 'User not found!' });
    }
}));

// Optional: Local strategy (commented out)
// passport.use(new LocalStrategy(
//     LOCAL_STRATEGY_CONFIG,
//     async (email, password, done) => {
//         try {
//             let user = await User.findOne({ email });
//             if (!user) return done('Incorrect username or password.', false);

//             const isMatch = await bcrypt.compare(password, user.password);
//             if (!isMatch) return done('Incorrect username or password.', false);

//             return done(null, user);
//         } catch (err) {
//             Logs.error(err);
//             return done(null, false, { message: 'Internal server error.' });
//         }
//     }
// ));
