
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { ShieldCheck } from "lucide-react"
import { useToast } from "../components/ui/use-toast"

const KYCNotification = ({ account, CONTRACT_ADDRESS, ABI }) => {
  const [notifications, setNotifications] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    if (account) {
      setupEventListener()
    }
  }, [account])

  const setupEventListener = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

      contract.on("KYCApproved", (user) => {
        if (user.toLowerCase() === account.toLowerCase()) {
          setNotifications((prev) => [
            ...prev,
            {
              type: "success",
              message: "Your KYC has been approved!",
            },
          ])

          toast({
            title: "KYC Approved",
            description: "Your KYC has been approved! You can now use the remittance service.",
            variant: "success",
          })
        }
      })

      // Clean up event listener on unmount
      return () => {
        contract.removeAllListeners("KYCApproved")
      }
    } catch (error) {
      console.error("Error setting up event listener:", error)
    }
  }

  return (
    <div className="space-y-4 mb-6">
      {notifications.map((notif, index) => (
        <Alert key={index} variant={notif.type === "success" ? "default" : "destructive"}>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>KYC Status Update</AlertTitle>
          <AlertDescription>{notif.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

export default KYCNotification
