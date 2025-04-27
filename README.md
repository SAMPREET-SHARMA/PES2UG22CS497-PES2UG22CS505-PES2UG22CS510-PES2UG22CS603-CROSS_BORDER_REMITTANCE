# 🌍 Cross-Border Remittance DApp

A decentralized application (DApp) enabling secure and compliant cross-border remittance with KYC verification and smart contract-based fund transfers.

---

## 📁 Project Structure


---

## 📦 Installation & Setup

### 🔧 Global Dependencies

```bash
npm install -g hardhat
npm install -g create-react-app
```

---

## 🚀 Backend Setup

```bash
cd backend
npm install
```

---
## 🎨 Frontend Setup

```bash
cd frontend
npm install
```

---

## Smart Contract Setup

```bash
cd contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat
```

---

## 🌐 Environment Configuration
MONGO_URI=mongodb://localhost:27017/remittance
PORT=5000

---

## 🚀 Running the Application

1. Start MongoDB

2. Deploy Smart Contracts

```bash
cd contracts
npx hardhat node
```

In a new terminal:

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

* Copy the deployed contract address.

* Update CONTRACT_ADDRESS in frontend/src/App.js.

4. Start the Backend
```bash
cd backend
npm start
```

5. start the frontend
```bash
cd frontend
npm run dev
```

---

## 🦊 MetaMask Configuration
* Network Settings
* Network Name: Hardhat

* RPC URL: http://127.0.0.1:8545

* Chain ID: 31337

* Currency Symbol: ETH

* Import Account
- Copy a private key from the Hardhat node terminal

* Import it into MetaMask

* First account is the Admin

---

## ⚙️ Using the DApp
1. Connect MetaMask wallet
2. For Admin
Use the first Hardhat account

- Approve or revoke KYC

- Monitor transactions

3. For Users
Submit KYC

- Wait for Admin approval

- Make transactions after approval

---

## ⚠️ Important Notes
* Keep all terminals running

* MongoDB must be running

* Use Hardhat network in MetaMask

* First Hardhat account is the admin

* KYC is required before making any transaction

* Backend runs on http://localhost:5000

* Frontend runs on http://localhost:3000
