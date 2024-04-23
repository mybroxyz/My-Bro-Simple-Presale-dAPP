// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleTax is ERC20 {

    address public immutable fundAddress;
    uint256 constant Tax_BPS = 100; // 1% tax in Basis Points is 100 bps
    bool public seeded;

    constructor(address fundAddress_) ERC20("SimpleTax", "STX") {
        fundAddress = fundAddress_;
    }

    function _update(
        address sender_,
        address recipient_,
        uint256 amount_
    ) internal virtual override {
        uint256 tax_ = (amount_ * Tax_BPS) / 10000; //10000 BPS is 100%

        super._update(sender_, recipient_, amount_ - tax_);
        super._update(sender_, fundAddress, tax_);
    }

    function seedJoint404NoTaxes(address joint404Address_) public { //Mint supply to Joint404 contract for seeding conversions
        require(!seeded, "Already seeded");
        super._update(address(0), joint404Address_, 420000000 * 10 ** decimals());
        seeded = true;
    }
}