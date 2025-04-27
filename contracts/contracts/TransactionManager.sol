// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./KYCManager.sol";

contract TransactionManager is KYCManager {
    struct Remittance {
        address sender;
        address receiver;
        uint256 amount;
        uint256 timestamp;
        string currency;
        bool isDisputed;
    }

    mapping(string => Remittance) public transactions;

    event Sent(string txID, address indexed sender, address indexed receiver, uint256 amount, string currency, uint256 timestamp);

    function sendRemittance(address payable receiver, string memory txID, string memory currency) external payable onlyKYCApproved virtual {
        require(transactions[txID].sender == address(0), "Transaction ID already exists");
                receiver.transfer(msg.value);
        transactions[txID] = Remittance(msg.sender, receiver, msg.value, block.timestamp, currency, false);
        emit Sent(txID, msg.sender, receiver, msg.value, currency, block.timestamp);
    }

    function getTransaction(string memory txID) external view virtual returns (address sender, address receiver, uint256 amount, uint256 timestamp, string memory currency, bool isDisputed) {
        Remittance memory remittance = transactions[txID];
        return (remittance.sender, remittance.receiver, remittance.amount, remittance.timestamp, remittance.currency, remittance.isDisputed);
    }

}