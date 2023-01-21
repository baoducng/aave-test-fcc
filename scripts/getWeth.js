const { getNamedAccounts, ethers } = require("hardhat");
//const IWeth = require("../contracts/interfaces/IWeth");
const AMOUNT = ethers.utils.parseEther("0.1");

const IWEthAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
async function getWeth() {
  //I need to get the ABI and to get the contract address
  const { deployer } = await getNamedAccounts();
  const WEthContract = await ethers.getContractAt(
    "IWeth", //this needs to be ABI
    IWEthAddress,
    deployer
  );
  const tx = await WEthContract.deposit({ value: AMOUNT });
  tx.wait(1);
  const balance = await WEthContract.balanceOf(deployer);
}
module.exports = { getWeth, AMOUNT, IWEthAddress };
