const { DataTypes } = require('sequelize');
const sequelize = require('../database'); // Import Sequelize connection

const User = sequelize.define('User', {
  // Define model attributes
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = User;