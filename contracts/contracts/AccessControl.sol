// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AccessControl {
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this");
        _;
    }
}