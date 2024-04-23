//JOINT404-FIFO converts a user's specific NFTs to ERC20 tokens, with a FIFO array method for converting back to ERC721.
//Created by @0xJelle for @ChiknOGMeme to wrap $WEED.


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


contract JOINT404 is ReentrancyGuard{
    address constant ERC721_ADDRESS = 0x43D218197E8c5FBC0527769821503660861c7045; //NFT address.
    address constant ERC20_ADDRESS = 0x7C4e30a43ecC4d3231b5B07ed082329020D141F3; //Token address.

    uint256 constant TOKENS_PER_NFT_GWEI = 1000000 ether; //1 Million whole tokens per NFT.
    uint256 constant TOTAL_SUPPLY = 420; //NFT total supply.
    uint256 constant MAX_NFT_TRANSFERS = 200; //Max per transaction to prevent out of gas errors.

    IERC20 constant ITOKEN = IERC20(ERC20_ADDRESS); //ERC20 token contract interface.
    IERC721 constant INFT = IERC721(ERC721_ADDRESS); //ERC721 NFT contract interface. 

    
    uint256 public depositIndex; //Index to track where to overwrite in the array for FIFO when depositing NFTs.
    uint256 public withdrawIndex; //Index to track where to read from in the array for FIFO when withdrawing NFTs.
    uint16[TOTAL_SUPPLY] public nftArray; //Array of NFT IDs deposited into contract, can change uint16 size as needed.


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
        /// @param amount_ The amount of ERC20 tokens to deposit in GWEI.
    function depositERC20(uint256 amount_) public nonReentrant {
        require(amount_ > 0, "Amount must be greater than 0");
        require((amount_ % TOKENS_PER_NFT_GWEI) == 0, "Amount deposited must be in whole unit values of 1 Million tokens per NFT");
        uint256 nftAmount_ = amount_ / TOKENS_PER_NFT_GWEI; //Total number of NFTs to send to user immediately.
        require(nftAmount_ <= MAX_NFT_TRANSFERS, "Amount exceeds max NFT withdrawal limit of 200 NFTs per transaction");
        //require(nftAmount <= nftArray.length, "Not enough NFTs in the array to withdraw amount requested"); //If extra ERC20 circulating other than seeded into this contract.
        tokenTransferFrom(msg.sender, address(this), amount_);
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
        address msgSender_ = msg.sender;
        uint16[TOTAL_SUPPLY] storage nftArray_ = nftArray; // Storage pointer to save gas on the multiple writes in the following loop.

        for (uint256 i = 0; i < length_; ++i) {
            nftTransferFrom(msgSender_, addressThis_, idArray_[i]);
            nftArray_[depositIndex_] = idArray_[i];
            ++depositIndex_;
            if (depositIndex_ == TOTAL_SUPPLY) { //Reset index to start if it reaches the end of the array.
                depositIndex_ = 0;
            }
        }

        depositIndex = depositIndex_;
        uint256 amount_ = length_ * TOKENS_PER_NFT_GWEI; //Total number of tokens in GWEI to send to user immediately.
        tokenTransfer(msg.sender, amount_);
        emit NFTsDeposited(msg.sender, idArray_);
    }


    //Private functions:

        /// @dev Withdraws ERC721 tokens from the contract to the user in FIFO order.
        /// @param nftsOwed_ The number of NFTs owed to the user.
    function withdrawNFTs(uint256 nftsOwed_) private {
        uint256 withdrawIndex_ = withdrawIndex;
        address msgSender_ = msg.sender;
        uint16[TOTAL_SUPPLY] storage nftArray_ = nftArray; //Storage pointer to save gas on the multiple reads in the following loop.

        for (uint256 i = 0; i < nftsOwed_; ++i) {
            nftTransferFrom(address(this), msgSender_, nftArray_[withdrawIndex_]);
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
    function nftTransferFrom(address sender_, address receiver_, uint256 tokenId_) private {
        try INFT.transferFrom(sender_, receiver_, tokenId_) {
            // Successful transfer
        } catch Error(string memory errorCode_) {
            // Handle error: failed transfer with a known reason
            revert(string(abi.encodePacked(
                "Sender: ", sender_, " Receiver: ", receiver_, " TokenID: ", tokenId_,
                " ERC721 NFT transferFrom unsuccessful: ", errorCode_)));
        } catch Panic(uint panicCode_) {
            // Handle panic error: possible out-of-gas or other low-level error with an error code
            revert(string(abi.encodePacked(
                "Sender: ", sender_, " Receiver: ", receiver_, " TokenID: ", tokenId_,
                " ERC721 NFT transferFrom failed with panic error code: ", panicCode_)));
        } catch (bytes memory lowLevelData_) {
            // Handle panic error: possible out-of-gas or other low-level error without error code
            string memory errorMessage_ = cleanBytesToString(lowLevelData_);
            revert(string(abi.encodePacked(
                "Sender: ", sender_, " Receiver: ", receiver_, " TokenID: ", tokenId_,
                " ERC721 NFT transferFrom failed with bytes error: ", errorMessage_)));
        }
    }


    /// @dev Transfers ERC20 tokens from the sender to the receiver.
    /// @param sender_ The address of the sender.
    /// @param receiver_ The address of the receiver.
    /// @param amount_ The amount of ERC20 tokens to transfer.
    function tokenTransferFrom(address sender_, address receiver_, uint256 amount_) private {
        try ITOKEN.transferFrom(sender_, receiver_, amount_) {
            // Successful transfer
        } catch Error(string memory errorCode_) {
            // Handle error: failed transfer with a known reason
            revert(string(abi.encodePacked(
                "Sender: ", sender_, " Receiver: ", receiver_, " Amount: ", amount_,
                " ERC20 token transferFrom unsuccessful: ", errorCode_)));
        } catch Panic(uint panicCode_) {
            // Handle panic error: possible out-of-gas or other low-level error with an error code
            revert(string(abi.encodePacked(
                "Sender: ", sender_, " Receiver: ", receiver_, " Amount: ", amount_,
                " ERC20 token transferFrom failed with panic error code: ", panicCode_)));
        } catch (bytes memory lowLevelData_) {
            // Handle panic error: possible out-of-gas or other low-level error without error code
            string memory errorMessage_ = cleanBytesToString(lowLevelData_);
            revert(string(abi.encodePacked(
                "Sender: ", sender_, " Receiver: ", receiver_, " Amount: ", amount_,
                " ERC20 token transferFrom failed with bytes error: ", errorMessage_)));
        }
    }


    /// @dev Transfers ERC20 tokens from the contract to the receiver.
    /// @param receiver_ The address of the receiver.
    /// @param amount_ The amount of ERC20 tokens to transfer.
    function tokenTransfer(address receiver_, uint256 amount_) private {
        try ITOKEN.transfer(receiver_, amount_) {
            // Successful transfer
        } catch Error(string memory errorCode_) {
            // Handle error: failed transfer with a known reason
            revert(string(abi.encodePacked(
                "Receiver: ", receiver_, " Amount: ", amount_,
                " ERC20 token transfer unsuccessful: ", errorCode_)));
        } catch Panic(uint panicCode_) {
            // Handle panic error: possible out-of-gas or other low-level error with an error code
            revert(string(abi.encodePacked(
                "Receiver: ", receiver_, " Amount: ", amount_,
                " ERC20 token transfer failed with panic error code: ", panicCode_)));
        } catch (bytes memory lowLevelData_) {
            // Handle panic error: possible out-of-gas or other low-level error without error code
            string memory errorMessage_ = cleanBytesToString(lowLevelData_);
            revert(string(abi.encodePacked(
                "Receiver: ", receiver_, " Amount: ", amount_,
                " ERC20 token transfer failed with bytes error: ", errorMessage_)));
        }
    }


        /// @dev Remove non-string characters to convert bytes to string
        /// @param data_ The bytes message to clean.
    function cleanBytesToString(bytes memory data_) internal pure returns (string memory) {
        uint256 length_ = data_.length;
        bytes memory validChars_ = new bytes(length_);
        for (uint256 i = 0; i < length_; i++) {
            // Check if the byte is within the valid ASCII range
            if (uint8(data_[i]) >= 32 && uint8(data_[i]) <= 126) {
                validChars_[i] = data_[i];
            } else {
                // Replace invalid characters with a placeholder
                validChars_[i] = '.';
            }
        }
        return string(validChars_);
    }



}




   //Launch instructions for new LP of existing ERC721:

//Launch the ERC20 token first so we have it's address, then input that address to launch this contract (or change to immutable and set in constructor with interfaces).
//(For us here it's 420 NFT supply at 1 Million tokens each so we will mint 420MILLION total supply of the ERC20 token).

//Transfer all ERC20 token supply to this contract via the ERC20 contract transferFrom function directly. 
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
//*If token taxes, they must be removed for transfers involving this contract, 
//(Alternatively, account for taxes in logic above, by adding tax amount on to transfer from user but not to user. Could even add taxes just in this contract's logic as a shuffle fee.
//*Dapp can pre-validate the user's balances and approvals.

//*To "burn" excess NFT mint supply but keep all the NFT IDs in circulation, we call depositERC721Array() here and then transfer the received ERC20 tokens to 0xdEaD. 
//(Only works for FIFO array method here or a random shuffle version, would not work for a FILO version of this contract)