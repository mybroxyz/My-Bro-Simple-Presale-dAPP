//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./ERC721Receiver.sol";

// "Avalanche is Really Cool"
abstract contract ARC404 is Ownable {
    // Events
    event ERC20Transfer(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 amount
    );

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed id
    );

    event ERC721Approval(
        address indexed owner,
        address indexed spender,
        uint256 indexed id
    );

    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    // Errors
    error NotFound();
    error AlreadyExists();
    error InvalidRecipient();
    error InvalidSender();
    error UnsafeRecipient();

    // Metadata
    /// @dev Token name
    string public name;

    /// @dev Token symbol
    string public symbol;

    /// @dev Decimals for fractional representation
    uint8 public immutable decimals;

    /// @dev Total supply in fractionalized representation
    uint256 public immutable totalSupply;

    /// @dev Total supply in NFT representation
    uint256 public immutable totalNativeSupply;

    /// @dev Current mint counter, monotonically increasing to ensure accurate ownership
    uint256 public minted;

    // Mappings
    /// @dev Balance of user in fractional representation
    mapping(address => uint256) public balanceOf;

    /// @dev Allowance of user in fractional representation
    mapping(address => mapping(address => uint256)) public allowance;

    /// @dev Approval in native representaion
    mapping(uint256 => address) public getApproved;

    /// @dev Approval for all in native representation
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    /// @dev Owner of id in native representation
    mapping(uint256 => address) internal _ownerOf;

    /// @dev Array of owned ids in native representation
    mapping(address => uint256[]) internal _owned;
    mapping(address => uint256[]) internal _contractOwned;

    /// @dev Tracks indices for the _owned mapping
    mapping(uint256 => uint256) internal _ownedIndex;

    /// @dev Addresses whitelisted from minting / burning for gas savings (pairs, routers, etc)
    mapping(address => bool) public whitelist;

    /// @dev Holds the IDs of NFTs that have been burned so that they can be re-used
    uint256[] public availableIds;

    // Constructor
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalNativeSupply,
        address _owner
    ) Ownable(_owner) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalNativeSupply = _totalNativeSupply;
        totalSupply = _totalNativeSupply * (10 ** decimals);
    }

    /// @notice Initialization function to set pairs / etc
    ///         saving gas by avoiding mint / burn on unnecessary targets
    function setWhitelist(address target, bool state) public onlyOwner {
        whitelist[target] = state;
    }

    /// @notice Function to find owner of a given native token
    function ownerOf(uint256 id) public view virtual returns (address owner) {
        owner = _ownerOf[id];

        if (owner == address(0)) {
            revert NotFound();
        }
    }

    function totalAvailableIds() public view returns (uint256) {
        return availableIds.length;
    }

    function totalNFTsOwned(address owner) public view returns (uint256) {
        return _owned[owner].length;
    }

    /// @notice tokenURI must be implemented by child contract
    function tokenURI(uint256 id) public view virtual returns (string memory);

    /// @notice Function for token approvals
    /// @dev This function assumes id / native if amount less than or equal to current max id
    function approve(
        address spender,
        uint256 amountOrId
    ) public virtual returns (bool) {
        if (amountOrId <= minted && amountOrId > 0) {
            address owner = _ownerOf[amountOrId];

            if (msg.sender != owner && !isApprovedForAll[owner][msg.sender]) {
                revert Unauthorized();
            }

            getApproved[amountOrId] = spender;

            emit Approval(owner, spender, amountOrId);
        } else {
            allowance[msg.sender][spender] = amountOrId;

            emit Approval(msg.sender, spender, amountOrId);
        }

        return true;
    }

    /// @notice Function native approvals
    function setApprovalForAll(address operator, bool approved) public virtual {
        isApprovedForAll[msg.sender][operator] = approved;

        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /// @notice Function for mixed transfers
    /// @dev This function assumes id / native if amount less than or equal to current max id
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool) {
        uint256 allowed = allowance[from][msg.sender];

        require(allowed >= amount, "Not enough allowance.");

        if (allowed != type(uint256).max)
            allowance[from][msg.sender] = allowed - amount;

        _transfer(from, to, amount);
        return true;
    }

    /// @notice Function for fractional transfers
    function transfer(
        address to,
        uint256 amount
    ) public virtual returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    /// @notice Function for native transfers with contract support
    function safeTransferFrom(
        address from,
        address to,
        uint256 id
    ) public virtual {
        _nftTransferFrom(msg.sender, from, to, id);

        if (
            to.code.length != 0 &&
            ERC721Receiver(to).onERC721Received(msg.sender, from, id, "") !=
            ERC721Receiver.onERC721Received.selector
        ) {
            revert UnsafeRecipient();
        }
    }

    /// @notice Function for native transfers with contract support and callback data
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes calldata data
    ) public virtual {
        _nftTransferFrom(msg.sender, from, to, id);

        if (
            to.code.length != 0 &&
            ERC721Receiver(to).onERC721Received(msg.sender, from, id, data) !=
            ERC721Receiver.onERC721Received.selector
        ) {
            revert UnsafeRecipient();
        }
    }

    /// @notice Internal function for fractional transfers
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal returns (bool) {
        _beforeTokenTransfer(from, to, amount);

        uint256 unit = _getUnit();
        uint256 balanceBeforeSender = balanceOf[from];
        uint256 balanceBeforeReceiver = balanceOf[to];

        if (_isContract(from)) {
            uint256 tokenBalance = balanceBeforeSender -
                (_contractOwned[from].length * unit);
            require(tokenBalance >= amount, "Not enough token balance.");
        }

        balanceOf[from] -= amount;
        unchecked {
            balanceOf[to] += amount;
        }

        // Skip burn for certain addresses to save gas
        // Skip minting to smart contracts
        if (!_shouldSkip(from) || _owned[from].length > 0) {
            uint256 nftsToBurn = (balanceBeforeSender / unit) -
                (balanceOf[from] / unit);
            for (uint256 i = 0; i < nftsToBurn; i++) {
                _burnNFT(from);
            }
        }

        // Skip minting for certain addresses to save gas
        // Skip burning from smart contracts
        if (!_shouldSkip(to)) {
            uint256 nftsToMint = (balanceOf[to] / unit) -
                (balanceBeforeReceiver / unit);
            for (uint256 i = 0; i < nftsToMint; i++) {
                _mintNFT(to);
            }
        }

        emit ERC20Transfer(from, to, amount);
        return true;
    }

    function _mint(address recipient, uint256 quantity) internal {
        balanceOf[recipient] += quantity * _getUnit();

        for (uint256 index = 0; index < quantity; index++) {
            _mintNFT(recipient);
        }
    }

    function _nftTransferFrom(
        address msgSender,
        address from,
        address to,
        uint256 id
    ) internal {
        require(from == _ownerOf[id], "Sender is not owner of NFT.");
        require(to != address(0), "Cannot send to null address.");
        require(
            msgSender == from ||
                isApprovedForAll[from][msgSender] ||
                msgSender == getApproved[id],
            "Operator is not approved."
        );

        balanceOf[from] -= _getUnit();
        unchecked {
            balanceOf[to] += _getUnit();
        }

        _removeSpecificNFT(from, id);
        _deliverNFT(to, id);

        emit Transfer(from, to, id);
        emit ERC20Transfer(from, to, _getUnit());
    }

    // Internal utility logic
    function _getUnit() internal view returns (uint256) {
        return 10 ** decimals;
    }

    function _mintNFT(address to) internal virtual {
        if (to == address(0)) {
            revert InvalidRecipient();
        }

        uint256 id;

        if (availableIds.length == 0) {
            unchecked {
                minted++;
            }
            require(
                minted <= totalNativeSupply,
                "Cannot mint more than given supply."
            );
            id = minted;
        } else {
            id = availableIds[availableIds.length - 1];
            availableIds.pop();
        }

        if (_ownerOf[id] != address(0)) {
            revert AlreadyExists();
        }

        _deliverNFT(to, id);

        emit Transfer(address(0), to, id);
    }

    function _burnNFT(address from) internal virtual {
        if (from == address(0)) {
            revert InvalidSender();
        }

        // Indiscriminantly burn last NFT in list of owned NFTs for `from`
        uint256 id = _owned[from][_owned[from].length - 1];
        _owned[from].pop();
        delete _ownedIndex[id];
        delete _ownerOf[id];
        delete getApproved[id];

        availableIds.push(id);

        emit Transfer(from, address(0), id);
    }

    function _removeSpecificNFT(address from, uint256 id) private {
        uint256 lastId;
        if (_isContract(from)) {
            lastId = _contractOwned[from][_contractOwned[from].length - 1];
            _contractOwned[from][_ownedIndex[id]] = lastId;
            _contractOwned[from].pop();
        } else {
            lastId = _owned[from][_owned[from].length - 1];
            _owned[from][_ownedIndex[id]] = lastId;
            _owned[from].pop();
        }
        _ownedIndex[lastId] = _ownedIndex[id];
        delete getApproved[id];
    }

    function _deliverNFT(address to, uint256 id) private {
        _ownerOf[id] = to;
        if (_isContract(to)) {
            _contractOwned[to].push(id);
            _ownedIndex[id] = _contractOwned[to].length - 1;
        } else {
            _owned[to].push(id);
            _ownedIndex[id] = _owned[to].length - 1;
        }
    }

    function _setNameSymbol(
        string memory _name,
        string memory _symbol
    ) internal {
        name = _name;
        symbol = _symbol;
    }

    function _shouldSkip(address a) private view returns (bool) {
        return whitelist[a] || _isContract(a);
    }

    function _isContract(address a) private view returns (bool result) {
        assembly {
            result := extcodesize(a)
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}
}
