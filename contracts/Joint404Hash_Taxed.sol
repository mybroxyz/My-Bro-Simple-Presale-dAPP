//Joint404Hash_Taxed converts a user's specific NFTs to ERC20 tokens, with a pseudo-random block.hash method for converting back to ERC721, adjusting for taxes.
//Created by @0xJelle for @WenLaunchInfo to wrap $BANANAZ.



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

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";


contract Joint404Hash_Taxed is ReentrancyGuard{
    address constant ERC721_ADDRESS = 0xA4ca90E5692639a9A9B9579A797211dCbDbC6AB7; //NFT address.
    address constant ERC20_ADDRESS = 0x0dB7ab53CadEbf9dc09D1Ae6F3E8aDfABBA8C587; //Token address.

    uint256 constant TOKENS_PER_NFT_GWEI = 1000000 ether; //1 Million whole tokens per NFT.
    uint256 constant TOTAL_SUPPLY = 420; //NFT total supply.
    uint256 constant MAX_NFT_TRANSFERS = 200; //Max per transaction to prevent out of gas errors.
    uint256 constant TOKEN_TAX_BPS = 100; //Add tax to incoming ERC20 tokens, represented in basis pts 1/10000. 100 bps is 1%.

    IERC20 constant ITOKEN = IERC20(ERC20_ADDRESS); //ERC20 token contract interface.
    IERC721 constant INFT = IERC721(ERC721_ADDRESS); //ERC721 NFT contract interface. 

    uint16[] public nftArray; //Array of NFT IDs deposited into contract, can change uint16 size as needed.


    event TokensDeposited(address indexed user, uint256 amount); //To see the NFT IDs withdrawn to user from here check the NFTs contract transfer event logs or add to event here.
    event NFTsDeposited(address indexed user, uint16[] tokenIds); //To see the amount of tokens withdrawn to user check the ERC20 contract transfer event logs or add to event here.

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
        /// @param totalAmount_ The amount of ERC20 tokens to deposit in GWEI.
    function depositERC20Taxed(uint256 totalAmount_) public nonReentrant {
        uint256 amount_ = totalAmount_ - (totalAmount_ * TOKEN_TAX_BPS / 10000); //Calculate amount received after taxes
        require(amount_ > 0, "Amount must be greater than 0");
        require((amount_ % TOKENS_PER_NFT_GWEI) == 0, "Amount deposited must be in whole unit values of 1 Million tokens per NFT");
        uint256 nftAmount_ = amount_ / TOKENS_PER_NFT_GWEI; //Total number of NFTs to send to user immediately.
        require(nftAmount_ <= MAX_NFT_TRANSFERS, "Amount exceeds max NFT withdrawal limit of 200 NFTs per transaction");
        //require(nftAmount <= nftArray.length, "Not enough NFTs in the array to withdraw amount requested"); //If extra ERC20 circulating other than seeded into this contract.
        tokenTransferFrom(msg.sender, address(this), totalAmount_);
        withdrawNFTs(nftAmount_);
        emit TokensDeposited(msg.sender, amount_);
    }


        /// @dev Deposits an array of ERC721 tokens into the contract and instantly sends ERC20s to the user in exchange.
        /// @param idArray_ The array of ERC721 token IDs to deposit.
    function depositERC721Array(uint16[] memory idArray_) public nonReentrant {
        uint256 inputLength_ = idArray_.length;
        require(inputLength_ > 0, "ID Array must not be empty");
        require(inputLength_ <= MAX_NFT_TRANSFERS, "Amount exceeds max NFT deposit limit of 200 NFTs per transaction");
        //require(inputLength_ * TOKENS_PER_NFT_GWEI <= ITOKEN.balanceOf(address(this)), "Not enough tokens available now"); //If less ERC20 seeded into contract than circulating NFT supply.
        address msgSender_ = msg.sender;
        address addressThis_ = address(this);
        uint16[] storage nftArray_ = nftArray; // Storage pointer to save gas on the multiple writes in the following loop.

        for (uint256 i = 0; i < inputLength_; ++i) {
            nftTransferFrom(msgSender_, addressThis_, idArray_[i]);
            nftArray_.push(idArray_[i]);
        }

        uint256 amount_ = inputLength_ * TOKENS_PER_NFT_GWEI; //Total number of tokens in GWEI to send to user immediately.
        tokenTransfer(msg.sender, amount_);
        emit NFTsDeposited(msg.sender, idArray_);
    }


        /// @dev Calculate the total in GWEI of ERC20 tokens before taxes, to send in to the contract, to receive amount_ worth of ERC721 NFTs
        /// @param postTaxValue_ The amount of ERC20 tokens we want the contract to receive after taxes.
    function preTaxAmountGwei(uint256 postTaxValue_) public pure returns (uint256) {
              // Calculate pre-tax value using the formula
        uint256 preTaxValue_ = (postTaxValue_ * 10000) / (10000 - TOKEN_TAX_BPS);
        return preTaxValue_;
    }


    //Private functions:

        /// @dev Withdraws ERC721 tokens from the contract to the user in pseudorandom order.
        /// @param nftsOwed_ The number of NFTs owed to the user.
    function withdrawNFTs(uint256 nftsOwed_) private {
        address msgSender_ = msg.sender;
        address addressThis_ = address(this);
        uint16[] storage nftArray_ = nftArray; //Storage pointer to save gas on the multiple reads in the following loop.
        uint256 pseudoRandom_ = uint(keccak256(abi.encodePacked(msgSender_, block.timestamp, blockhash(block.number)))); //This is not secure randomness, since validators can hack it.
        uint256 nftArrayLength_ = (nftArray_.length);
        uint256 randomIndex_;

        for (uint256 i = 0; i < nftsOwed_; ++i) {
            pseudoRandom_ = uint(keccak256(abi.encodePacked(pseudoRandom_, i))); //Make new pseudorandom value on each loop.
            randomIndex_ = pseudoRandom_ % (nftArrayLength_); //Get random index within array length.
            nftTransferFrom(addressThis_, msgSender_, nftArray_[randomIndex_]); //Transfer ID at random index to user
            nftArray_[randomIndex_] = nftArray_[nftArrayLength_ - 1]; //Overwrite random index with last index
            nftArray_.pop(); //Remove last index
            --nftArrayLength_; //Account for the removed index
        }
    }


        /// @dev Transfers ERC721 tokens from the sender to the receiver.
        /// @param sender_ The address of the sender.
        /// @param receiver_ The address of the receiver.
        /// @param tokenId_ The ID of the ERC721 token to transfer.
    function nftTransferFrom(address sender_, address receiver_, uint256 tokenId_) private {
        INFT.transferFrom(sender_, receiver_, tokenId_); //We assume the ERC721 will revert if any issue
    }


        /// @dev Transfers ERC20 tokens from the sender to the receiver.
        /// @param sender_ The address of the sender.
        /// @param receiver_ The address of the receiver.
        /// @param amount_ The amount of ERC20 tokens to transfer.
    function tokenTransferFrom(address sender_, address receiver_, uint256 amount_) private {
        bool success = ITOKEN.transferFrom(sender_, receiver_, amount_); //Attempt the transfer.
        if (!success) {
            revert("tokenTransferFrom failed"); 
        }
    }


        /// @dev Transfers ERC20 tokens from the contract to the receiver.
        /// @param receiver_ The address of the receiver.
        /// @param amount_ The amount of ERC20 tokens to transfer.
    function tokenTransfer(address receiver_, uint256 amount_) private {
        bool success = ITOKEN.transfer(receiver_, amount_); //Attempt the transfer.
        if (!success) {
            revert("tokenTransferFrom failed"); 
        }
    }



}




   //Launch instructions for new LP of existing ERC721:

//Launch the ERC20 token first so we have it's address, then input that address to launch this contract (or change to immutable and set in constructor with interfaces).
//(For us here it's 420 NFT supply at 1 Million tokens each so we will mint 420MILLION total supply of the ERC20 token).

//Transfer all ERC20 token supply to this contract via the ERC20 contract's functions directly. 
//(Transfer should be untaxed when seeded, or add logic above to check if not enough ERC20/ERC721 in contract to swap with)
//(Do not use this contract's depositERC20 function to seed the initial ERC20 tokens).
//(The token holder will need to have the unrestricted ability to transfer all the ERC20 tokens to this contract before the IDO launch.)

//Next, deposit NFTS by calling this contract's depositERC721Array() to withdraw ERC20 tokens. Repeat until you have enough ERC20 tokens to LP with.
//(Do not send ERC721 NFTs directly to this address via the ERC721 contract's transferFrom function.)
//(This JOINT404 contract will need to have the unrestricted ability to transfer all the ERC20 tokens to at least the LP seeder before the IDO launch.)

//Pair the ERC20 tokens withdrawn with AVAX on a DEX, presumably at the same value as their recently minted price.
//(The LP seeder will need to have the unrestricted ability to transfer all the ERC20 tokens to the DEX LP contract before the IDO launch.)

//Release DAPP for this contract.
//Launch the ERC20 IDO.

//*If pre-IDO transfer restrictions, they should be removed for this contract, the ERC20 token supply minter, and LP seeder.
//*If no ERC20 taxes for this contract, set TOKEN_TAX_BPS to 0 or just remove the whole tax accounting logic to save gas. 
//*If taxes can change then update logic here to read the taxes directy from the ERC20 contract.
//*Dapp can pre-validate the user's balances (account for extra taxes it adds on) and approvals.

//*To "burn" excess NFT mint supply but keep all the NFT IDs in circulation, we call depositERC721Array() here and then transfer the received ERC20 tokens to 0xdEaD. 
//(Only works for FIFO array method here or a random shuffle version, would not work for a FILO version of this contract)

////*This is not secure randomness, since validators can hack it.