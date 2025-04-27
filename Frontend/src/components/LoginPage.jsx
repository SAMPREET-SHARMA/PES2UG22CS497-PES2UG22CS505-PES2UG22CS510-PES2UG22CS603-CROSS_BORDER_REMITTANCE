import { useToast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { ShieldCheck, WalletIcon } from "lucide-react";
import { ethers } from "ethers";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "KYCApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "KYCRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "txID",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "currency",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "Sent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "email",
        "type": "string"
      }
    ],
    "name": "UserRegistered",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allUsers",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "approveKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllApprovedUsers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllPendingUsers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_txID",
        "type": "string"
      }
    ],
    "name": "getTransaction",
    "outputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "currency",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isDisputed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "kycApproved",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isKYCApproved",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "isKYCRequested",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "kycRequested",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "txID",
        "type": "string"
      }
    ],
    "name": "raiseDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      }
    ],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "revokeKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "receiver",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "txID",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "currency",
        "type": "string"
      }
    ],
    "name": "sendRemittance",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "transactions",
    "outputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "currency",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isDisputed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userEmails",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userNames",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const LoginPage = ({ setAccount, isAdmin, setIsAdmin, setKycStatus }) => {
    const { toast } = useToast();
    const navigate = useNavigate(); // Initialize useNavigate

    const connectWallet = async () => {
        try {
            const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAccount(addr);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        
            const admin = await contract.admin();
            const isAdminAccount = addr.toLowerCase() === admin.toLowerCase();
            setIsAdmin(isAdminAccount);
        
            if (isAdminAccount) {
            setKycStatus(true);
            } else {
                const blockchainKYCStatus = await contract.isKYCApproved(addr);
                const backendResponse = await axios.get(`http://localhost:5001/kyc-status/${addr}`);
        
                setKycStatus(blockchainKYCStatus && backendResponse.data.approved);
        
                if (blockchainKYCStatus !== backendResponse.data.approved) {
                    console.warn("KYC status mismatch between blockchain and backend");
                }
            }
        
            toast({
                title: "Wallet Connected",
                description: `Connected as ${isAdminAccount ? "Admin" : "User"}`,
            });
        
            return isAdminAccount; // <-- RETURN here
        } catch (error) {
                console.error("Error connecting wallet:", error);
            toast({
                variant: "destructive",
                title: "Connection Failed",
                description: error.message || "Could not connect to wallet",
            });
            return false;
        }
    };

    const handleLogin = async (type) => {
        try {
            const isAdminAccount = await connectWallet(); // get fresh value
            console.log("type : ", type);
            console.log("isAdminAccount : ", isAdminAccount);
        
            if (type === "admin" && !isAdminAccount) {
                toast({
                variant: "destructive",
                title: "Authorization Failed",
                description: "This wallet is not authorized as admin",
                });
                return;
            }
        
            if (type === "user" || (type === "admin" && isAdminAccount)) {
                console.log(`Logged in as ${type}`);
                navigate(isAdminAccount ? '/admin-dashboard' : '/user-dashboard');
            }
        } catch (error) {
            console.error("Login failed:", error);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message || "An error occurred during login",
            });
        }
    };
    

    return (
        <Card className="mb-8">
        <CardHeader>
            <CardTitle>Select Login Type</CardTitle>
            <CardDescription>Connect your wallet to continue</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
            <Button onClick={() => handleLogin("admin")} variant="default" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Login as Admin
            </Button>
            <Button onClick={() => handleLogin("user")} variant="outline" className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4" />
            Login as User
            </Button>
            <Button onClick={() => window.location.href = "/register"} variant="outline" className="flex items-center gap-2">
            Register
            </Button>
        </CardContent>
        </Card>
    );
};

export default LoginPage;