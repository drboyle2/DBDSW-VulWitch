const { DataTypes } = require('sequelize');
const sequelize = require('../database'); // Import Sequelize connection

const User = sequelize.define('Account', {
  // Define model attributes
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = User;