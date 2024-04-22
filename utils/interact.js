// Import Web3
import Web3 from 'web3'; // Import Web3
let web3; // Declare a global variable to store the Web3 instance
  // Import your DApp configuration
import { config } from '../dapp.config';


  // Import your contract ABI
const contract = require('../artifacts/contracts/BoredApe.sol/MyContractABI.json')

let nftContract;




const nftContractProxy = new Proxy({}, { 
  get: function(target, prop) {   try {

//console.log('Contract Address:', config.contractAddress);

    if (nftContract && nftContract.methods && typeof nftContract.methods[prop] === 'function') {
      const actualMethod = nftContract.methods[prop];
    //console.log('nftContract:', nftContract);
    //console.log(`Type of nftContract.methods[${prop}]:`, typeof nftContract.methods[prop]);      
      // Return the actual method
      return async (...args) => {
        //console.log(`Calling actual method for ${prop}`);
        const result = await actualMethod(...args).call();
        //console.log(`Result for ${prop}:`, result);
        return result;

      };
      
    } else {

    //console.log(`Calling undefined method: ${prop}`);
    
    // Return a dummy method that includes a call function
    return new Proxy(() => Promise.resolve(0), {
      get: function(dummyTarget, dummyProp) {
        if (dummyProp === 'call') {
          return async () => {
            //console.log(`Calling dummy call for ${prop}`);
            return Promise.resolve(0); // Return a default value for the dummy call
          };
        }
        
        return dummyTarget[dummyProp];
      }
    });
  }}catch (error) {
    console.error('Error with get proxy interact.js[]', error);
  }

},
});



const initWeb3 = async () => {
  console.log('################################ InitWeb3 [interact.js] #########################################');

  try {
    // Dynamically import Web3 to ensure it runs on the client side
    const { default: Web3 } = await import('web3');

    // Check if the user has MetaMask or another compatible wallet
    if (window.ethereum) {
      // Use the wallet's provider
      console.log('window.ethereum available #########################################');

      // Initialize Web3 with the MetaMask provider
      web3 = new Web3(window.ethereum);

      // Request account access using eth_requestAccounts
      let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Your application can now use web3 with the selected account
      nftContract = new web3.eth.Contract(contract.abi, config.contractAddress);
              accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      console.log('window.ethereum available #########################################');

      window.ethereum.on('accountsChanged', async (newAccounts) => {

        // Handle changes in accounts (e.g., user connects or switches accounts)
        console.log('#################### Accounts changed:', newAccounts);
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Ensure web3 is initialized before using it
        if (!web3) {
          console.error('Web3 is not initialized. Aborting.');
          return;
        }

        try {
          //console.log('window.ethereum available #########################################');

          // Update the contract instance
          //nftContract = new web3.eth.Contract(contract.abi, config.contractAddress);

          // Your application can now use web3
        } catch (error) {
          console.error('Error initializing contract:', error);
        }
      });
    } else {
      console.error('Wallet is not detected!');
    }

    // Start checking the sale state periodically
    // checkSaleState();
  } catch (error) {
    console.error('Error initializing web3 and contract:', error);
    // You can handle the error here, such as showing a user-friendly message.
  }
};


try{
// Check if running in a client-side context
if (typeof window !== 'undefined' && window.ethereum) {
  // Listen for changes in the connection status
  window.ethereum.on('accountsChanged', (accounts) => {
    // Handle changes in accounts (e.g., user connects or switches accounts)
  console.log('New Accounts:', accounts);
  initWeb3();  
});


  } else {
  // Handle the case where the Ethereum provider is not available
  console.error("Ethereum provider not found. Please install MetaMask or use a compatible Ethereum wallet. [interact.js]");
  // You might want to display a message to the user or provide instructions on how to proceed.
}
}catch (error) {
  console.error('Error with first initweb3 check interact.js[]', error);
}

let initializedWeb3 = false;

const initEthereumListener = () => { try{
  if (initializedWeb3 === false) {
    // Check if running in a client-side context
    if (typeof window !== 'undefined' && window.ethereum) {
      // Listen for changes in the connection status
      window.ethereum.on('accountsChanged', (accounts) => { try{
        // Handle changes in accounts (e.g., user connects or switches accounts)
        console.log('New Accounts:', accounts);
        initWeb3();  
        initializedWeb3 = true; // Set the flag to true after the first call
      }catch (error) {
        console.error('Error with Accounts Change Listener interact.js[]', error);
      }
      });

      // Check if the page is being loaded or refreshed
      if (document.readyState === 'complete') {
        // Page is already loaded, initiate Web3
        initWeb3();
        initializedWeb3 = true; // Set the flag to true after the first call
      } else {
        // Page is still loading, wait for it to complete
        window.addEventListener('load', () => {
          initWeb3();
          initializedWeb3 = true; // Set the flag to true after the first call
        });
      }
    } else {
      // Handle the case where the Ethereum provider is not available
      console.error("EVM provider not found. Please install Rabbi.io or Metamask or another compatible EVM wallet. [interact.js]");
      // You might want to display a message to the user or provide instructions on how to proceed.
    }
  }
}catch (error) {
  console.error('Error with listener interact.js[]', error);
}};

// Call the function to initialize the Ethereum listener
initEthereumListener();

// Enum for sale states
const SaleStates = {
  NOT_SET: 'NOT_SET',
  COUNTDOWN_TO_PRESALE: 'COUNTDOWN_TO_PRESALE',
  PRESALE_ALLOWED: 'PRESALE_ALLOWED',
  PUBLIC_SALE_ALLOWED: 'PUBLIC_SALE_ALLOWED',
};

let currentSaleState = SaleStates.NOT_SET;

// Function to get the current sale state
const getSaleState = async () => { try{
  const allowListStartTime = await nftContractProxy.allowlistStartTime.call();
  const publicSaleStartTime = await nftContractProxy.publicSaleStartTime.call();
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
}catch (error) {
  console.error('Error with getSaleState interact.js[]', error);
}};

let getPrice = 0;
export { getPrice };



// Function to perform actions based on the sale state
const handleSaleStateChange = async () => { try{
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
}catch (error) {
  console.error('Error with handleSaleStateChange interact.js[]', error);
}};

/*// Function to periodically check the sale state
const checkSaleState = () => {
  setInterval(handleSaleStateChange, 10000); // Check every ten seconds
};*/

// Start checking the sale state periodically
//checkSaleState();

export const getTotalMinted = async () => { try{
  const totalMinted = await nftContractProxy.totalSupply.call()
  return totalMinted
}catch (error) {
  console.error('Error with getTotalMinted interact.js[]', error);
}}

export const isPausedState = async () => { try{
  const paused = await nftContractProxy.paused.call()
  return paused
}catch (error) {
  console.error('Error with isPausedState interact.js[]', error);
}}

export const getMaxSupply = async () => { try{
  const maxSupply = await nftContractProxy.collectionSize.call()
  return maxSupply
}catch (error) {
  console.error('Error with getMaxSupply interact.js[]', error);
}}




export const getAmountForAllowList = async () => { try{
  const amountForAllowList = await nftContractProxy.amountForAllowlist.call();
  return amountForAllowList;
}catch (error) {
  console.error('Error with getAmontForAllowlist interact.js[]', error);
}}


export const getBalanceOf = async (owner) => { try{
  const balance = await nftContractProxy.balanceOf(owner).call();
  return balance;
}catch (error) {
  console.error('Error with getBalanceOf interact.js[]', error);
}}




export const checkAllowlist = async (owner) => { try{
  const isAllowListed = await nftContractProxy.balanceOf(owner).call();
  return isAllowListed;
}catch (error) {
  console.error('Error with checkAllowlist interact.js[]', error);
}}

export const isAllowListed = async (address) => { try{
  const isAllowListed = await nftContractProxy.allowlist(address).call();
  return isAllowListed;
}catch (error) {
  console.error('Error with isAllowlisted interact.js[]', error);
}}




export const getCollectionSize = async () => { try{
  const collectionSize = await nftContractProxy.collectionSize.call();
  return collectionSize;
}catch (error) {
  console.error('Error with getCollectionSize interact.js[]', error);
}}


export const getMaxPerAddressDuringMint = async () => { try{
  const maxPerAddressDuringMint = await nftContractProxy.maxPerAddressDuringMint.call();
  return maxPerAddressDuringMint;
}catch (error) {
  console.error('Error with getMaxPerAddressDuringMint interact.js[]', error);
}}


export const getRevealStartTime = async () => { try{
  const revealStartTime = await nftContractProxy.revealStartTime.call();
  return revealStartTime;
}catch (error) {
  console.error('Error with getRevealStartTime interact.js[]', error);
}}


export const getSymbol = async () => { try{
  const symbol = await nftContractProxy.symbol.call();
  return symbol;
}catch (error) {
  console.error('Error with getSymbol interact.js[]', error);
}}

export const getTotalSupply = async () => { try{
  const totalSupply = await nftContractProxy.totalSupply.call();
  return totalSupply;
}catch (error) {
  console.error('Error with getTotalSupply interact.js[]', error);
}}

export const getName = async () => { try{
  const name = await nftContractProxy.name.call();
  return name;
}catch (error) {
  console.error('Error with getName interact.js[]', error);
}}


export const isPublicSaleState = async () => { try{
  const publicSaleStartTime = await nftContractProxy.publicSaleStartTime.call();
  const currentTime = Math.ceil(Date.now() / 1000); // Current time in seconds
  const isPublicSale = currentTime >= publicSaleStartTime;
  return isPublicSale;
}catch (error) {
  console.error('Error with isPublicSaleState interact.js[]', error);
}} 
  
export const isPresaleState = async () => { try{
  const publicSaleStartTime = await nftContractProxy.publicSaleStartTime.call();
  const presaleSaleStartTime = await nftContractProxy.allowlistStartTime.call();
  const currentTime = Math.ceil(Date.now() / 1000); // Current time in seconds
  const isPresale = currentTime < publicSaleStartTime && currentTime >= presaleSaleStartTime;
  return isPresale;
}catch (error) {
  console.error('Error with isPresaleState interact.js[]', error);
}}

export const checkTimeLeftPresale = async () => { try{
  const presaleSaleStartTime = await nftContractProxy.allowlistStartTime.call();
  const currentTime = Math.ceil(Date.now() / 10000); // Current time in seconds
  const timeLeft = Math.max(0, (presaleSaleStartTime - currentTime) / 60); // Calculate time left in minutes
  return timeLeft;
}catch (error) {
  console.error('Error with checkTimeLeft interact.js[]', error);
}}

export const checkTimeLeftPublic = async () => { try{
  const publicSaleStartTime = await nftContractProxy.allowlistStartTime.call();
  const currentTime = Math.ceil(Date.now() / 10000); // Current time in seconds
  const timeLeft = Math.max(0, (publicSaleStartTime - currentTime) / 60); // Calculate time left in minutes
  return timeLeft;
}catch (error) {
  console.error('Error with checkTimeLeft interact.js[]', error);
}}


export const isNoSaleState = async () => { try{
  const paused = await nftContractProxy.paused.call()
  return paused
}catch (error) {
  console.error('Error with isPausedState interact.js[]', error);
}}

export const getPublicPrice = async () => {
  const publicPrice = await nftContractProxy.salePrice.call()
  return publicPrice
}

export const getPresalePrice = async () => { try{
  const presalePrice = await nftContractProxy.allowlistPrice.call()
  return presalePrice
}catch (error) {
  console.error('Error with getPresalePrice interact.js[]', error);
}}

export const presaleMint = async (mintAmount) => { try{
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
    web3.utils.toWei((config.presalePrice * mintAmount).toFixed(18), 'ether')
  ).toString(16), // hex
  data: nftContract.methods.allowlistMint(mintAmount).encodeABI(),
  nonce: nonce.toString(16)
};

//snowtrace.io
  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx]
    })

    return {
      success: true,
      status: (
        <a href={`https://testnet.snowtrace.io/tx/${txHash}`} target="_blank">  
          <p>✅ Check out your transaction on Snowtrace:</p>
          <p>{`https://testnet.snowtrace.io/tx/${txHash}`}</p>
        </a>
      )
    }
  } catch (error) {
    return {
      success: false,
      status: 'Error:' + error.message
    }
  }
}catch (error) {
  console.error('Error with presale mint interact.js[]', error);
}}

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
    web3.utils.toWei((config.publicPrice * mintAmount).toFixed(18), 'ether')
  ).toString(16), // hex
  data: nftContract.methods.publicSaleMint(mintAmount).encodeABI(),
  nonce: nonce.toString(16)
};


  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx]
    })

//testnet.snowtrace.io
    return {
      success: true,
      status: (
        <a href={`https://snowtrace.io/tx/${txHash}`} target="_blank">  
          <p>✅ Check out your transaction on Snowtrace:</p>
          <p>{`https://snowtrace.io/tx/${txHash}`}</p>
        </a>
      )
    }
  } catch (error) {
    return {
      success: false,
      status: 'Error:' + error.message
    }
  }
}
