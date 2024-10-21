const passport = require('passport');
const googleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/userSchema');
require('dotenv').config();

passport.use(new googleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://trendview.tech/auth/google/callback', // Updated callback URL

},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user);
        } else {
            user = new User({
                firstName: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                isBlock: false,
                isAdmin: false
            });

            await user.save();
            return done(null, user);
        }
    } catch (error) {
        return done(error, null);
    }
}
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
    .then((user) => {
        done(null, user);
    })
    .catch(err => {
        console.error("Error in deserialization:", err);
        done(err, null);
    });
});

module.exports = passport;
