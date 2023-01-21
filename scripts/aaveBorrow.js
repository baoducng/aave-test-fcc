const { getWeth, AMOUNT, IWEthAddress } = require("../scripts/getWeth.js");
const { getNamedAccounts, ethers } = require("hardhat");

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();
  //how do I deposit into aave?
  //need to get the address and the abi
  //first I gotta get the address from ILendingPooladdressesProvider
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    deployer
  );
  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    deployer
  );
  console.log(`lendingpooladdress updated ${lendingPool.address}`);
  //need to approve the amount i'm spending to the lending pool
  await approveERC20(IWEthAddress, lendingPool.address, AMOUNT, deployer);
  console.log("depositing..");
  await lendingPool.deposit(IWEthAddress, AMOUNT, deployer, 0);
  console.log("deposit success");
  let { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await getBorrowedData(lendingPool, deployer);
  //const borrowTx = lendingPool.borrow(DAI, )
  const DAIPrice = await getDAIPrice(deployer);
  const amountOfDaiToBorrow =
    availableBorrowsETH.toString() * 0.95 * (1 / DAIPrice.toNumber());
  const amountOfDaiToBorrowWei = ethers.utils.parseEther(
    amountOfDaiToBorrow.toString()
  );
  console.log(`you can borrow ${amountOfDaiToBorrowWei}`);
  const borrowTx = await lendingPool.borrow(
    DAI,
    amountOfDaiToBorrowWei,
    1,
    0,
    deployer
  );
  borrowTx.wait(1);
  console.log("borrowed.");
  await getBorrowedData(lendingPool, deployer);

  console.log("done");
}

async function getDAIPrice(account) {
  const priceOracleAddress = "0xa50ba011c48153de246e5192c8f9258a2ba79ca9";

  const priceOracle = await ethers.getContractAt(
    "IPriceOracleGetter",
    priceOracleAddress,
    account
  );
  return await priceOracle.getAssetPrice(DAI);
}

function formatEth(amount) {
  return ethers.utils.formatEther(amount);
}

async function getBorrowedData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(`totalCollateralETH ${formatEth(totalCollateralETH)}`);
  console.log(`totalDebtETH ${formatEth(totalDebtETH)}`);
  console.log(`avaiableBorrowEth ${formatEth(availableBorrowsETH)}`);
  return { totalCollateralETH, totalDebtETH, availableBorrowsETH };
}

async function approveERC20(contractAddress, spenderAddress, amount, account) {
  console.log("approving");
  const IERC20 = await ethers.getContractAt("IERC20", contractAddress, account);
  const res = await IERC20.approve(spenderAddress, amount);
  res.wait(1);
  console.log("Approved");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
