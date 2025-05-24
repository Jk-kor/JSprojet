const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // N'oubliez pas d'installer avec: npm install multer
const session = require('express-session');

// Configuration de multer pour les uploads
const upload = multer({ 
    dest: 'public/images/uploads/',
    limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5MB par fichier
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: 'votre_secret_secure',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mettez true si en HTTPS
}));

// Middleware pour passer userId à toutes les vues
app.use((req, res, next) => {
    res.locals.userId = req.session.userId;
    next();
});
// Chemin vers le fichier JSON
const LOGEMENTS_FILE = path.join(__dirname, 'logement.json');



// Middleware pour charger les logements
function loadLogements() {
    try {
        return JSON.parse(fs.readFileSync(LOGEMENTS_FILE, 'utf8'));
    } catch (err) {
        console.error("Erreur de lecture du fichier logement.json", err);
        return [];
    }
}

const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (err) {
        console.error("Erreur de lecture du fichier users.json", err);
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Middleware pour sauvegarder les logements
function saveLogements(logements) {
    fs.writeFileSync(LOGEMENTS_FILE, JSON.stringify(logements, null, 2));
}

// middleware verification de connection
function isOwner(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    const logements = loadLogements();
    const logement = logements.find(l => l.id == req.params.id);
    
    if (!logement) {
        return res.status(404).send('Logement non trouvé');
    }
    if (logement.ownerId !== req.session.userId) {
        return res.status(403).send('Action non autorisée');
    }
    next();
}

// Routes de connexion
app.get('/login', (req, res) => {
    res.render('login', { error: req.query.error });
});

app.post('/login', (req, res) => {
    const users = loadUsers();
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        req.session.userId = user.id;
        return res.redirect('/');
    }
    res.redirect('/login?error=1');
});


app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Routes existantes
app.get('/', (req, res) => {
    const logements = loadLogements();
    res.render('accueil', { 
        logements,
        userId: req.session.userId 
    });
});


app.get('/logement/:id', (req, res) => {
    const logements = loadLogements();
    const logement = logements.find(l => l.id == req.params.id);
    if (!logement) return res.status(404).send('Logement non trouvé');
    res.render('detail', { 
        logement,
        userId: req.session.userId 
    });
});

app.get('/maps', (req, res) => {
    res.render('maps');
});

// Nouvelle route pour afficher le formulaire d'ajout
app.get('/add-listing', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('add-listing');
});

// Route pour traiter la soumission du formulaire
app.post('/add-listing', upload.array('photos', 5), (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    const logements = loadLogements();
    
    // Générer un nouvel ID
    const newId = logements.length > 0 ? Math.max(...logements.map(l => l.id)) + 1 : 1;
    
    // Traiter les photos uploadées
    const photos = req.files.map(file => `uploads/${file.filename}`);
    
    // Créer le nouveau logement
    const newListing = {
        ownerId: req.session.userId,
        id: newId,
        name: req.body.name,
        photos: photos.length ? photos : ['default.jpg'], // Photo par défaut si aucune uploadée
        prix: parseInt(req.body.prix),
        description: req.body.description,
        type: req.body.type,
        chambres: parseInt(req.body.chambres) || 0,
        salle_de_bain: parseInt(req.body.salle_de_bain) || 0,
        cuisine: req.body.cuisine ? 1 : 0,
        salon: req.body.salon ? 1 : 0,
        surface: parseInt(req.body.surface) || 0,
        note: 0, // Nouvelle annonce sans note
        capacite: parseInt(req.body.capacite),
        equipements: req.body.equipements || [], 
        createdAt: new Date().toISOString()
    };

    // Ajouter et sauvegarder
    logements.push(newListing);
    saveLogements(logements);
    
    res.redirect(`/logement/${newId}`);
});

// Route pour afficher le formulaire de modification
app.get('/edit-listing/:id', isOwner, (req, res) => { 
    const logements = loadLogements();
    const logement = logements.find(l => l.id == req.params.id);
    if (!logement) return res.status(404).send('Logement non trouvé');
    res.render('edit-listing', { logement });
});

// Route pour traiter la modification
app.post('/edit-listing/:id', isOwner , upload.array('photos', 5), (req, res) => {
    try {
        let logements = loadLogements();
        const index = logements.findIndex(l => l.id == req.params.id);
        
        if (index === -1) {
            return res.status(404).send('Logement non trouvé');
        }

        // Garder les anciennes photos si aucune nouvelle n'est uploadée
        const oldPhotos = logements[index].photos;
        const newPhotos = req.files.map(file => `uploads/${file.filename}`);
        const finalPhotos = newPhotos.length > 0 ? newPhotos : oldPhotos;

        const updatedListing = {
            ...logements[index],
            name: req.body.name,
            photos: finalPhotos,
            prix: parseInt(req.body.prix),
            description: req.body.description,
            type: req.body.type,
            chambres: parseInt(req.body.chambres) || 0,
            salle_de_bain: parseInt(req.body.salle_de_bain) || 0,
            surface: parseInt(req.body.surface) || 0,
            capacite: parseInt(req.body.capacite),
            updatedAt: new Date().toISOString()
        };

        logements[index] = updatedListing;
        saveLogements(logements);
        
        res.redirect(`/logement/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de la modification');
    }
});

const users = [
    { id: 1, username: 'admin', password: 'admin123' } // À remplacer par un système sécurisé
];

app.get('/register', (req, res) => {
    res.render('register', { error: req.query.error });
});

// Route d'inscription
app.post('/register', (req, res) => {
    const users = loadUsers();
    const { username, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        return res.render('register', { error: 'Les mots de passe ne correspondent pas' });
    }
    if (users.some(u => u.username === username)) {
        return res.render('register', { error: 'Ce nom d\'utilisateur existe déjà' });
    }

    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = {
        id: newId,
        username,
        password // À hasher en production !
    };
    
    users.push(newUser);
    saveUsers(users);
    
    req.session.userId = newUser.id;
    res.redirect('/');
});

// Modifiez la route /logement/:id pour passer userId
app.get('/logement/:id', (req, res) => {
    const logements = loadLogements();
    const logement = logements.find(l => l.id == req.params.id);
    if (!logement) return res.status(404).send('Logement non trouvé');
    res.render('detail', { 
        logement,
        userId: req.session.userId 
    });
});

// Route pour supprimer un logement
app.post('/delete-listing/:id', isOwner , (req, res) => {
    let logements = loadLogements();
    const initialLength = logements.length;
    
    logements = logements.filter(l => l.id != req.params.id);
    
    if (logements.length === initialLength) {
        return res.status(404).send('Logement non trouvé');
    }
    
    saveLogements(logements);
    res.redirect('/');
});

app.listen(3000, () => {
     const users = loadUsers();
    if (!users.some(u => u.username === 'admin')) {
        users.push({
            id: 1,
            username: 'admin',
            password: 'admin123' // À changer en production !
        });
        saveUsers(users);
    }
    console.log("Serveur lancé sur http://localhost:3000");
    // Créer le dossier uploads s'il n'existe pas
    if (!fs.existsSync('public/images/uploads')) {
        fs.mkdirSync('public/images/uploads', { recursive: true });
    }
});