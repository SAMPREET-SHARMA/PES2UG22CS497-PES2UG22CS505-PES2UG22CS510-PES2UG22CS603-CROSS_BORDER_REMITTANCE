import { useState, useEffect } from "react"
import { ethers } from "ethers"
import axios from "axios"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { useToast } from "../components/ui/use-toast"
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react"

const KYC = ({ account, isAdmin, CONTRACT_ADDRESS, ABI }) => {
  const [kycStatus, setKycStatus] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: account,
  })
  const { toast } = useToast()
  const [kycRequested, setKycRequested] = useState(false);

  useEffect(() => {
    const checkKYCStatus = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
        const status = await contract.isKYCApproved(account)
        setKycStatus(status)
        // Also check if KYC is requested
        const requested = await contract.isKYCRequested(account)
        setKycRequested(requested)
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check KYC status",
        })
      }
    }
    if (account && !isAdmin) checkKYCStatus()
  }, [account, CONTRACT_ADDRESS, ABI, isAdmin, toast])

  const handleApplyKYC = async () => {
    setIsSubmitting(true)
    try {
      // 1. Call requestKYC() from user's wallet
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      const tx = await contract.requestKYC()
      await tx.wait()
  
      // 2. Optionally, update backend DB
      await axios.post("http://localhost:5001/kyc/request", { address: account })
  
      toast({
        title: "KYC Request Submitted",
        description: "Your KYC request has been submitted on-chain. Please wait for admin approval.",
        variant: "success",
      })
      setKycRequested(true)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit KYC request. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't show KYC form for admin
  if (isAdmin) {
    return null
  }

  const handleRevokeKYC = async () => {
    setIsSubmitting(true)
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)

      const tx = await contract.revokeKYC(account)
      await tx.wait()

      setKycStatus(false)
      toast({
        title: "KYC Revoked",
        description: "KYC status revoked from blockchain",
      })
    } catch (error) {
      console.error("Error revoking KYC:", error)
      toast({
        variant: "destructive",
        title: "Revocation Failed",
        description: "Failed to revoke KYC",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span>Loading KYC status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {kycStatus ? (
            <>
              <ShieldCheck className="h-5 w-5 text-green-500" />
              KYC Status
            </>
          ) : (
            <>
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              KYC Verification
            </>
          )}
        </CardTitle>
        <CardDescription>
          {kycStatus ? "Your KYC has been approved" : "Complete KYC verification to use the remittance service"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {kycStatus ? (
          <div className="flex items-center justify-center py-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <ShieldCheck className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">Your KYC has been approved!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You can now use all features of the remittance service
              </p>
            </div>
          </div>
        ) : (
          // Show the fields and Apply for KYC button if not approved
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Enter your email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input id="wallet" type="text" value={account} disabled className="font-mono text-sm" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {kycStatus ? (
          <></>
        ) : (
          <Button
            onClick={handleApplyKYC}
            disabled={isSubmitting || kycRequested}
            className="flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {kycRequested ? "KYC Request Pending" : "Apply for KYC"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default KYC
