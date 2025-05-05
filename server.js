const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));


const logements = [
  {
    name: 'Logement 1',
    description: 'Description du logement 1',
    photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
    prix: 100,
    note: 4.5,
    id: 1
  },
  {
    
  }
];

app.get('/', (req, res) => {
  res.render('accueil', { logements });
});

app.get('/logement/:id', (req, res) => {
  const id = req.params.id;
  const logement = logements.find(l => l.id == id);
  res.render('detail', { logement });
});

app.listen(3000);
