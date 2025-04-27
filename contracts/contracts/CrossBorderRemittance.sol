// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TransactionManager.sol";
import "./KYCManager.sol";

contract CrossBorderRemittance is TransactionManager {

    function getTransaction(string memory _txID) public view override returns (
        address sender,
        address receiver,
        uint256 amount,
        uint256 timestamp,
        string memory currency,
        bool isDisputed
    ) {
        Remittance memory txn = transactions[_txID];
        require(txn.timestamp != 0, "Transaction not found");
        return (
            txn.sender,
            txn.receiver,
            txn.amount,
            txn.timestamp,
            txn.currency,
            txn.isDisputed
        );
    }
}
