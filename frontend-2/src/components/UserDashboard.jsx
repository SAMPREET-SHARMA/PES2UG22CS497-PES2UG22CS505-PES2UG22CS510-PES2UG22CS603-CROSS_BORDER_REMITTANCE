import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import KYC from "./KYC";
import RemittanceForm from "./RemittanceForm";
import { ethers } from "ethers";

const UserDashboard = ({ account, CONTRACT_ADDRESS, ABI, isAdmin }) => {
    const [activeTab, setActiveTab] = useState("kyc");
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKYCStatus = async () => {
        setLoading(true);
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
            const status = await contract.isKYCApproved(account);
            setKycStatus(status);
        } catch (err) {
            setKycStatus(false);
        }
        setLoading(false);
        };
        if (account && !isAdmin) fetchKYCStatus();
    }, [account, CONTRACT_ADDRESS, ABI, isAdmin]);

    return (
        <div>
            <Card className="mb-8 relative">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>User Dashboard</CardTitle>
                            <CardDescription>Manage your KYC and Remittance in one place</CardDescription>
                        </div>
                        <div className="flex flex-col items-end mt-1">
                            <div className="flex items-center gap-2">
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : kycStatus ? (
                                    <ShieldCheck className="h-5 w-5 text-green-500" />
                                ) : (
                                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                                )}
                                <span className="font-semibold text-base">KYC Status</span>
                            </div>
                            <div className="mt-1 w-full">
                                {loading ? (
                                    <span className="inline-block ml-7">
                                        <Badge variant="secondary">Checking...</Badge>
                                    </span>
                                ) : kycStatus ? (
                                    <span className="inline-block ml-7">
                                        <Badge variant="default">Approved</Badge>
                                    </span>
                                ) : (
                                    <span className="inline-block">
                                        <Badge variant="destructive">Pending</Badge>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="kyc">KYC</TabsTrigger>
                            <TabsTrigger value="remittance">Remittance</TabsTrigger>
                        </TabsList>
                        <TabsContent value="kyc">
                            <KYC account={account} isAdmin={isAdmin} CONTRACT_ADDRESS={CONTRACT_ADDRESS} ABI={ABI} />
                        </TabsContent>
                        <TabsContent value="remittance">
                            {loading ? (
                                <div className="flex items-center gap-2 py-8 justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Checking KYC status...
                                </div>
                            ) : kycStatus ? (
                                <RemittanceForm CONTRACT_ADDRESS={CONTRACT_ADDRESS} ABI={ABI} />
                            ) : (
                                <Card className="border-slate-200 dark:border-slate-700">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-amber-500">
                                            <ShieldAlert className="h-5 w-5" />
                                            KYC Pending
                                        </CardTitle>
                                        <CardDescription>
                                            Your KYC is pending approval. You must complete and get your KYC approved to use the remittance service.
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserDashboard;