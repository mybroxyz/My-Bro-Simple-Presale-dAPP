// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721{

    uint256 constant TOTAL_SUPPLY = 420;

    constructor()
        ERC721("MyNFT", "MNFT")

    {        for(uint i; i < 420; i++){
            _safeMint(msg.sender, i);
        }
    }

    function _baseURI() internal pure override returns (string memory) {
        return "xxx";
    }

}
