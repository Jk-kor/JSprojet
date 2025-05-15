const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // N'oubliez pas d'installer avec: npm install multer

// Configuration de multer pour les uploads
const upload = multer({ 
    dest: 'public/images/uploads/',
    limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5MB par fichier
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

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

// Middleware pour sauvegarder les logements
function saveLogements(logements) {
    fs.writeFileSync(LOGEMENTS_FILE, JSON.stringify(logements, null, 2));
}

// Routes existantes
app.get('/', (req, res) => {
    const logements = loadLogements();
    res.render('accueil', { logements });
});

app.get('/logement/:id', (req, res) => {
    const logements = loadLogements();
    const logement = logements.find(l => l.id == req.params.id);
    if (!logement) return res.status(404).send('Logement non trouvé');
    res.render('detail', { logement });
});

app.get('/maps', (req, res) => {
    res.render('maps');
});

// Nouvelle route pour afficher le formulaire d'ajout
app.get('/add-listing', (req, res) => {
    res.render('add-listing');
});

// Route pour traiter la soumission du formulaire
app.post('/add-listing', upload.array('photos', 5), (req, res) => {
    const logements = loadLogements();
    
    // Générer un nouvel ID
    const newId = logements.length > 0 ? Math.max(...logements.map(l => l.id)) + 1 : 1;
    
    // Traiter les photos uploadées
    const photos = req.files.map(file => `uploads/${file.filename}`);
    
    // Créer le nouveau logement
    const newListing = {
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
        createdAt: new Date().toISOString()
    };

    // Ajouter et sauvegarder
    logements.push(newListing);
    saveLogements(logements);
    
    res.redirect(`/logement/${newId}`);
});

// Route pour supprimer un logement
app.post('/delete-listing/:id', (req, res) => {
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
    console.log("Serveur lancé sur http://localhost:3000");
    // Créer le dossier uploads s'il n'existe pas
    if (!fs.existsSync('public/images/uploads')) {
        fs.mkdirSync('public/images/uploads', { recursive: true });
    }
});