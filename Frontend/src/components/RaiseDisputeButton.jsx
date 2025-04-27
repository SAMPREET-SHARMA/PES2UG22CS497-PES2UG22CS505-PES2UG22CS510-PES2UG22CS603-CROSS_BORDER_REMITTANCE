import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";

const RaiseDisputeButton = ({ txID, CONTRACT_ADDRESS, ABI }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleRaiseDispute = async () => {
        setIsLoading(true);
        try {
        if (!window.ethereum) throw new Error("No wallet found");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        const tx = await contract.raiseDispute(txID);
        await tx.wait();

        toast({
            title: "Dispute Raised",
            description: `Dispute raised for transaction ${txID}`,
            variant: "success",
        });
        } catch (error) {
        toast({
            title: "Error",
            description: error.message || "Failed to raise dispute",
            variant: "destructive",
        });
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <Button onClick={handleRaiseDispute} disabled={isLoading}>
        {isLoading ? "Raising..." : "Raise Dispute"}
        </Button>
    );
};

export default RaiseDisputeButton;