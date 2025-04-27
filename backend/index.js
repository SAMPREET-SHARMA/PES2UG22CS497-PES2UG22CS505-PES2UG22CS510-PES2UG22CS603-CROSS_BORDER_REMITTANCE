const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { ethers, JsonRpcProvider, Wallet, Contract } = require("ethers");

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("DB Connected"));
mongoose.set('useFindAndModify', false);

const UserSchema = new mongoose.Schema({
  address: String,
  name: String,
  email: String,
  kycApproved: { type: Boolean, default: false },
  kycRequested: { type: Boolean, default: false } // <-- keep this
});

const TxSchema = new mongoose.Schema({
  txID: String,
  sender: String,
  receiver: String,
  amount: Number,
  timestamp: Number,
  currency: String,
  isDisputed: Boolean
});

const User = mongoose.model('User', UserSchema);
const Tx = mongoose.model('Tx', TxSchema);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ABI = require("./CrossBorderRemittanceABI.json");
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PROVIDER_URL = process.env.PROVIDER_URL;

// Helper to get contract instance
function getContract() {
  const provider = new JsonRpcProvider(PROVIDER_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  return new Contract(CONTRACT_ADDRESS, ABI, wallet);
}

// Check if user exists in blockchain and database
app.post('/user/check', async (req, res) => {
  const { address } = req.body;
  try {
    const contract = getContract();
    // Use getUserInfo to check registration
    const [name, email, kycApproved] = await contract.getUserInfo(address);
    const userExistsOnChain = !!name && !!email;
    const userExistsInDB = await User.findOne({ address });

    if (userExistsOnChain && userExistsInDB) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error in /user/check:", error);
    res.status(500).json({ error: error.message });
  }
});

// /register (now affects blockchain)
app.post('/register', async (req, res) => {
  const { address, name, email } = req.body;
  
  // Validate input
  if (!address || !name || !email) {
    return res.status(400).json({ error: 'Address, name and email are required' });
  }
  
  try {
    // Check if user already exists in database
    const existingUserInDB = await User.findOne({ address });
    if (existingUserInDB) {
      return res.status(400).json({ error: 'User already registered in database' });
    }
    
    const contract = getContract();
    
    // Check if user already exists on blockchain
    try {
      const [existingName] = await contract.getUserInfo(address);
      if (existingName && existingName.length > 0) {
        return res.status(400).json({ error: 'User already registered on blockchain' });
      }
    } catch (error) {
      // Expected for non-existent users
    }

    // Register user on blockchain with kycApproved = false
    const tx = await contract.registerUser(address, name, email);
    await tx.wait();

    // Create user in DB with kycApproved = false
    const user = await User.create({ address, name, email, kycApproved: false });

    res.json({ status: 'Registered in DB and blockchain', user });
  } catch (error) {
    console.error("Error in /register:", error); // Log the error with full details
    
    if (error.code === 'CALL_EXCEPTION') {
      // Handle specific smart contract error
      return res.status(400).json({ error: 'Smart contract error: ' + (error.reason || error.message) });
    } else if (error.message && error.message.includes('user already registered')) {
      return res.status(400).json({ error: 'User already registered' });
    } else {
      return res.status(500).json({ error: error.message || 'Unknown server error' });
    }
  }
});

// /kyc/approve (calls approveKYC on-chain)
app.post('/kyc/approve', async (req, res) => {
  try {
    let { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    address = address.toLowerCase(); // Ensure lowercase

    const user = await User.findOne({ address });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.kycApproved === true) {
      return res.status(400).json({ error: 'User KYC is already approved' });
    }

    const contract = getContract();
    const tx = await contract.approveKYC(address);
    await tx.wait();

    const updatedUser = await User.findOneAndUpdate(
      { address },
      { $set: { kycApproved: true } },
      { new: true }
    );

    res.json({ status: 'KYC approved on-chain and DB updated', user: updatedUser });
  } catch (error) {
    console.error("Error in /kyc/approve:", error); // Log the error
    if (error.message && error.message.includes('revert')) {
      return res.status(400).json({ error: 'Blockchain transaction reverted: ' + error.message });
    }
    res.status(500).json({ error: error.message || 'Unknown server error' });
  }
});

// /kyc/revoke (calls revokeKYC on-chain)
app.post('/kyc/revoke', async (req, res) => {
  try {
    const { address } = req.body;
    const contract = getContract();
    const tx = await contract.revokeKYC(address);
    await tx.wait();
    const user = await User.findOneAndUpdate(
      { address },
      { kycApproved: false, kycRequested: false }, // Also clear pending status if desired
      { new: true }
    );
    res.json({ status: 'KYC revoked on-chain and in DB', user });
  } catch (error) {
    console.error("Error in /kyc/revoke:", error);
    res.status(500).json({ error: error.message });
  }
});

// /kyc-status/:address (reads from both, writes to DB)
app.get('/kyc-status/:address', async (req, res) => {
  try {
    const contract = getContract();
    let name = "", email = "", kycApproved = false;
    try {
      [name, email, kycApproved] = await contract.getUserInfo(req.params.address);
    } catch (e) {
      console.error("Error in contract.getUserInfo:", e); // Log the error
    }
    const user = await User.findOneAndUpdate(
      { address: req.params.address },
      { name, email, kycApproved },
      { upsert: true, new: true }
    );
    res.json({
      approved: user.kycApproved,
      blockchainStatus: kycApproved,
      name,
      email
    });
  } catch (error) {
    console.error("Error in /kyc-status:", error); // Log the error
    res.status(500).json({ error: error.message });
  }
});

// /kyc/pending (fetch from blockchain)
app.get('/kyc/pending', async (req, res) => {
  try {
    const contract = getContract();
    // Fetch addresses where kycRequested is true
    const pendingAddresses = await contract.getAllPendingUsers();
    // Fetch user details for each pending address
    const pendingUsers = await Promise.all(pendingAddresses.map(async (address) => {
      const [name, email, kycApproved] = await contract.getUserInfo(address);
      return { address, name, email, kycApproved };
    }));
    res.json({ pendingUsers });
  } catch (error) {
    console.error("Error in /kyc/pending:", error);
    res.status(500).json({ error: error.message });
  }
});

// /kyc/approved (fetch from blockchain)
app.get('/kyc/approved', async (req, res) => {
  try {
    const contract = getContract();
    const approvedAddresses = await contract.getAllApprovedUsers();
    // Fetch user details for each approved address
    const approvedUsers = await Promise.all(approvedAddresses.map(async (address) => {
      // Try to get from DB first, fallback to blockchain if not found
      let user = await User.findOne({ address });
      if (user) {
        return {
          address: user.address,
          name: user.name,
          email: user.email,
        };
      } else {
        // Fallback: get from blockchain
        const [name, email] = await contract.getUserInfo(address);
        return { address, name, email };
      }
    }));
    res.json({ approvedUsers });
  } catch (error) {
    console.error("Error in /kyc/approved:", error); // Log the error
    res.status(500).json({ error: error.message });
  }
});

// /kyc/request (registers user as pending)
app.post('/kyc/request', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const user = await User.findOne({ address });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Do NOT call contract.requestKYC() here!
    // Just update the DB to reflect the request if you want to track it off-chain
    const updatedUser = await User.findOneAndUpdate(
      { address },
      { $set: { kycRequested: true } },
      { new: true }
    );

    res.json({ status: 'KYC request marked in DB. Please call requestKYC() from your wallet.', user: updatedUser });
  } catch (error) {
    console.error("Error in /kyc/request:", error);
    res.status(500).json({ error: error.message });
  }
});

// /rates/:currency (fetch from blockchain if set, else fallback)
app.get('/rates/:currency', async (req, res) => {
  const currency = req.params.currency;
  try {
    const contract = getContract();
    let rate = await contract.getCurrencyRate(currency);
    if (rate && rate > 0) {
      res.json({ [currency]: rate.toString() });
    } else {
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=${currency}`);
      res.json(response.data.ethereum);
    }
  } catch (error) {
    console.error("Error in /rates:", error); // Log the error
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=${currency}`);
      res.json(response.data.ethereum);
    } catch (err) {
      console.error("Error in fallback /rates:", err); // Log the error
      res.status(500).json({ error: err.message });
    }
  }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));