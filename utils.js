const towns = require("./towns");

function calculatePrice(city, product, quantity) {
  const price = towns[city][product] * quantity;
  const randomDecimal = (Math.floor(Math.random() * 100) / 100).toFixed(2);
  return (price + +randomDecimal).toFixed(2);
}

module.exports = calculatePrice;
