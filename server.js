const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));


const logements = [
  {
    id: 1,  
    name: "Logement 1", 
    photos: ["photo1.jpg", "photo2.jpg"],  
    prix: 100,  
    description: "baptiste ...",  
    note: 4.5,  
    // // Bonus possible :
    // location: { city: "Paris", latitude: 48.8566, longitude: 2.3522 }  // Pour la carte Leaflet
  },
  {
  id: 2,
  name: "Appartement moderne",
  photos: ["appartement.jpg", "appartement-cuisine.jpg"],
  prix: 200,
  description: "Appartement lumineux avec vue sur la ville.",
  note: 4.3
  },
  {
    id: 3,
    name: "Cabane en forêt",
    photos: ["cabane.jpg", "cabane-interieur.jpg"],
    prix: 120,
    description: "Une cabane cosy au cœur de la forêt, parfaite pour se déconnecter.",
    note: 4.8,
    // location: { city: "Lyon", latitude: 45.7640, longitude: 4.8357 }
  },
  {
    id: 4,
    name: "Appartement de con",
    photos: ["appartement.jpg", "appartement-cuisine.jpg"],
    prix: 200,
    description: "Appartement lumineux avec vue sur la ville.",
    note: 4.3
    },
    {
      id: 5,
      name: "Appartement de bébé",
      photos: ["appartement.jpg", "appartement-cuisine.jpg"],
      prix: 200,
      description: "Appartement lumineux avec vue sur la ville.",
      note: 4.3
      },
];

app.get('/', (req, res) => {
  res.render('accueil', { logements });
});

app.get('/logement/:id', (req, res) => {
  const id = req.params.id;
  const logement = logements.find(l => l.id == id);
  res.render('detail', { logement });
});

app.listen(3000,() => {
  console.log("Serveur lancé sur http://localhost:3000");
});
