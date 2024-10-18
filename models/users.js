const { DataTypes } = require('sequelize');
const sequelize = require('../database'); // Import Sequelize connection

const User = sequelize.define('Account', {
  // Define model attributes
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: { // Added password field
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  // Additional model options
  timestamps: true, // Automatically add createdAt and updatedAt timestamps
});

// Export the model
module.exports = User;
