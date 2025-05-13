const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static('public'));

// appeler le fichier JSON
const logementsPath = path.join(__dirname, 'logement.json');
const logements = JSON.parse(fs.readFileSync(logementsPath, 'utf8'));

app.get('/', (req, res) => {
  res.render('accueil', { logements });
});

app.get('/logement/:id', (req, res) => {
  const id = req.params.id;
  const logement = logements.find(l => l.id == id);
  res.render('detail', { logement });
});

app.get('/maps', (req, res) => {
  res.render('maps');
});

app.listen(3000,() => {
  console.log("Serveur lancé sur http://localhost:3000");
});
