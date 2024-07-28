const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const path = require('path');
require('dotenv').config(); // Importa dotenv para manejar variables de entorno

const app = express();
const port = 3200;

// Configuración de Passport
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'https://sistemasorteos.onrender.com/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email']
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, { profile: profile, token: accessToken });
  }
));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://sistemasorteos.onrender.com/auth/google/callback'
  },
  function(token, tokenSecret, profile, done) {
    return done(null, { profile: profile, token: token });
  }
));

passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: 'https://sistemasorteos.onrender.com/auth/instagram/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, { profile: profile, token: accessToken });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Rutas de Facebook
app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    const user = req.user;
    const redirectUrl = `https://hangaroasorteo.onrender.com?token=${user.token}&id=${user.profile.id}&name=${user.profile.displayName}`;
    res.redirect(redirectUrl);
  }
);

// Rutas de Google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    const user = req.user;
    const redirectUrl = `https://hangaroasorteo.onrender.com?token=${user.token}&id=${user.profile.id}&name=${user.profile.displayName}`;
    res.redirect(redirectUrl);
  }
);

// Rutas de Instagram
app.get('/auth/instagram',
  passport.authenticate('instagram', { scope: ['user_profile']})
);

app.get('/auth/instagram/callback',
  passport.authenticate('instagram', { failureRedirect: '/' }),
  function(req, res) {
    const user = req.user;
    const redirectUrl = `https://hangaroasorteo.onrender.com?token=${user.token}&id=${user.profile.id}&name=${user.profile.displayName}`;
    res.redirect(redirectUrl);
  }
);

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/facebook');
  }
  res.json({ user: req.user });
});

// Iniciar el servidor HTTP
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
