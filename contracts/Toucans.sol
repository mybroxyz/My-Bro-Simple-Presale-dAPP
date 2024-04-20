//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./ARC404.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {IERC165, ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

contract Toucans is ARC404, ERC165 {
    /**
     * @dev This contract represents a collection of Toucans NFTs.
     */
    string public baseTokenURI;

    /**
     * @dev The maximum number of Toucans that can be minted.
     */
    uint256 public maxMintable;

    /**
     * @dev The maximum number of Toucans that can be minted per transaction.
     */
    uint256 public maxMintPerTx;

    /**
     * @dev The price of each Toucan.
     */
    uint256 public price;

    /**
     * @dev The address that will receive royalties from the sales.
     * This address will be used as a splitter contract for royalties.
     */
    address public royaltyRecipient;

    /**
     * @dev A mapping to keep track of the remaining mints for each phase and address.
     */
    mapping(uint256 => mapping(address => uint256)) public phaseMintsRemaining;

    /**
     * @dev The total number of phases for the Toucans sale.
     */
    uint256 public phases;

    /**
     * @dev The duration of each phase in seconds.
     */
    uint256 public phaseDuration;

    /**
     * @dev The ERC2981 interface ID for royalty support.
     */
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    /**
     * @dev A flag to indicate if minting is active.
     */
    bool private _mintActive;

    /**
     * @dev The start time of the Toucans sale.
     */
    uint256 public startTime;

    /**
     * @dev The start time of the liquidity pool (LP) creation.
     */
    uint256 public lpStartTime;

    /**
     * @dev The number of Toucans to be minted for the LP.
     */
    uint256 private constant MINT_FOR_LP = 2400;

    /**
     * @dev The number of Toucans to be minted for the public sale.
     */
    uint256 private constant MINT_FOR_PUBLIC = 2600;

    /**
     * @dev The maximum number of Toucans that can be minted in phase 1.
     */
    uint256 public constant MAX_MINT_PHASE1 = 225;

    /**
     * @dev The maximum number of Toucans that can be minted in phase 2.
     */
    uint256 public constant MAX_MINT_PHASE2 = MAX_MINT_PHASE1 + 500;

    /**
     * @dev The maximum number of Toucans that can be minted in phase 3.
     */
    uint256 public constant MAX_MINT_PHASE3 = MAX_MINT_PHASE2 + 900;

    /**
     * @dev The royalty amount in basis points (equivalent to a 6% royalty fee).
     */
    uint256 public constant ROYALTY_AMOUNT = 600;

    error MintTooMany();
    error MintNotActive();
    error MintingComplete();
    error NotEnoughAvax();
    error InvalidAddress();
    error NotYetPublic();
    error TradingNotLive();
    error MaxMintedForPhase();

    /**
     * @dev Initializes the Toucans contract with the specified parameters.
     * @param _owner The address of the contract owner.
     * @param _startTime The start time of the contract.
     * @param _royaltyRecipient The address of the royalty recipient.
     */
    constructor(
        address _owner,
        uint256 _startTime,
        address _royaltyRecipient
    ) ARC404("TOUCANS", "CAN", 18, 5000, _owner) {
        // Initialize the balance of the owner with MINT_FOR_LP * (1 ether) Toucans
        balanceOf[_owner] = MINT_FOR_LP * (1 ether);

        // Set the owner address in the whitelist
        whitelist[_owner] = true;

        // Set the price to 1 ether
        price = 1 ether;

        // Set the maximum number of mintable Toucans for the public
        maxMintable = MINT_FOR_PUBLIC;

        // Disable minting
        _mintActive = false;

        // Set the maximum number of mintable Toucans per transaction to 1
        maxMintPerTx = 1;

        // Set the start time of the contract
        startTime = _startTime;

        // Set the royalty recipient address
        royaltyRecipient = _royaltyRecipient;

        // Set the base token URI for metadata
        baseTokenURI = "ipfs://bafybeihcdsn3dd5uelbltdtsfuylopo4hmbkrsdsegnbcjpah7dwcvb74y/";

        // Set the duration of each phase to 15 minutes
        phaseDuration = 900;

        // Set the number of phases to 3
        phases = 3;
    }

    /**
     * @dev Returns the URI for a given token ID.
     * @param id The ID of the token.
     * @return A string representing the URI.
     */
    function tokenURI(uint256 id) public view override returns (string memory) {
        return string.concat(baseTokenURI, Strings.toString(id));
    }

    /**
     * @dev Checks if an account has access to a specific phase.
     * @param phase The phase number to check access for.
     * @param account The address of the account to check access for.
     * @return A boolean indicating whether the account has access to the phase or not.
     */
    function hasPhaseAccess(
        uint256 phase,
        address account
    ) public view returns (bool) {
        return phaseMintsRemaining[phase][account] > 0;
    }

    /**
     * @dev Checks if the specified account can mint the given quantity of tokens in the specified phase.
     * @param phase The phase number.
     * @param account The address of the account to check.
     * @param quantity The quantity of tokens to mint.
     * @return A boolean indicating whether the account can mint the specified quantity of tokens in the specified phase.
     */
    function canMintAmountInPhase(
        uint256 phase,
        address account,
        uint256 quantity
    ) public view returns (bool) {
        return phaseMintsRemaining[phase][account] >= quantity;
    }

    /**
     * @dev Returns the current active phase.
     * @return The current active phase as a uint256 value.
     */
    function activePhase() public view returns (uint256) {
        if (!mintHasStarted()) {
            return 0;
        } else {
            uint256 secondsPastStart = block.timestamp - startTime;
            uint256 phase = (secondsPastStart / phaseDuration) + 1;

            if (phase > phases) {
                return phases + 1; // +1 for public
            } else {
                return phase;
            }
        }
    }

    /**
     * @dev Checks if the minting process has started.
     * @return A boolean value indicating whether the minting process has started or not.
     */
    function mintHasStarted() public view returns (bool) {
        return block.timestamp >= startTime;
    }

    /**
     * @dev Returns the number of seconds until the start of the event.
     * @return The number of seconds until the start of the event.
     */
    function secondsUntilStart() public view returns (uint256) {
        if (!mintHasStarted()) {
            return startTime - block.timestamp;
        } else {
            return 0;
        }
    }

    /**
     * @dev Returns a boolean value indicating whether the minting is active or not.
     * @return A boolean value indicating the minting status.
     */
    function mintActive() public view returns (bool) {
        return _mintActive || (block.timestamp >= startTime); // use timer w/ability to override
    }

    /**
     * @dev Mints a specified quantity of tokens.
     * @param quantity The number of tokens to mint.
     */
    function mint(uint256 quantity) public payable {
        if (!mintActive()) revert MintNotActive();

        if (quantity > maxMintPerTx) revert MintTooMany();
        if (minted + quantity > maxMintable) revert MintingComplete();

        uint256 currentPhase = activePhase();

        // If this is phase 1 of mint then the price is only 0.5 Avax
        if (currentPhase == 1) {
            if (msg.value < (quantity * (price / 2))) {
                revert NotEnoughAvax();
            }
        } else if (msg.value < (quantity * price)) {
            revert NotEnoughAvax();
        }

        // Restrict total minted per phase
        if (currentPhase == 1 && quantity + minted > MAX_MINT_PHASE1) {
            revert MaxMintedForPhase();
        } else if (currentPhase == 2 && quantity + minted > MAX_MINT_PHASE2) {
            revert MaxMintedForPhase();
        } else if (currentPhase == 3 && quantity + minted > MAX_MINT_PHASE3) {
            revert MaxMintedForPhase();
        }

        // Check if msg.sender is in whitelist and has access to the phase
        for (uint256 phase = 1; phase <= phases; phase++) {
            if (currentPhase == phase) {
                require(
                    canMintAmountInPhase(phase, msg.sender, quantity),
                    string.concat(
                        "Currently in phase ",
                        Strings.toString(phase),
                        "."
                    )
                );
                phaseMintsRemaining[phase][msg.sender] -= quantity;
            }
        }

        if (msg.value > 0) {
            payable(owner).transfer(msg.value);
        }

        _mint(msg.sender, quantity);

        if (minted == maxMintable) lpStartTime = block.timestamp;
    }

    // ROYALTIES

    /**
     * @dev Retrieves the royalty information for a given token and sale price.
     * @param _tokenId The ID of the token.
     * @param _salePrice The sale price of the token.
     * @return receiver The address of the royalty receiver.
     * @return amount The amount of royalty to be paid.
     */
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) external view returns (address receiver, uint256 amount) {
        return (royaltyRecipient, ((_salePrice * ROYALTY_AMOUNT) / 10000));
    }

    /**
     * @dev Checks if a contract supports a specific interface.
     * @param interfaceId The interface identifier.
     * @return A boolean value indicating whether the contract supports the interface.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == _INTERFACE_ID_ERC2981 ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Hook that is called before any token transfer.
     * It includes the address from which the tokens are transferred, the address to which the tokens are transferred, and the amount of tokens being transferred.
     * This function can be overridden to control the token transfer behavior.
     * @param from The address from which the tokens are transferred.
     * @param to The address to which the tokens are transferred.
     * @param amount The amount of tokens being transferred.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        // If there are still mints available
        if (minted < maxMintable) {
            bool allowTransfer = (from == owner || to == owner);

            if (!allowTransfer) revert NotYetPublic();

            return;
        } else if (block.timestamp < (lpStartTime + 180)) {
            // 3 minutes of anti-whale when trading goes live
            require(
                balanceOf[to] <= ((5 * totalSupply) / 1000),
                "No more than 0.5% at this stage."
            );

            return;
        }
    }

    // admin
    /**
     * @dev Grants access to a specific phase for a given set of accounts.
     * @param phase The phase for which access is being granted.
     * @param accounts The list of accounts to grant access to.
     * @param quantity The quantity of access to grant to each account.
     * Requirements:
     * - Only the contract owner can call this function.
     */
    function grantPhaseAccess(
        uint256 phase,
        address[] memory accounts,
        uint256 quantity
    ) public onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            phaseMintsRemaining[phase][accounts[i]] += quantity;
        }
    }

    /**
     * @dev Sets the mint active status.
     * @param mintActive_ The new mint active status.
     * Requirements:
     * - The caller must be the contract owner.
     */
    function setMintActive(bool mintActive_) public onlyOwner {
        _mintActive = mintActive_;
    }

    /**
     * @dev Sets the royalty recipient address.
     * @param _recipient The new royalty recipient address.
     * Requirements:
     * - The caller must be the contract owner.
     */
    function setRoyaltyRecipient(address _recipient) public onlyOwner {
        royaltyRecipient = _recipient;
    }

    /**
     * @dev Sets the base token URI.
     * @param _baseURI The new base token URI.
     * Requirements:
     * - The caller must be the contract owner.
     */
    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseTokenURI = _baseURI;
    }
}
