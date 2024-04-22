//JOINT404-FIFO converts a user's specific NFTs to ERC20 tokens, with a FIFO array method for converting back to ERC721.
//Created by @0xJelle for @ChiknOGMeme to wrap $WEED.



//File import: utils/ReentrancyGuard.sol

// License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/ReentrancyGuard.sol)

//pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}



interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}



interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
}



/*

    ___  ________  ___  ________   _________  ___   ___  ________  ___   ___     
   |\  \|\   __  \|\  \|\   ___  \|\___   ___\\  \ |\  \|\   __  \|\  \ |\  \    
   \ \  \ \  \|\  \ \  \ \  \\ \  \|___ \  \_\ \  \\_\  \ \  \|\  \ \  \\_\  \   
 __ \ \  \ \  \\\  \ \  \ \  \\ \  \   \ \  \ \ \______  \ \  \\\  \ \______  \  
|\  \\_\  \ \  \\\  \ \  \ \  \\ \  \   \ \  \ \|_____|\  \ \  \\\  \|_____|\  \ 
\ \________\ \_______\ \__\ \__\\ \__\   \ \__\       \ \__\ \_______\     \ \__\
 \|________|\|_______|\|__|\|__| \|__|    \|__|        \|__|\|_______|      \|__|



*/
// SPDX-License-Identifier: MIT
pragma solidity =0.8.24;


contract JOINT404 {

    address constant ERC20_ADDRESS = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7; //token address.
    address constant ERC721_ADDRESS = 0xb92A5f94466305659976e95c98131B86D8982375; //NFT address.

    uint256 constant TOKENS_PER_NFT_GWEI = 1000000 ETH; //1 Million whole tokens per NFT.
    uint256 constant TOTAL_SUPPLY = 420; //NFT total supply.
    uint256 constant MAX_NFT_TRANSFERS = 200; //Max per transaction to prevent out of gas errors.

    IERC20 constant ITOKEN = IERC20(ERC20_ADDRESS); //ERC20 token contract interface.
    IERC721 constant INFT = IERC721(ERC721_ADDRESS); //ERC721 NFT contract interface. 

    
    uint256 public depositIndex; //Index to track where to overwrite in the array for FIFO when depositing NFTs.
    uint256 public withdrawIndex; //Index to track where to read from in the array for FIFO when withdrawing NFTs.
    uint16[](TOTAL_SUPPLY) public nftArray; //Array of NFT IDs deposited into contract, can change uint16 size as needed.


    event TokensDeposited(address indexed user, uint amount); //To see the NFT IDs withdrawn to user from here check the NFTs contract transfer event logs or add to event here.
    event NFTsDeposited(address indexed user, uint[] tokenIds); //To see the amount of tokens withdrawn to user check the ERC20 contract transfer event logs or add to event here.

    constructor() {
        require(ERC20_ADDRESS != address(0), "ERC20 address must not be 0");
        require(ERC721_ADDRESS != address(0), "ERC721 address must not be 0");
        require(TOKENS_PER_NFT_GWEI > 0, "Tokens per NFT must be greater than 0");
        require(TOTAL_SUPPLY > 0, "Total supply must be greater than 0");
        require(TOTAL_SUPPLY < 65536, "Update nftArray to use uint32 if total supply exceeds 65536");
        require(TOTAL_SUPPLY > 256, "Update nftArray to use uint8 if total supply is less than 257"); 
        require(MAX_NFT_TRANSFERS > 0, "Max NFT withdrawal must be greater than 0");
        require(MAX_NFT_TRANSFERS <= 200, "Max NFT withdrawal must be less than 200"); //Test and see what the max is for your particular setup to prevent out of gas errors.    
    }


        //Public functions:

        /// @dev Deposits ERC20 tokens into the contract and sends ERC721 tokens to the user in exchange.
        /// @param amount_ The amount of ERC20 tokens to deposit in GWEI.
    function depositERC20(uint amount_) public nonReentrant {
        require(amount_ > 0, "Amount must be greater than 0");
        require((amount_ % TOKENS_PER_NFT_GWEI) == 0, "Amount deposited must be in whole unit values of 1 Million tokens per NFT");
        uint256 nftAmount_ = amount_ / TOKENS_PER_NFT_GWEI; //Total number of NFTs to send to user immediately.
        require(nftAmount_ <= MAX_NFT_TRANSFERS, "Amount exceeds max NFT withdrawal limit of 200 NFTs per transaction");
        //require(nftAmount <= nftArray.length, "Not enough NFTs in the array to withdraw amount requested"); //If extra ERC20 circulating other than seeded into this contract.
        tokenTransfer(msg.sender, address(this), amount_);
        withdrawNFTs(nftAmount_);
        emit TokensDeposited(msg.sender, amount_);
    }


        /// @dev Deposits an array of ERC721 tokens into the contract and instantly sends ERC20s to the user in exchange.
        /// @param idArray_ The array of ERC721 token IDs to deposit.
    function depositERC721Array(uint16[] memory idArray_) public nonReentrant {
        uint256 length_ = idArray_.length;
        require(length_ > 0, "ID Array must not be empty");
        require(length_ <= MAX_NFT_TRANSFERS, "Amount exceeds max NFT deposit limit of 200 NFTs per transaction");
        address addressThis_ = address(this);
        //require(length_ * TOKENS_PER_NFT_GWEI <= ITOKEN.balanceOf(addressThis_), "Not enough tokens available now"); //If less ERC20 seeded into contract than circulating NFT supply.
        uint256 depositIndex_ = depositIndex;
        uint256 msgSender_ = msg.sender;
        uint256[] storage nftArray_ = nftArray; // Storage pointer to save gas on the multiple writes in the following loop.

        for (uint256 i = 0; i < length_; ++i) {
            nftTransfer(msgSender_, addressThis_, idArray_[i]);
            nftArray_[depositIndex_] = idArray_[i];
            ++depositIndex_;
            if (depositIndex_ == TOTAL_SUPPLY) { //Reset index to start if it reaches the end of the array.
                depositIndex_ = 0;
            }
        }

        depositIndex = depositIndex_;
        uint256 amount_ = length_ * TOKENS_PER_NFT_GWEI; //Total number of tokens in GWEI to send to user immediately.
        tokenTransfer(address(this), msg.sender, amount_);
        emit NFTsDeposited(msg.sender, idArray_);
    }


    //Private functions:

        /// @dev Withdraws ERC721 tokens from the contract to the user in FIFO order.
        /// @param nftsOwed_ The number of NFTs owed to the user.
    function withdrawNFTs(uint256 nftsOwed_) private {
        uint256 withdrawIndex_ = withdrawIndex;
        uint256 msgSender_ = msg.sender;
        uint256[] storage nftArray_ = nftArray; // Storage pointer to save gas on the multiple reads in the following loop.

        for (uint256 i = 0; i < nftsOwed; ++i) {
            nftTransfer(address(this), msgSender_, nftArray_[withdrawIndex_]);
            ++withdrawIndex_;
            if (withdrawIndex_ == TOTAL_SUPPLY) { //Reset index to start if it reaches the end of the array.
                withdrawIndex_ = 0;
            }
        }

        withdrawIndex = withdrawIndex_;
    }


        /// @dev Transfers ERC721 tokens from the sender to the receiver.
        /// @param sender_ The address of the sender.
        /// @param receiver_ The address of the receiver.
        /// @param tokenId_ The ID of the ERC721 token to transfer.
    function nftTransfer(address sender_, address receiver_, uint256 tokenId_) private {
        require(INFT.transferFrom(sender_, receiver_, tokenId_), "ERC721 token transfer unsuccessful");
    }


        /// @dev Transfers ERC20 tokens from the sender to the receiver.
        /// @param sender_ The address of the sender.
        /// @param receiver_ The address of the receiver.
        /// @param amount_ The amount of ERC20 tokens to transfer.
    function tokenTransfer(address sender_, address receiver_, uint256 amount_) private {
        require(ITOKEN.transferFrom(sender_, receiver_, amount_), "ERC20 token transfer unsuccessful");
    }



}




   //Launch instructions for new LP of existing ERC721:

//Launch the ERC20 token first so we have it's address, then use that address to launch this contract (or change to immutable and set in constructor with interfaces).

//Transfer all ERC20 token supply to this contract via the ERC20 contract transferFrom function directly. 
//(Do not use this contract's depositERC20 function to seed the initial ERC20 tokens).
//(The token holder will need to have the unrestricted ability to transfer all the ERC20 tokens to this contract before the IDO launch.)

//Next, deposit NFTS by calling this contract's depositERC721Array() to withdraw ERC20 tokens. Repeat until you have enough ERC20 tokens to LP with.
//(Do not send ERC721 NFTs directly to this address via the ERC20 contract transferFrom function.)
//(This JOINT404 contract will need to have the unrestricted ability to transfer all the ERC20 tokens to at least the LP seeder before the IDO launch.)

//Pair the ERC20 tokens withdrawn with AVAX on a DEX, presumably at the same value as their recently minted price.
//(The LP seeder will need to have the unrestricted ability to transfer all the ERC20 tokens to the DEX LP contract before the IDO launch.)

//Release DAPP for this contract.
//Launch the ERC20 IDO.

//*If pre-IDO transfer restrictions, they should be removed for this contract and the ERC20 token supply minter.
//*If token taxes, consider removing them for transfers involving this contract, (alternatively only tax this contract's transfers).
//*If weird amount needed with taxes then dapp could calculate it for the user based on number of NFTs to "buy". Dapp can pre-validate the user's balances and approvals.

//*To "burn" excess NFT mint supply but keep all the NFT IDs in circulation, we call depositERC721Array() here and then transfer the received ERC20 tokens to 0xdEaD. 
//(Only works for FIFO array method here or a random shuffle version, would not work for a FILO version of this contract)