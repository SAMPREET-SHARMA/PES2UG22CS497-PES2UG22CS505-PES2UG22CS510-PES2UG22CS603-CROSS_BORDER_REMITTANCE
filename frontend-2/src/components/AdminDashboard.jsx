import { useState, useEffect } from "react"
import axios from "axios"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { useToast } from "../components/ui/use-toast"
import { ShieldCheck, ShieldX, User, Mail, Wallet, CheckCircle } from "lucide-react"

const AdminDashboard = ({ CONTRACT_ADDRESS, ABI, setContractAdmin }) => {
  const [pendingRequests, setPendingRequests] = useState([]); // Initialize as an array
  const [approvedAccounts, setApprovedAccounts] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAuthorization();
    fetchPendingRequests();
    fetchApprovedAccounts();
  }, []);

  const checkAdminAuthorization = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const [currentAccount] = await provider.send("eth_requestAccounts", []);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const adminAddress = await contract.admin();
  
      console.log("Current Account:", currentAccount); // Debugging log
      console.log("Admin Address:", adminAddress); // Debugging log
  
      setIsAuthorized(currentAccount.toLowerCase() === adminAddress.toLowerCase());
    } catch (error) {
      console.error("Error checking admin authorization:", error);
      toast({
        variant: "destructive",
        title: "Authorization Error",
        description: "Failed to verify admin status",
      });
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5001/kyc/pending");
      console.log("Pending requests response:", response.data); // Debugging log
      
      if (response.data && response.data.pendingUsers && Array.isArray(response.data.pendingUsers)) {
        setPendingRequests(response.data.pendingUsers);
      } else {
        console.error("Expected an array but got:", response.data);
        setPendingRequests([]);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast({
        variant: "destructive",
        title: "Data Fetch Error",
        description: "Failed to load pending KYC requests",
      });
      setPendingRequests([]); // Safe fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApprovedAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5001/kyc/approved");
      // Use the new approvedUsers array from the backend
      setApprovedAccounts(
        Array.isArray(response.data.approvedUsers)
          ? response.data.approvedUsers
          : []
      );
    } catch (error) {
      console.error("Error fetching approved accounts:", error);
      toast({
        variant: "destructive",
        title: "Data Fetch Error",
        description: "Failed to load approved accounts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (address) => {
    try {
      console.log("Attempting to approve KYC for address:", address); // Debugging log
      if (!isAuthorized) {
        console.log("Authorization failed for current account"); // Debugging log
        toast({
          variant: "destructive",
          title: "Authorization Error",
          description: "This wallet is not authorized as admin",
        })
        return
      }
  
      setIsLoading(true)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
  
      // First update blockchain
      const tx = await contract.approveKYC(address)
      await tx.wait()
      console.log("Transaction approved on-chain for address:", address); // Debugging log
  
      // Then update backend with blockchain status - Make sure we pass the correct data format
      const response = await axios.post("http://localhost:5001/kyc/approve", {
        address: address
      })
      console.log("Backend response for /kyc/approve:", response.data); // Debugging log
  
      fetchPendingRequests()
      fetchApprovedAccounts()
  
      toast({
        title: "KYC Approved",
        description: "User KYC has been approved successfully",
        variant: "success",
      })
    } catch (error) {
      console.error("Error approving KYC:", error)
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.response?.data?.error || "Failed to approve KYC. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevoke = async (address) => {
    try {
      if (!isAuthorized) {
        toast({
          variant: "destructive",
          title: "Authorization Error",
          description: "This wallet is not authorized as admin",
        })
        return
      }

      setIsLoading(true)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)

      // First update blockchain
      const tx = await contract.revokeKYC(address)
      await tx.wait()

      // Then update backend with blockchain status
      await axios.post("http://localhost:5001/kyc/revoke", {
        address,
        blockchainStatus: false,
      })

      fetchApprovedAccounts()

      toast({
        title: "KYC Revoked",
        description: "User KYC has been revoked successfully",
      })
    } catch (error) {
      console.error("Error revoking KYC:", error)
      toast({
        variant: "destructive",
        title: "Revocation Failed",
        description: "Failed to revoke KYC. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-500" />
          Admin Dashboard
        </CardTitle>
        <CardDescription>Manage KYC requests and approved accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pending Requests
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Approved Accounts
              {approvedAccounts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {approvedAccounts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">No pending KYC requests</div>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request, index) => (
                  <Card key={request.address || index} className="overflow-hidden"> 
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">KYC Request</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-slate-500" />
                          <span className="font-mono text-sm truncate">{request.address}</span>
                        </div>
                        {request.name && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <span>{request.name}</span>
                          </div>
                        )}
                        {request.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <span>{request.email}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => handleApprove(request.address)}
                        className="w-20 flex items-center gap-2"
                      >
                        Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : approvedAccounts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No approved accounts
              </div>
            ) : (
              <div className="grid gap-4">
                {approvedAccounts.map((account, index) => (
                  <Card key={account.address || account || index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Approved Account</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid gap-2">
                      {account.name && (
                        <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>{account.name}</span>
                        </div>
                      )}
                      {account.email && (
                        <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span>{account.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-slate-500" />
                        <span className="font-mono text-sm truncate">
                          {account.address || account}
                        </span>
                      </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="destructive"
                        onClick={() => handleRevoke(account.address || account)}
                        className="w-20 flex items-center gap-2"
                      >
                        Revoke
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
