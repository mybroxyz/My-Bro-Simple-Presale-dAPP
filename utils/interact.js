// Import Web3
const Web3 = require('web3');

// Check if the Ethereum provider is available
if (window.ethereum) {
  // Initialize Web3 with the user's Ethereum provider (wallet)
  const web3 = new Web3(window.ethereum);

  // Listen for changes in the connection status
  window.ethereum.on('accountsChanged', (accounts) => {
    // Handle changes in accounts (e.g., user connects or switches accounts)
    console.log('Accounts changed:', accounts);

    // You may want to update your contract instance or perform other actions
    // based on the new connection status.
  });

  // Import your DApp configuration
  import { config } from '../dapp.config';

  // Import your contract ABI
  const contract = require('../contracts/MyContractABI.json');

  // Create a contract instance
  const nftContract = new web3.eth.Contract(contract.abi, config.contractAddress);

  // Now you can use web3 and nftContract to interact with the Ethereum blockchain
  // For example:
  // const accounts = await web3.eth.getAccounts();
  // const balance = await nftContract.methods.balanceOf(accounts[0]).call();
} else {
  // Handle the case where the Ethereum provider is not available
  console.error("Ethereum provider not found. Please install MetaMask or use a compatible Ethereum wallet. [interact.js]");
  // You might want to display a message to the user or provide instructions on how to proceed.
}


// Enum for sale states
const SaleStates = {
  NOT_SET: 'NOT_SET',
  COUNTDOWN_TO_PRESALE: 'COUNTDOWN_TO_PRESALE',
  PRESALE_ALLOWED: 'PRESALE_ALLOWED',
  PUBLIC_SALE_ALLOWED: 'PUBLIC_SALE_ALLOWED',
};

let currentSaleState = SaleStates.NOT_SET;

// Function to get the current sale state
const getSaleState = async () => {
  const allowListStartTime = await nftContract.methods.allowlistStartTime().call();
  const publicSaleStartTime = await nftContract.methods.publicSaleStartTime().call();
  const currentTime = Math.ceil(Date.now() / 1000); // Current time in seconds

  if (allowListStartTime === 0 || publicSaleStartTime === 0) {
    return SaleStates.NOT_SET;
  } else if (currentTime < allowListStartTime) {
    return SaleStates.COUNTDOWN_TO_PRESALE;
  } else if (currentTime >= allowListStartTime && currentTime < publicSaleStartTime) {
    return SaleStates.PRESALE_ALLOWED;
  } else {
    return SaleStates.PUBLIC_SALE_ALLOWED;
  }
};
let getPrice = 0;
export { getPrice };
// Function to perform actions based on the sale state
const handleSaleStateChange = async () => {
  const newSaleState = await getSaleState();

  if (newSaleState !== currentSaleState) {
    currentSaleState = newSaleState;
let price;
    // Perform actions based on the sale state changes
    switch (currentSaleState) {
      case SaleStates.NOT_SET:
        console.log('Sale time is not set yet. [interact.js]');
        // Additional actions or logic for when sale time is not set
        break;

      case SaleStates.COUNTDOWN_TO_PRESALE:
        console.log('Countdown to presale. [interact.js]');
        // Additional actions or logic for countdown to presale
        break;

      case SaleStates.PRESALE_ALLOWED:
        console.log('Presale is allowed. [interact.js]');
        
      price = await getPublicPrice();
        // Additional actions or logic for when presale is allowed
        break;

      case SaleStates.PUBLIC_SALE_ALLOWED:
        console.log('Public sale is allowed. Presale closed. [interact.js]');
        price = await getPresalePrice();
        // Additional actions or logic for when public sale is allowed
        break;

      default:
        break;
    }

        // Update 'getPrice' if a valid 'price' is obtained
    if (price !== undefined) {
      getPrice = () => price;
    }
    
  }
};

// Function to periodically check the sale state
const checkSaleState = () => {
  setInterval(handleSaleStateChange, 1000); // Check every second
};

// Start checking the sale state periodically
checkSaleState();

export const getTotalMinted = async () => {
  const totalMinted = await nftContract.methods.totalSupply().call()
  return totalMinted
}

export const getMaxSupply = async () => {
  const maxSupply = await nftContract.methods.collectionSize().call()
  return maxSupply
}

/*export const isPausedState = async () => {
  const paused = await nftContract.methods.paused().call()
  return paused
}*/

export const isAllowListed = async (address) => {
  const isAllowListed = await nftContract.methods.allowlist(address).call();
  return isAllowListed;
}


export const getAmountForAllowList = async () => {
  const amountForAllowList = await nftContract.methods.amountForAllowlist().call();
  return amountForAllowList;
}


export const getBalanceOf = async (owner) => {
  const balance = await nftContract.methods.balanceOf(owner).call();
  return balance;
}


export const getCollectionSize = async () => {
  const collectionSize = await nftContract.methods.collectionSize().call();
  return collectionSize;
}


export const getMaxPerAddressDuringMint = async () => {
  const maxPerAddressDuringMint = await nftContract.methods.maxPerAddressDuringMint().call();
  return maxPerAddressDuringMint;
}


export const getRevealStartTime = async () => {
  const revealStartTime = await nftContract.methods.revealStartTime().call();
  return revealStartTime;
}


export const getSymbol = async () => {
  const symbol = await nftContract.methods.symbol().call();
  return symbol;
}

export const getTotalSupply = async () => {
  const totalSupply = await nftContract.methods.totalSupply().call();
  return totalSupply;
}

export const getName = async () => {
  const name = await nftContract.methods.name().call();
  return name;
}


export const isPublicSaleState = async () => {
  const publicSaleStartTime = await nftContract.methods.publicSaleStartTime().call();
  const currentTime = Math.ceil(Date.now() / 1000); // Current time in seconds
  const isPublicSale = currentTime >= publicSaleStartTime;
  return isPublicSale;
} 
  
export const isPresaleState = async () => {
  const publicSaleStartTime = await nftContract.methods.publicSaleStartTime().call();
  const presaleSaleStartTime = await nftContract.methods.allowlistStartTime().call();
  const currentTime = Math.ceil(Date.now() / 1000); // Current time in seconds
  const isPresale = currentTime < publicSaleStartTime && currentTime >= presaleStartTime;
  return isPresale;
}

export const getPublicPrice = async () => {
  const publicPrice = await nftContract.methods.salePrice().call()
  return publicPrice
}

export const getPresalePrice = async () => {
  const presalePrice = await nftContract.methods.allowlistPrice().call()
  return presalePrice
}

export const presaleMint = async (mintAmount) => {
  if (!window.ethereum.selectedAddress) {
    return {
      success: false,
      status: 'To be able to mint, you need to connect your wallet'
    }
  }

  const nonce = await web3.eth.getTransactionCount(
    window.ethereum.selectedAddress,
    'latest'
  )

  // Set up our Ethereum transaction
  const tx = {
    to: config.contractAddress,
    from: window.ethereum.selectedAddress,
    value: parseInt(
      web3.utils.toWei(String(config.price * mintAmount), 'ether')
    ).toString(16), // hex
    data: nftContract.methods
      .allowlistMint(mintAmount)//, proof)
      .encodeABI(),
    nonce: nonce.toString(16)
  }

  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx]
    })

    return {
      success: true,
      status: (
        <a href={`https://testnet.snowtrace.io/tx/${txHash}`} target="_blank">  //snowtrace.io
          <p>✅ Check out your transaction on Snowtrace:</p>
          <p>{`https://testnet.snowtrace.io/tx/${txHash}`}</p>
        </a>
      )
    }
  } catch (error) {
    return {
      success: false,
      status: '😞 Smth went wrong:' + error.message
    }
  }
}

export const publicMint = async (mintAmount) => {
  if (!window.ethereum.selectedAddress) {
    return {
      success: false,
      status: 'To be able to mint, you need to connect your wallet'
    }
  }

  const nonce = await web3.eth.getTransactionCount(
    window.ethereum.selectedAddress,
    'latest'
  )

  // Set up our Ethereum transaction
  const tx = {
    to: config.contractAddress,
    from: window.ethereum.selectedAddress,
    value: parseInt(
      web3.utils.toWei(String(config.price * mintAmount), 'ether')
    ).toString(16), // hex
    data: nftContract.methods.mint(mintAmount).encodeABI(),
    nonce: nonce.toString(16)
  }

  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx]
    })

    return {
      success: true,
      status: (
        <a href={`https://testnet.snowtrace.io/tx/${txHash}`} target="_blank">  //snowtrace.io
          <p>✅ Check out your transaction on Snowtrace:</p>
          <p>{`https://testnet.snowtrace.io/tx/${txHash}`}</p>
        </a>
      )
    }
  } catch (error) {
    return {
      success: false,
      status: '😞 Smth went wrong:' + error.message
    }
  }
}
