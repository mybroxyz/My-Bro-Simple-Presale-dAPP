// This includes presale logic for the $BRO token launch on LFG.gg on Avalanche.
// Users can transfer AVAX directly to this contract address during the presale time window.
// There is a minimum presale buy in amount of 1 AVAX per transfer.
// LP to be trustlessly created after the presale ends, 
// using half of the $BRO supply and all of the presale AVAX.
// Presale buyers' $BRO tokens can be trustlessly "airdropped" out after presale ends.
// Note: There are no whale limits or allowlists for the presale, 
// to allow for open and dynamic presale AVAX collection size ("Fair Launch" style presale)

// LP is burned since LP fees are automatically converted to more LP for LFJ TraderJoe V1 LPs.

// Base token contract imports created with https://wizard.openzeppelin.com/


interface IUniswapV2Factory { 

    function createPair(address tokenA, address tokenB)
        external
        returns (address pair);


    function getPair(address tokenA, address tokenB)
        external
        view
        returns (address pair);

}


//TraderJoe version of Uniswap code which has AVAX instead of ETH in the function names
interface ITJUniswapV2Router01 {  

    function factory() external pure returns (address);

    function addLiquidityAVAX(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountAVAXMin,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountAVAX,
            uint256 liquidity
        );
}



/*
⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣼⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣧⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢸⣿⣿⣷⡀⠀⠀⠀⠀⣀⣀⠀⠀⠀⠀⢀⣾⣿⣿⡇⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣷⠀⣠⣾⣿⣿⣷⣄⠀⣾⣿⣿⣿⡿⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠛⠿⠁⣼⣿⣿⣿⣿⣿⣿⣧⠈⠿⠛⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠘⠛⠛⠛⠛⠛⠛⠛⠛⠃⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣼⠏⠀⠿⣿⣶⣶⣶⣶⣿⠿⠀⠹⣷⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢰⡟⠀⣴⡄⠀⣈⣹⣏⣁⡀⢠⣦⠀⢻⣇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠀⠐⢿⣿⠿⠿⠿⠿⠿⠿⣿⡿⠂⠀⠙⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣴⣿⣷⣄⠉⢠⣶⠒⠒⣶⡄⠉⣠⣾⣿⣦⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠚⠛⠛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠛⠛⠓⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣿⣿⡿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀


    /$$    /$$$$$$$  /$$$$$$$   /$$$$$$ 
  /$$$$$$ | $$__  $$| $$__  $$ /$$__  $$
 /$$__  $$| $$  \ $$| $$  \ $$| $$  \ $$  
| $$  \__/| $$$$$$$ | $$$$$$$/| $$  | $$  
|  $$$$$$ | $$__  $$| $$__  $$| $$  | $$   
 \____  $$| $$  \ $$| $$  \ $$| $$  | $$     
 /$$  \ $$| $$$$$$$/| $$  | $$|  $$$$$$/
|  $$$$$$/|_______/ |__/  |__/ \______/  
 \_  $$_/                                                                                                           
   \__/                                                                                                             

*/

// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; //OpenZeppelin Contracts (last updated v5.0.0+)
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol"; //OpenZeppelin Contracts (last updated v5.0.0+)
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; //OpenZeppelin Contracts (last updated v5.1.0)

contract BroTokenWithPresale is ERC20, ERC20Permit, ReentrancyGuard {

    uint256 private     _420_TRILLION_690_BILLION = 420690 * 10**9 * 10**18; //420690000000000000000000000000000
    //420.69 Trillion in 18 decimal precision, 420,690,000,000,000 . 000,000,000,000,000,000

    uint256 private     _TOTAL_SUPPLY_TO_MINT = _420_TRILLION_690_BILLION; 
    //BRO token total supply amount to mint to this contract in constructor

    uint256 private     _FIFTY_PERCENT = 50; //50% of BRO supply is for the presale buyers

    uint256 public     PRESALERS_BRO_SUPPLY = (_TOTAL_SUPPLY_TO_MINT * _FIFTY_PERCENT) / 100; 
    //50% of BRO supply calculated as (_TOTAL_SUPPLY_TO_MINT * 50) / 100

    uint256 public     LP_BRO_SUPPLY = _TOTAL_SUPPLY_TO_MINT - PRESALERS_BRO_SUPPLY; 
    //Remaining BRO is for automated LP

    uint256 private     _FULL_MOON_TIME = 1734254100; 
    //Launch on December's full moon zenith
    //Unix timestamp of Sun Dec 15 2024 04:15:00 AM EST GMT-0500

    uint256 public     IDO_START_TIME = _FULL_MOON_TIME; //Whitelist phase start time

    uint256 private     _HOURS_TO_PREP_IDO = 2 hours; 
    //2 hours before IDO_START_TIME to prepare for IDO by seeding LP,
    //and giving some time for users to collect their tokens from the presale

    uint256 public     PRESALE_END_TIME = IDO_START_TIME - _HOURS_TO_PREP_IDO; 
    //LP seeding start time in unix timestamp, must be before IDO_START_TIME

    uint256 private     _TIMESTAMP_BUFFER = 1 minutes; //Buffer for miner timestamp variance

    uint256 public     SEEDING_TIME = PRESALE_END_TIME + _TIMESTAMP_BUFFER; 
    //Date LP seeding and presale tokens dispersal can begin, after presale ends,
    //plus a time buffer since miners can vary timestamps

    uint256 private     _LENGTH_OF_WL_PHASE = 5 minutes; 
    //Length of time the whitelist phase will last, 5 minutes is 300 seconds

    uint256 public     WL_END_TIME = IDO_START_TIME + _LENGTH_OF_WL_PHASE; 
    //End of whitelist phase in unix timestamp

    uint256 private     _ONE_AVAX = 1000000000000000000; //1 AVAX in WEI

    uint256 public     MINIMUM_BUY = _ONE_AVAX; 
    //1 AVAX in WEI minimum buy, to prevent micro buy spam attack hurting the airdrop phase

    uint256 private     _TOTAL_PHASES = 4; 
    //Total phases for IDO
    //Phase 0 is the presale
    //Phase 1 is LP seeding
    //Phase 2 is presale token dispersal
    //Phase 3 is the whitelist IDO launch
    //Phase 4 is public trading

    address public     DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD; 
    //Burn LP by sending it to this address

    address public     WAVAX_ADDRESS = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c; 
    //WAVAX C-Chain Mainnet: 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7
    //WAVAX Fuji Testnet: 0xd00ae08403B9bbb9124bB305C09058E32C39A48c

    address public     ROUTER_ADDRESS = 0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901; 
    //Main BRO/AVAX LP dex router
    //TraderJoe router C-Chain Mainnet: 0x60aE616a2155Ee3d9A68541Ba4544862310933d4
    //TraderJoe router Fuji Testnet: 0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901
    

    address public immutable LFJ_V1_PAIR_ADDRESS; //Swap with pair BRO/WAVAX

    ITJUniswapV2Router01 public lfjV1Router; 
    //DEX router interface for swapping BRO and making LP on lfj.gg TraderJoe V1 router

    address[] public presaleBuyers = new address[](0); 
    //Array to store presale buyers addresses to send BRO tokens to later

    bool public lpSeeded = false; //Flag for if LP is seeded
    bool public airdropCompleted = false; //Flag to indicate when airdrop is completed

    uint256 public airdropIndex = 0; //Count through the airdrop array when sending out tokens
    uint256 public totalAvaxPresale = 0; //Count total AVAX in WEI received during presale

    mapping (address => bool) public previousBuyer; //True if user is a previous presale buyer
    mapping (address => uint256) public airdropSlot; //Airdrop array slot of the presale buyer
    mapping (address => uint256) public totalAvaxUserSent; //Total AVAX in WEI sent by presale buyers
    mapping (address => bool) public userHasClaimed; //True if user has claimed their tokens already
    mapping (address => uint256) public userTokensFromWL; //BRO tokens received per user during WL

    
    event AirdropCompleted(
        address indexed caller 
    );

    event LPSeeded(
        address indexed caller,
        uint256 avaxAmount,
        uint256 broAmount
    );

    event BuyerAdded(
        address indexed buyer
    );

    event PresaleBought(
        address indexed buyer,
        uint256 amount
    );

    event AvaxWithdraw(
        address indexed to, 
        uint256 amount
    );

    event TokensClaimed(
        address indexed to, 
        uint256 amount
    );

    event DustSent(
        address indexed to, 
        uint256 amount
    );
   

    modifier afterPresale() { //Check if presale has ended plus buffer time
        require(block.timestamp >= SEEDING_TIME, "Presale time plus buffer has not yet ended"); 
        //Cannot calculate token ratios until all AVAX is collected and presale ends
        _;
    }        

    modifier seeded() { //Check if LP has been seeded
        require(lpSeeded, "LP has not yet been seeded");
        _;
    }

    modifier notSeeded() { //Check if LP has not been seeded
        require(!lpSeeded, "LP has already been seeded");
        _;
    }


    //Change name and symbol to Bro, BRO for actual deployment
    constructor()
    ERC20("My Bro", "BRO")
    ERC20Permit("My Bro")
    { //This ERC20 constructor creates our BRO token name and symbol. 
        require(IDO_START_TIME > block.timestamp + 3 hours, "IDO_START_TIME must be > 3 hours from now");
        require(IDO_START_TIME < block.timestamp + 7 days, "IDO_START_TIME must be < 7 days from now");

        ITJUniswapV2Router01 lfjV1Router_;
        address lfjV1PairAddress_;
        
        lfjV1Router_ = ITJUniswapV2Router01(ROUTER_ADDRESS);

        //Initialize Uniswap V2 BRO/WAVAX LP pair, with 0 LP tokens in it to start with
        lfjV1PairAddress_ = IUniswapV2Factory(lfjV1Router_.factory()).createPair(address(this), WAVAX_ADDRESS);

        lfjV1Router = lfjV1Router_; //Uses the interface created above
        LFJ_V1_PAIR_ADDRESS = lfjV1PairAddress_; //Uses the pair address created above

        super._update(address(0), address(this), _TOTAL_SUPPLY_TO_MINT); 
        //Mint total supply to this contract, to later make LP and do the presale dispersal
    }



    //Public functions:

    //To open trading, check if LP is seeded, and if IDO_START_TIME has started yet
    function tradingActive() public view returns (bool) { 
        return(lpSeeded && block.timestamp >= IDO_START_TIME); //Return true if IDO has already started
    }


    //Check if we are in the restricted whitelist phase
    function tradingRestricted() public view returns (bool) { 
        return tradingActive() && block.timestamp <= (WL_END_TIME); 
        //True if tradingActive and whitelisted phase is not yet over
    }


    function tradingPhase() public view returns (uint256) { //Check the phase
        uint256 timeNow_ = block.timestamp;

        if (!tradingActive()) {
            if (timeNow_ < SEEDING_TIME) {
                return 0; //0 == Presale time plus buffer is not completed yet
            } 
            else if (!lpSeeded) {
                return 1; //1 == LP seeding can begin
            } 
            else {
                return 2; //2 == Presale airdrop token dispersal is allowed
            } 
        } 
        else if (tradingRestricted()) { //If trading is active and restricted then it's the WL phase
            return 3; //3 == Whitelist IDO launch
        } 
        else { //If trading is active and not restricted then it's the public phase
            return 4; //4 == Public trading
        }
    }

    
    //Calculate amount of Bro tokens to send to buyer as ratio of AVAX sent, after presale is completed
    function presaleTokensPurchased(address buyer_) public view afterPresale returns (uint256) {
        return (totalAvaxUserSent[buyer_] * PRESALERS_BRO_SUPPLY) / totalAvaxPresale;
        //Note we cannot precalculate and save this value, as we don't know the total AVAX until presale ends
        //Also if we did save the value that would cost more gas than calculating it here on the fly
    }


    //This function must be called once, after the presale ends
    function seedLP() public nonReentrant afterPresale notSeeded {
        
        //Approve BRO tokens for transfer by the router
        _approve(address(this), ROUTER_ADDRESS, LP_BRO_SUPPLY);

        try //Seed LFJ V1 LP with all avax collected during presale
        lfjV1Router.addLiquidityAVAX{value: totalAvaxPresale}( 
            address(this), 
            LP_BRO_SUPPLY, //Seed with remaining BRO supply not airdropped to presale buyers
            0, //Infinite slippage
            0, //Infinite slippage
            DEAD_ADDRESS,
            block.timestamp)
        {}
        catch {
            revert(string("seedLP() failed"));
        }

        lpSeeded = true;
        emit LPSeeded(msg.sender, totalAvaxPresale, LP_BRO_SUPPLY);
    }


    //Note that nonReentrant is called in the internal _buyPresale
    //Public function alternative to the receive() function, to buy presale tokens
    function buyPresale() public payable { 
        _buyPresale(msg.value, msg.sender);
    }


    //This is so users can exit the presale before the presale is over. 
    //We will remove them from the airdrop array and reset their total deposited to 0
    function emergencyWithdraw() external nonReentrant notSeeded {
        address buyer_ = msg.sender;
        uint256 amount_ = totalAvaxUserSent[buyer_];
        require(amount_ > 0, "No AVAX to withdraw");
        totalAvaxUserSent[buyer_] = 0; //Reset user's total AVAX deposited to 0
        totalAvaxPresale-= amount_; //Subtract user's AVAX from total AVAX received by all users
        _popAndSwapAirdrop(buyer_); //Remove user from presaleBuyers airdrop array
        payable(buyer_).transfer(amount_); //Send back the user's AVAX deposited
        previousBuyer[buyer_] = false; //Set user status to not being a previous buyer anymore
        emit AvaxWithdraw(buyer_, amount_);
    }


    //Airdrop function where users can set max transfers per tx
    function airdropBuyers(uint256 maxTransfers_) external nonReentrant afterPresale seeded { 
        require(!airdropCompleted, "Airdrop has already been completed");
        _airdrop(maxTransfers_);
    }


    //Claim tokens to a single user (pull method), instead of receiving in the multisend airdrop (push method)
    //We will allow anyone to send a single user their tokens due to them, if they haven't received them yet
    function claimTokens(address buyer_) external nonReentrant afterPresale seeded {
        uint256 amount_ = presaleTokensPurchased(buyer_);
        require(amount_ > 0, "No tokens to claim");
        require(!userHasClaimed[buyer_], "User has already received their BRO tokens");
        userHasClaimed[buyer_] = true;
        _popAndSwapAirdrop(buyer_); //Remove user from presaleBuyers array so they don't get airdropped
        _transfer(address(this), buyer_, amount_); //Send tokens from contract itself to the presale buyer
        emit TokensClaimed(buyer_, amount_);
        if (airdropIndex >= presaleBuyers.length) {
            airdropCompleted = true;
            sendDust(buyer_); //Send any leftover token dust to the last claimant
            emit AirdropCompleted(buyer_);
        }
    }
    


    //Internal functions:

    function _popAndSwapAirdrop(address removedUser_) private { //Remove user from presaleBuyers array
        uint256 slot_ = airdropSlot[removedUser_]; //Get slot of user to remove from airdrop array presaleBuyers
        uint256 lastIndex_ = presaleBuyers.length - 1; //Get the last index of the array
        if (slot_ == lastIndex_) { //If the user to remove is the last user in the array
            presaleBuyers.pop(); //Remove the user from the array
            return;
        }
        address lastUser_ = presaleBuyers[lastIndex_]; //Get the last user in the array
        presaleBuyers.pop(); //Remove the duplicated last user from the array
        presaleBuyers[slot_] = lastUser_; //Swap the duplicated user in the array with the user to remove
        airdropSlot[lastUser_] = slot_; //Update the slot mapping of the duplicated user
        //Note we do not reset the slot mapping of the removedUser_, as it is not used again, (unless the
        //removedUser_ buys in the presale again in the future, in which case the slot mapping will be updated).

    }


    function _update( //Phases check
        address from_,
        address to_,
        uint256 amount_
    ) internal override(ERC20) {
        if (amount_ == 0) {
            super._update(from_, to_, 0);
            return;
        }

        uint256 tradingPhase_ = tradingPhase();
        if (tradingPhase_ >= _TOTAL_PHASES) { //Don't limit public phase 4
            super._update(from_, to_, amount_);
            return;
        }

        //Don't limit initial LP seeding, or the presale tokens dispersal, for phases 1 and 2
        if (from_ == address(this) && tradingPhase_ > 0) { 
            super._update(from_, to_, amount_);
            return;
        }
        
        _beforeTokenTransfer(to_, amount_, tradingPhase_); //Check if user is allowed in WL phase
        super._update(from_, to_, amount_); //Send the token transfer requested by user
    }


    function _beforeTokenTransfer(
        address to_,
        uint256 amountTokensToTransfer_,
        uint256 tradingPhase_
    ) private {
        require(tradingPhase_ >= 3, "Whitelist IDO phase is not yet active");
        if (to_ != LFJ_V1_PAIR_ADDRESS) { //Don't limit selling or LP creation during IDO
            userTokensFromWL[to_] += amountTokensToTransfer_; 
            //Track total amount of tokens user receives during the whitelist phase
            uint256 amountPresaleTokensPurchased_ = presaleTokensPurchased(to_);
            require(userTokensFromWL[to_] <= amountPresaleTokensPurchased_, 
            "Cannot receive more tokens than purchased in the presale during WL phase");
        }
    }


    function _buyPresale(uint256 amount_, address buyer_) private nonReentrant notSeeded {
        require(block.timestamp < PRESALE_END_TIME, "Presale has already ended");
        require(amount_ >= MINIMUM_BUY, "Minimum buy of 1 AVAX per transaction; Not enough AVAX sent");
        
        if (!previousBuyer[buyer_]) { //Add buyer to the presaleBuyers array if they are a first time buyer
            previousBuyer[buyer_] = true;
            presaleBuyers.push(buyer_);
            airdropSlot[buyer_] = presaleBuyers.length - 1; 
            //Store the slot of the buyer we just added into the airdrop array presaleBuyers
            emit BuyerAdded(buyer_);
        }

        totalAvaxUserSent[buyer_] += amount_;
        totalAvaxPresale += amount_;
        emit PresaleBought(buyer_, amount_);
    }


    function _airdrop(uint256 maxTransfers_) private {
        uint256 limitCount_ = airdropIndex + maxTransfers_; //Max amount of addresses to airdrop
        address buyer_;
        uint256 amount_;
        uint256 localIndex_; 

        while (airdropIndex < presaleBuyers.length && airdropIndex < limitCount_) {
            localIndex_ = airdropIndex;
            airdropIndex++; //Increment the global index after the local index is set
            buyer_ = presaleBuyers[localIndex_];
            require(!userHasClaimed[buyer_], "User has already received their BRO tokens");
            userHasClaimed[buyer_] = true;

            amount_ = (totalAvaxUserSent[buyer_] * PRESALERS_BRO_SUPPLY) / totalAvaxPresale; 
            //Note we cannot precalculate and save this value, as we don't know the total AVAX until presale ends
            //Also if we did save the value that would cost more gas than calculating it here on the fly
            //Calculate amount_ here, instead of with the time checked presaleTokensPurchased(), to save gas

            _transfer(address(this), buyer_, amount_); //Send tokens from contract itself to the presale buyers
            emit TokensClaimed(buyer_, amount_);
        }

        if (airdropIndex >= presaleBuyers.length) {
            airdropCompleted = true;
            sendDust(buyer_); //Send any leftover token dust to the last claimant
            emit AirdropCompleted(msg.sender);
        }
    }
    

    //Due to the nature of the decimal division in the airdrop and claim calculations, 
    //we may have some tiny amount of token dust leftover in the contract, sent here to the last claimant
    function sendDust(address lastClaimant_) internal {
        uint256 dust_ = balanceOf(address(this));
        _transfer(address(this), lastClaimant_, dust_);
        emit DustSent(lastClaimant_, dust_);
    }



    //Fallback and/or receive public functions:

    //The user's wallet will add extra gas when transferring AVAX; We aren't restricted to only sending an event.
    //Note that nonReentrant is called in the internal _buyPresale
    receive() external payable { //This function is used to receive AVAX from users for the presale
        _buyPresale(msg.value, msg.sender); 
    }



    //Test functions, remove for actual deployment:

    function testSetSettings(//Just for testing we can change any setting
        uint256 IDO_START_TIME_, 
        uint256 PREP_TIME_,
        uint256 WL_END_TIME_,
        uint256 PRESALE_END_TIME_,
        uint256 MINIMUM_BUY_,
        bool lpSeeded_,
        bool airdropCompleted_
        ) public
    {
        IDO_START_TIME = IDO_START_TIME_;
        SEEDING_TIME = PREP_TIME_;
        WL_END_TIME = WL_END_TIME_;
        PRESALE_END_TIME = PRESALE_END_TIME_;
        MINIMUM_BUY = MINIMUM_BUY_;
        lpSeeded = lpSeeded_;
        airdropCompleted = airdropCompleted_;
    }


    function test_transfer(uint256 amount_, address buyer_) public {
        _transfer(address(this), buyer_, amount_);
    }


    function testTransfer(uint256 amount_, address buyer_) public {
        transfer(buyer_, amount_);
    }


}



  //Legal Disclaimer: 
//My Bro (BRO) is a meme coin (also known as a community token) created for entertainment purposes only. 
//It holds no intrinsic value and should not be viewed as an investment opportunity or a financial instrument.
//It is not a security, as it promises no financial returns to buyers, 
//and does not rely solely on the efforts of the creators and developers.

//There is no formal development team behind BRO, and it lacks a structured roadmap. 
//Users should understand the project is experimental and may undergo changes or discontinuation without prior notice.

//BRO serves as a platform for the community to engage in activities,
//such as liquidity provision and token swapping on the Avalanche blockchain. 
//It aims to foster community engagement and collaboration, 
//allowing users to participate in activities that may impact the value of their respective tokens.

//The value of BRO and associated community tokens may be subject to significant volatility and speculative trading. 
//Users should exercise caution and conduct their own research before engaging with BRO or related activities.

//Participation in BRO-related activities should not be solely reliant on the actions or guidance of developers. 
//Users are encouraged to take personal responsibility for their involvement and decisions within the BRO ecosystem.

//By interacting with BRO or participating in its associated activities, 
//users acknowledge and accept the inherent risks involved,
//and agree to hold harmless the creators and developers of BRO from any liabilities or losses incurred.



/*
   Launch instructions:
1. Set the     values at the start of the contract and the token name and symbol.
2. Deploy contract with solidity version: 0.8.28 and runs optimized: 200.
3. Verify contract and set socials on block explorer and Dexscreener.
4. Bug bounty could be good to set up on https://www.sherlock.xyz/ or https://code4rena.com/ or similar.
5. After presale ends, call seedLP() in presale contract to create LP.
6. Call airdropBuyers() repeatedly in the presale contract to send out all the airdrop tokens to presale buyers.
*/