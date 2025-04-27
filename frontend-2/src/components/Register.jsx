import { useState } from "react";
import axios from "axios";
import { useToast } from "../components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { ethers } from "ethers";

const Register = () => {
    const [address, setAddress] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const { toast } = useToast();

    const handleSelectAccount = async () => {
        try {
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed");
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const [selectedAddress] = await provider.send("eth_requestAccounts", []);
            setAddress(selectedAddress);
            toast({
                title: "Account Selected",
                description: `Selected account: ${selectedAddress}`,
                variant: "success",
            });
        } catch (error) {
            console.error("Error selecting account:", error);
            toast({
                variant: "destructive",
                title: "Account Selection Failed",
                description: error.message || "Failed to select account. Please try again.",
            });
        }
    };

    const handleRegister = async () => {
        try {
            const response = await axios.post("http://localhost:5001/register", {
                address,
                name,
                email,
            });
            toast({
                title: "Registration Successful",
                description: "You have been registered successfully.",
                variant: "success",
            });
            // Handle post-registration logic here, if needed
        } catch (error) {
            console.error("Error registering user:", error);
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.response?.data?.error || "Failed to register. Please try again.",
            });
        }
    };

    return (
        <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
                <CardTitle>Register</CardTitle>
                <CardDescription>Create a new account</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSelectAccount} className="w-full">
                        Choose Account
                    </Button>
                    {address && (
                        <div className="mt-2 text-sm text-gray-500">
                            Selected Address: <span className="font-mono">{address}</span>
                        </div>
                    )}
                    <Button onClick={handleRegister} className="w-full mt-4" disabled={!address}>
                        Register
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default Register;