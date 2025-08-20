require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "",
      chainId:
    }
  },
  paths: {
    artifacts: "./src/contracts",
  },
};
