// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RevenueSplitter {
    address[] public payees;
    uint256[] public shares; // must sum to 100

    event PaymentReceived(address indexed from, uint256 amount);
    event PaymentReleased(address indexed to, uint256 amount);

    constructor(address[] memory _payees, uint256[] memory _shares) {
        require(_payees.length > 0, "No payees");
        require(_payees.length == _shares.length, "Length mismatch");

        uint256 sum = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            require(_payees[i] != address(0), "Zero address");
            require(_shares[i] > 0, "Zero share");
            sum += _shares[i];
        }
        require(sum == 100, "Shares must sum to 100");

        payees = _payees;
        shares = _shares;
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    function release() external {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");

        for (uint256 i = 0; i < payees.length; i++) {
            uint256 amount = (balance * shares[i]) / 100;
            (bool ok, ) = payees[i].call{value: amount}("");
            require(ok, "Transfer failed");
            emit PaymentReleased(payees[i], amount);
        }
    }
}
