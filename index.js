const express = require('express');
const server = express();
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const movies = require('./movies');
const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
server.use(morgan(morganSetting))
server.use(helmet());
server.use(cors());
require('dotenv').config();

server.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
});

function getGenre(arr){
  let newArr = arr.map(item => item['genre']);
  return newArr;
}

function getCountry(arr){
  let newArr = arr.map(item => item['country']);
  return newArr;
}

let genreArr = getGenre(movies);

let countryArr = getCountry(movies);


server.get('/movie', (req, res) => {
  const { genre, country, avg_vote } = req.query;

  let filteredMovies = [...movies];

  if (!genre && !country && !avg_vote) {
    return res.status(400).json({error: 'Please search by country, genre or avg_vote.'})
  }

  if (genre && !genreArr.includes(genre)){
    return res.status(400).json({error: 'Please enter valid genre. ex: action'});
  }

  if (country && !countryArr.includes(country)){
    return res.status(400).json({error: 'Please enter valid country. ex: United States'});
  }

  if (avg_vote && !(avg_vote > 0 && avg_vote <= 10)){
    return res.status(400).json({error: 'Please enter valid avg_vote. (Between 1 - 10) ex: 6.4'});
  }

  if (genre) {
    let convertedGenre = genre.toLowerCase();
    filteredMovies = filteredMovies.filter(movie => movie['genre'].toLowerCase().includes(convertedGenre));
  }

  if (country) {
    let convertedCountry = country.toLowerCase();
    filteredMovies = filteredMovies.filter(movie => movie['country'].toLowerCase().includes(convertedCountry));
  }

  if (avg_vote) {
    let convertedVote = Number(avg_vote);    
    filteredMovies = filteredMovies.filter(movie => Number(movie['avg_vote']) >= convertedVote);
  }

  res.json(filteredMovies);
});

server.use((error, req, res, next) => {
  let response
  if (process.env.NODE_ENV === 'production') {
    response = { error: { message: 'server error' }}
  } else {
    response = { error }
  }
  res.status(500).json(response)
})

const PORT = process.env.PORT || 8000
server.listen(PORT, () => console.log(`Server listening at http://localhost:${PORT}`));
