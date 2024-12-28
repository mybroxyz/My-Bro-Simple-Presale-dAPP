// utils/interactPresale.js

import Web3 from 'web3'
import { config } from '../dapp.config'
import BroTokenAbi from '../contracts/MyContractABI.json'

// Extract the ABI array from the imported JSON file
const contractABI = BroTokenAbi.abi

let web3
let broContract

// Initialize web3 and the contract
if (typeof window !== 'undefined' && window.ethereum) {
  web3 = new Web3(window.ethereum)
  broContract = new web3.eth.Contract(contractABI, config.contractAddress)
  console.log('Presale Contract Loaded:', config.contractAddress)
  console.log('ABI:', contractABI)
} else {
  console.warn('No injected web3/ethereum provider found.')
}

/**
 * Returns the contract's current trading phase: an integer [0..4]
 * 0 => Presale
 * 1 => LP Seeding
 * 2 => Claim / Airdrop Phase
 * 3 => Whitelist IDO
 * 4 => Public Sale
 */
export async function getPhase() {
  if (!broContract) return 0
  try {
    const phase = await broContract.methods.tradingPhase().call()
    return parseInt(phase)
  } catch (error) {
    console.error('getPhase Error:', error)
    return 0
  }
}

/**
 * Returns the total AVAX (in Ether units) held by the presale contract.
 */
export async function getTotalAvaxInContract() {
  try {
    const balWei = await web3.eth.getBalance(config.contractAddress)
    return web3.utils.fromWei(balWei, 'ether')
  } catch (err) {
    console.error('getTotalAvaxInContract Error:', err)
    return '0'
  }
}

/**
 * Returns how much AVAX (in Ether units) the user deposited into this presale.
 */
export async function getUserAvaxDeposited(userAddress) {
  if (!broContract) return '0'
  try {
    const userDepWei = await broContract.methods.totalAvaxUserSent(userAddress).call()
    return web3.utils.fromWei(userDepWei, 'ether')
  } catch (err) {
    console.error('getUserAvaxDeposited Error:', err)
    return '0'
  }
}

/**
 * Returns the user's BRO token balance (in Ether units).
 */
export async function getUserTokenBalance(userAddress) {
  if (!broContract) return '0'
  try {
    const balWei = await broContract.methods.balanceOf(userAddress).call()
    return web3.utils.fromWei(balWei, 'ether')
  } catch (err) {
    console.error('getUserTokenBalance Error:', err)
    return '0'
  }
}

/**
 * Allows a user to deposit AVAX to buy presale. 
 * Minimum required is 1 AVAX (enforced by contract).
 */
export async function depositAvax(amountAvax, userAddress) {
  if (!broContract) {
    return { success: false, message: 'Contract not initialized.' };
  }
  try {
    const valueToSend = web3.utils.toWei(amountAvax.toString(), 'ether');
    
    // Using the `send` method for the transaction
    const txReceipt = await broContract.methods.buyPresale().send({
      from: userAddress,
      value: valueToSend,
    });

    return {
      success: true,
      message: (
        <a
          href={`https://testnet.snowtrace.io/tx/${txReceipt.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Transaction confirmed: {txReceipt.transactionHash}
        </a>
      ),
    };
  } catch (err) {
    console.error('depositAvax Error:', err);
    return { success: false, message: 'Error depositing AVAX: ' + err.message };
  }
}


/**
 * Withdraw all AVAX from the contract (likely onlyOwner).
 */
export async function withdrawAllAvax(userAddress) {
  if (!broContract) {
    return { success: false, message: 'Contract not initialized.' }
  }
  try {
    const txReceipt = await broContract.methods.emergencyWithdraw().send({ from: userAddress })
    return {
      success: true,
      message: (
        <a href={`https://testnet.snowtrace.io/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">
          Transaction: {txReceipt.transactionHash}
        </a>
      )
    }
  } catch (err) {
    console.error('withdrawAllAvax Error:', err)
    return { success: false, message: 'Withdraw failed: ' + err.message }
  }
}

/**
 * Seeds LP on TraderJoe (lfj.gg) after presale ends. Only run once by the owner.
 */
export async function seedLP(userAddress) {
  if (!broContract) {
    return { success: false, message: 'Contract not initialized.' }
  }
  try {
    const txReceipt = await broContract.methods.seedLP().send({ from: userAddress })
    return {
      success: true,
      message: (
        <a href={`https://testnet.snowtrace.io/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">
          Transaction: {txReceipt.transactionHash}
        </a>
      )
    }
  } catch (err) {
    console.error('seedLP Error:', err)
    return { success: false, message: 'seedLP failed: ' + err.message }
  }
}

/**
 * Claim tokens for a single user. Anyone can call claimTokens(buyer_).
 */
export async function claimTokens(userAddress) {
  if (!broContract) {
    return { success: false, message: 'Contract not initialized.' }
  }
  try {
    const txReceipt = await broContract.methods.claimTokens(userAddress).send({ from: userAddress })
    return {
      success: true,
      message: (
        <a href={`https://testnet.snowtrace.io/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">
          Claim TX: {txReceipt.transactionHash}
        </a>
      )
    }
  } catch (err) {
    console.error('claimTokens Error:', err)
    return { success: false, message: 'claimTokens failed: ' + err.message }
  }
}

/**
 * Airdrop all presale buyers in chunks (maxTransfers=100).
 * Only the admin or anyone can call it, but practically should be admin or script-based.
 */
export async function airdropAll(userAddress) {
  if (!broContract) {
    return { success: false, message: 'Contract not initialized.' };
  }
  try {
    const txReceipt = await broContract.methods.airdropBuyers(100).send({ 
      from: userAddress // Specify the sender's address here
    });
    return {
      success: true,
      message: (
        <a href={`https://testnet.snowtrace.io/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">
          Airdrop TX: {txReceipt.transactionHash}
        </a>
      ),
    };
  } catch (err) {
    console.error('airdropAll Error:', err);
    return { success: false, message: 'AirdropAll failed: ' + err.message };
  }
}


/**
 * Checks if the global airdrop is completed.
 */
export async function isAirdropCompleted() {
  if (!broContract) return false
  try {
    return await broContract.methods.airdropCompleted().call()
  } catch (err) {
    console.error('isAirdropCompleted Error:', err)
    return false
  }
}

/**
 * Checks if the user has already claimed tokens or been airdropped.
 */
export async function isClaimed(userAddress) {
  if (!broContract) return false
  try {
    return await broContract.methods.userHasClaimed(userAddress).call()
  } catch (err) {
    console.error('isClaimed Error:', err)
    return false
  }
}

/**
 * Return time left until presale end (PRESALE_END_TIME) in seconds.
 */
export async function getPresaleCountdown() {
  if (!broContract) return 0
  try {
    const endTime = await broContract.methods.PRESALE_END_TIME().call()
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = endTime - now
    return timeLeft > 0 ? timeLeft : 0
  } catch (err) {
    console.error('getPresaleCountdown Error:', err)
    return 0
  }
}

/**
 * For a hypothetical whitelist phase (Phase 3).
 * In your contract, there's no direct "whitelist" mapping, 
 * but we do have userTokensFromWL for restricting token transfers. 
 * You can customize logic as needed.
 */
export async function getUserWhitelistData(userAddress) {
  if (!broContract) return { canBuy: 0, hasBought: 0, left: 0 }
  try {
    // Example: read userTokensFromWL
    const userWlWei = await broContract.methods.userTokensFromWL(userAddress).call()
    const userWl = parseInt(userWlWei)
    // Hypothetically, "hasBought" could be 0 if not tracked
    return { canBuy: userWl, hasBought: 0, left: userWl }
  } catch (err) {
    console.error('getUserWhitelistData Error:', err)
    return { canBuy: 0, hasBought: 0, left: 0 }
  }
}

/**
 * For Phase 4 (public sale).
 * Possibly read total Avax or total tokens sold from the contract, e.g. totalAvaxPresale or totalSupply.
 */
export async function getPublicSaleData() {
  if (!broContract) return { publicCollected: 0 }
  try {
    // Example: read totalAvaxPresale
    const totalAvaxWei = await broContract.methods.totalAvaxPresale().call()
    const totalAvax = web3.utils.fromWei(totalAvaxWei, 'ether')
    return { publicCollected: totalAvax }
  } catch (err) {
    console.error('getPublicSaleData Error:', err)
    return { publicCollected: 0 }
  }
}


/**
 * Returns the total AVAX collected during the presale (in Ether units).
 */
export async function getTotalAvaxPresale() {
  if (!broContract) return '0';
  try {
    const totalAvaxWei = await broContract.methods.totalAvaxPresale().call();
    return web3.utils.fromWei(totalAvaxWei, 'ether');
  } catch (err) {
    console.error('getTotalAvaxPresale Error:', err);
    return '0';
  }
}
