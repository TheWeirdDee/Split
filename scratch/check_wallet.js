const { ethers } = require("ethers");
const pk = "438f2b831bbefcd582efb0cdfd76554397976135b9332fc9a4134fced2d7c27f";
const wallet = new ethers.Wallet(pk);
console.log("Address:", wallet.address);
