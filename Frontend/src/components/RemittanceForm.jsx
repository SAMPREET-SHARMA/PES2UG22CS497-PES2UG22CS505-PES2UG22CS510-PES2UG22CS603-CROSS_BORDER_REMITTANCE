
import { useState } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useToast } from "../components/ui/use-toast"
import { ArrowRightLeft, Loader2 } from "lucide-react"

// Remove 'account' from the props
const RemittanceForm = ({ CONTRACT_ADDRESS, ABI }) => {
  const [receiverAddress, setReceiverAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("ETH")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const sendRemittance = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)

      // Generate a unique transaction ID
      const txID = `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Convert amount to Wei
      const amountInWei = ethers.utils.parseEther(amount)

      const tx = await contract.sendRemittance(receiverAddress, txID, currency, {
        value: amountInWei,
      })

      await tx.wait()

      toast({
        title: "Remittance Sent",
        description: `Successfully sent ${amount} ${currency} to ${receiverAddress.substring(0, 6)}...${receiverAddress.substring(38)}`,
        variant: "success",
      })

      // Reset form
      setReceiverAddress("")
      setAmount("")
    } catch (error) {
      console.error("Error sending remittance:", error)
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: error.message || "Failed to send remittance. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Send Remittance
        </CardTitle>
        <CardDescription>Transfer funds to another wallet address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={sendRemittance} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receiver">Receiver Address</Label>
            <Input
              id="receiver"
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0x..."
              required
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.0001"
                min="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full flex items-center gap-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4" />
                  Send Remittance
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default RemittanceForm
