require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  databaseURL: process.env.DATABASE_URL || 'mongodb://localhost:27017/mydatabase',
};
