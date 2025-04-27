// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AccessControl.sol";
// Import Hardhat's console library
import "hardhat/console.sol";

contract KYCManager is AccessControl {
    mapping(address => bool) public isKYCApproved;
    
    event KYCApproved(address user);
    event KYCRevoked(address user);  // Add new event

    modifier onlyKYCApproved() {
        require(isKYCApproved[msg.sender], "KYC not approved");
        _;
    }

    function approveKYC(address user) external onlyAdmin {
        isKYCApproved[user] = true;
        kycRequested[user] = false; // <-- Add this line
        emit KYCApproved(user);
    }

    function revokeKYC(address user) external onlyAdmin {
        isKYCApproved[user] = false;
        // Optionally, also set kycRequested[user] = false if you want to clear pending status
        // kycRequested[user] = false;
        emit KYCRevoked(user);
    }

    mapping(address => string) public userNames;
    mapping(address => string) public userEmails;

    event UserRegistered(address indexed user, string name, string email);

    address[] public allUsers;

    function registerUser(address user, string memory name, string memory email) external onlyAdmin {
        require(bytes(userNames[user]).length == 0, "User already registered");
        userNames[user] = name;
        userEmails[user] = email;
        allUsers.push(user);
        emit UserRegistered(user, name, email);
        // Debugging log
        console.log("User registered:", user, name, email);
    }

    function getAllApprovedUsers() external view returns (address[] memory) {
        uint count = 0;
        for (uint i = 0; i < allUsers.length; i++) {
            if (isKYCApproved[allUsers[i]]) {
                count++;
            }
        }
        address[] memory approved = new address[](count);
        uint idx = 0;
        for (uint i = 0; i < allUsers.length; i++) {
            if (isKYCApproved[allUsers[i]]) {
                approved[idx++] = allUsers[i];
            }
        }
        return approved;
    }

    function getAllPendingUsers() external view returns (address[] memory) {
        uint count = 0;
        for (uint i = 0; i < allUsers.length; i++) {
            if (kycRequested[allUsers[i]]) {
                count++;
            }
        }
        address[] memory pending = new address[](count);
        uint idx = 0;
        for (uint i = 0; i < allUsers.length; i++) {
            if (kycRequested[allUsers[i]]) {
                pending[idx++] = allUsers[i];
            }
        }
        return pending;
    }

    // Get User KYC Info
    function getUserInfo(address user) external view returns (
        string memory name, 
        string memory email, 
        bool kycApproved
    ) {
        return (userNames[user], userEmails[user], isKYCApproved[user]);
    }

    // Add this mapping to hold KYC request status
    mapping(address => bool) public kycRequested;

    // Called by user to request KYC
    function requestKYC() public {
        require(bytes(userNames[msg.sender]).length > 0, "User not registered");
        require(!isKYCApproved[msg.sender], "KYC already approved");
        kycRequested[msg.sender] = true;
    }

    // Utility getter (optional)
    function isKYCRequested(address user) public view returns (bool) {
        return kycRequested[user];
    }
}