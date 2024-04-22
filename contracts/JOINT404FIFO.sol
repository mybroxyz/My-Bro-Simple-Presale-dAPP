//JOINT404-FIFO converts a user's specific NFTs to ERC20 tokens, with a FIFO array method for converting back to ERC721.
//Written by @0xJelle for @ChiknOGMeme to wrap their $WEED NFT with 404 functionality.

//Import file: utils/ReentrancyGuard.sol

// License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/ReentrancyGuard.sol)

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

contract JOINT404 is ReentrancyGuard {

    address constant ERC20_ADDRESS = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7; //token address
    address constant ERC721_ADDRESS = 0xb92A5f94466305659976e95c98131B86D8982375; //NFT address

    uint constant TOTAL_SUPPLY = 420; //NFT total supply
    uint constant TOKENS_PER_NFT_GWEI = 1000000000000000000000000; //A million tokens in GWEI per NFT
    uint constant MAX_NFT_WITHDRAWAL = 10; //Max per transaction


    IERC20 token = IERC20(ERC20_ADDRESS); //ERC20 token contract interface
    IERC721 nft = IERC721(ERC721_ADDRESS); //ERC721 NFT contract interface

    uint[] public nftArray; //Array of NFTs deposited into contract

    event TokensDeposited(address indexed user, uint amount);
    event NFTsDeposited(address indexed user, uint[] tokenIds);


    /// @dev Deposits ERC20 tokens into the contract and adds to nftsOwed mapping for the user.
    /// @param amount_ The amount of ERC20 tokens to deposit in GWEI.
    function depositERC20(uint amount_) public nonReentrant {
        require((amount_ % TOKENS_PER_NFT_GWEI) == 0, "Amount must be in whole unit values");
        uint nftAmount_ = amount_ / TOKENS_PER_NFT_GWEI; //Total number of NFTs to send to user immediately
        require(nftAmount_ <= MAX_NFT_WITHDRAWAL, "Amount exceeds max NFT withdrawal limit");
        require(nftsOwed_ > 0, "Amount must be greater than 0");
        tokenTransfer(msg.sender, address(this), amount_);
        recentRequestBlock[msg.sender] = block.number + 3;
        nftsOwed[msg.sender] += nftAmount_;
        emit TokensDeposited(msg.sender, amount_);
    }


    /// @dev Withdraws owed ERC721 tokens from the contract to the user.
    function withdrawNFTs() public nonReentrant {
        address msgSender_ = msg.sender;
        uint nftsOwed_ = nftsOwed[msgSender_];
        require(block.number >= recentRequestBlock[msgSender_], "User is too early, must wait 3 blocks from deposit");

        uint counter_ = nftsOwed_;
        if (nftsOwed_ > MAX_NFT_WITHDRAWAL) {
            counter_ = MAX_NFT_WITHDRAWAL;
        }
        nftsOwed[msgSender_] -= counter_;

        for (uint i = 0; i < counter_; i++) {
            uint pickedIndex_ = ((uint(keccak256(abi.encodePacked(block.prevrandao(recentRequestBlock[msg.sender]), i, uint(msg.sender), msg.nonce))) % nftArray.length) - 1;
            uint tokenId_ = nftArray[pickedIndex_];

            nftTransfer(address(this), msg.sender, tokenId_);
        }

        emit NFTsWithdrawn(msgSender_, counter_);
    }

    /// @dev Deposits an array of ERC721 tokens into the contract and instantly sends ERC20s to the user in exchange.
    /// @param idArray_ The array of ERC721 token IDs to deposit.
    function depositERC721ArrayAndWithdrawERC20(uint[] memory idArray_) public nonReentrant {
        uint length_ = idArray_.length;
        require(length_ > 0, "ID Array must not be empty");

        for (uint i = 0; i < length_; i++) {
            nftTransfer(msg.sender, address(this), idArray_[i]);
            nftArray.push(idArray_[i]);
        }

        emit NFTsDeposited(msg.sender, idArray_);
    }

    function tokenTransfer(address sender_, address receiver_, uint amount_) private returns (bool) {
        return token.transferFrom(sender_, receiver_, amount_);
    }

    function nftTransfer(address sender_, address receiver_, uint tokenId_) private {
        nft.transferFrom(sender_, receiver_, tokenId_);
    }

    fallback() payable nonReentrant {
        uint amountSentGwei_ = msg.value;
        require(amountSentGwei_ <= GWEI_MAX + 1, "Wrong amount of coded gwei sent");
        if (amountSentGwei_ >= SIGNIFIER_DIGIT) {
            uint[] memory arrayID;
            arrayID.push(amountSentGwei_ - SIGNIFIER_DIGIT);
            depositERC721ArrayAndWithdrawERC20(arrayID_);
        } else if (amountSentGwei_ == TOTAL_SUPPLY + 1) {
            withdrawNFTs();
        } else if (amountSentGwei_ <= TOTAL_SUPPLY) {
            tokenTransfer(msg.sender, address(this), amountSentGwei_);
        }
    } 

    /// @notice To use this fallback function, the user must first have approved this contract to spend their tokens.
    /// @notice Users who want to buy NFTs from the wrapper can send in GWEI avax to the JOINT404 address equal to the number of NFTs they wish to purchase.
    /// @notice It will deduct the amount of ERC20 from them to pay for it.
    /// @notice Then they must send the total collection size plus 1 to withdraw the NFTs.
    /// @notice To sell, they send the amount put a 1 before the NFT ID they wish to sell into tokens, which will get sent to them instantly.
}

