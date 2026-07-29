"use client";
import { ArrowLeft, Search, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import Link from "next/link";
import SupportTabs from "@/components/common/support-tabs";

export default function TransactionIssues() {
  const [activeTab, setActiveTab] = useState("Client FAQ");

  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 flex flex-col gap-4 md:gap-6">
        <Link
          href="/help/support"
          className="inline-flex items-center gap-1.5 text-sm text-[#A0A0A0] hover:text-white transition-colors w-fit"
          aria-label="Back to Help Center"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Help Center</span>
        </Link>

        <SupportTabs activeTab={activeTab} setActiveTab={setActiveTab}>
          <div className="min-h-screen flex">
            <Tabs
              defaultValue="payment-failures"
              orientation="vertical"
              className="flex w-full"
            >
              <div className="flex gap-6 md:flex-row flex-col flex-1">
                <div className="md:max-w-80 w-full rounded-md border border-[#2D2D2D] bg-[#0f0711] text-white flex flex-col">
                  <div className="px-4 pt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search"
                        className="bg-black rounded-md border-[#2D333E] text-white placeholder-gray-400 pl-10 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <TabsList className="bg-transparent h-auto flex-col w-full space-y-1 p-4 justify-start">
                    <TabsTrigger
                      value="payment-failures"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white hover:text-black data-[state=active]:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Payment Failures
                    </TabsTrigger>
                    <TabsTrigger
                      value="tracking-transactions"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Tracking Transactions
                    </TabsTrigger>
                    <TabsTrigger
                      value="disputes-chargebacks"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Disputes & Chargebacks
                    </TabsTrigger>
                    <TabsTrigger
                      value="refund-policy"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Refund Policy
                    </TabsTrigger>
                    <TabsTrigger
                      value="transaction-fees"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white data-[state=active]:text-black hover:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Transaction Fees
                    </TabsTrigger>
                    <TabsTrigger
                      value="pending-transactions"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white data-[state=active]:text-black hover:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Pending Transactions
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex border w-full rounded-md border-[#2D2D2D] bg-[#0f0711] overflow-y-auto">
                  <TabsContent
                    value="payment-failures"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Resolving Payment Failures
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            Why Did My Payment Fail?
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Payments can fail for several reasons. Learn how to
                            identify and resolve common issues to complete your
                            transactions successfully.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Common Causes & Solutions:
                          </h3>
                          <div className="space-y-4 text-sm text-[#E5E5E5]">
                            <div className="flex items-start">
                              <AlertTriangle className="h-4 w-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Insufficient Balance:</strong> Ensure
                                your account has enough funds to cover the
                                transaction amount plus any applicable fees.
                              </span>
                            </div>
                            <div className="flex items-start">
                              <AlertTriangle className="h-4 w-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Network Congestion:</strong> During peak
                                times, the Stellar network may experience delays.
                                Wait a few minutes and try again.
                              </span>
                            </div>
                            <div className="flex items-start">
                              <AlertTriangle className="h-4 w-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Invalid Destination:</strong> Double-check
                                the recipient&apos;s wallet address for accuracy.
                              </span>
                            </div>
                            <div className="flex items-start">
                              <AlertTriangle className="h-4 w-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Daily Limit Exceeded:</strong> You may
                                have reached your daily transaction limit. Wait
                                for the limit to reset or contact support.
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Steps to Retry a Failed Payment:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                Check your account balance and daily limits.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                Verify the recipient&apos;s details are correct.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                Wait 5-10 minutes and attempt the transaction
                                again.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                If the issue persists, contact Stellopay
                                Support for assistance.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Still Need Help?
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            If you continue to experience payment failures,
                            contact Stellopay Support at support@stellopay.com
                            or call +XXX XXXX XXX XXXX.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="tracking-transactions"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Tracking Your Transactions
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            How to Track Your Stellopay Transactions
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Keep track of all your payments, transfers, and
                            account activity in real time using the Stellopay
                            platform.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Viewing Transaction History:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                Navigate to the Transactions section from your
                                dashboard.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                Use the search bar to find specific transactions
                                by amount, date, or recipient.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                Click on any transaction to view full details
                                including status, timestamp, and fees.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                Filter transactions by status: completed,
                                pending, or failed.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div className="flex items-start text-[#E5E5E5] bg-[#1A1A2E] p-4 rounded-md">
                          <Clock className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Transactions on the Stellar network typically settle
                            within 3-5 seconds. If a transaction shows as pending
                            for longer than 30 minutes, please contact support.
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Still Need Help?
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            Can&apos;t find a transaction? Contact Stellopay
                            Support at support@stellopay.com for assistance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="disputes-chargebacks"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Disputes & Chargebacks
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            How to Dispute a Transaction
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            If you notice an unauthorized or incorrect
                            transaction on your account, you can file a dispute
                            through Stellopay.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Filing a Dispute:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                Go to the transaction in your history and click
                                &quot;Report Issue.&quot;
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                Select the reason for the dispute from the
                                dropdown menu.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                Provide any supporting evidence or details.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                Submit the dispute for review by our support
                                team.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div className="flex items-start text-[#E5E5E5] bg-[#1A1A2E] p-4 rounded-md">
                          <RefreshCw className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Disputes are typically resolved within 5-10 business
                            days. You will be notified via email once a decision
                            has been made.
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Still Need Help?
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            For urgent dispute issues, contact Stellopay Support
                            at support@stellopay.com or call +XXX XXXX XXX XXXX.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="refund-policy"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Refund Policy content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="transaction-fees"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Transaction Fees content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="pending-transactions"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Pending Transactions content coming soon
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>

            <style jsx>{`
              @media (max-width: 768px) {
                .min-h-screen > div {
                  flex-direction: column;
                }
                .w-80 {
                  width: 100%;
                  height: auto;
                }
              }
            `}</style>
          </div>
        </SupportTabs>
      </div>
    </>
  );
}
