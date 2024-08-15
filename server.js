
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const path = require('path');
const pg = require('pg'); //PostgreSQL

require('dotenv').config(); // Importa dotenv para manejar variables de entorno



const app = express();
const pool = new pg.Pool ({
  connectionString: process.env.DATABASE_URL,
  ssl: true
})

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


// Ruta para solicitar fotos del usuario
app.get('/api/facebook/photos', async (req, res) => {
  try {
    // Leer el token desde el archivo
    const data = fs.readFileSync('user_data.txt', 'utf8');

    // Extraer el token de los datos leídos
    const tokenMatch = data.match(/Token: (.*)/);
    const accessToken = tokenMatch ? tokenMatch[1] : null;

    if (!accessToken) {
      return res.status(400).send({ message: 'Token no encontrado' });
    }

    // Realizar la solicitud a la API de Facebook
    const response = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        fields: 'photos{images},about',
        access_token: accessToken
      }
    });

    // Enviar la respuesta al cliente
    res.send(response.data);
  } catch (error) {
    if (error.response) {
      res.status(500).send(error.response.data);
    } else {
      res.status(500).send({ message: 'An error occurred', error: error.message });
    }
  }
});


// Ruta para guardar el nombre de la imagen seleccionada en un archivo .txt
app.post('/api/save-photo-name', async (req, res) => {
  const photoId = req.body.photoId;

  try {
    // Leer el token desde el archivo
    const data = fs.readFileSync('user_data.txt', 'utf8');
    const tokenMatch = data.match(/Token: (.*)/);
    const accessToken = tokenMatch ? tokenMatch[1] : null;

    if (!accessToken) {
      return res.status(400).send({ message: 'Token no encontrado' });
    }

    // Realizar la solicitud a la API de Facebook para obtener el nombre de la foto
    const response = await axios.get(`https://graph.facebook.com/${photoId}`, {
      params: {
        fields: 'name',
        access_token: accessToken
      }
    });

    const photoName = response.data.name;

    // Sobrescribir el archivo con el nuevo nombre de la foto
    fs.writeFileSync('selected_photos.txt', `${photoName}\n`);
    console.log(`Nombre de la foto guardado: ${photoName}`);

    res.status(200).send({ message: 'Nombre de la foto guardado exitosamente' });
  } catch (error) {
    if (error.response) {
      res.status(500).send(error.response.data);
    } else {
      res.status(500).send({ message: 'An error occurred', error: error.message });
    }
  }
});


// Ruta para obtener los nombres de las fotos seleccionadas
app.get('/api/photo-names', (req, res) => {
  try {
    // Leer el archivo selected_photos.txt
    const data = fs.readFileSync('selected_photos.txt', 'utf8');

    // Dividir el contenido del archivo en un array de nombres, eliminando las líneas vacías
    const photoNames = data.split('\n').filter(name => name.trim() !== '');

    res.status(200).send(photoNames);
  } catch (error) {
    res.status(500).send({ message: 'Error al leer el archivo', error: error.message });
  }
});

app.get('/api/user-name', (req, res) => {
  fs.readFile('user_data.txt', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send({ message: 'Error al leer el archivo', error: err });
    }

    // Extraer el nombre del archivo
    const nameMatch = data.match(/Name: (.*)/);
    const name = nameMatch ? nameMatch[1] : null;

    if (!name) {
      return res.status(400).send({ message: 'Nombre no encontrado' });
    }

    res.send({ name: name });
  });
});




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

app.get('/ping', async(req, res) => {
  const result = await pool.query('SELECT NOW()');
  return res.json(result.rows[0]);
  
})

// Iniciar el servidor HTTP
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
