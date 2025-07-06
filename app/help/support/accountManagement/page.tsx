"use client";

import DashboardHeader from "@/components/DashboardHeader";
import SupportTabs from "@/app/components/SupportTabs";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState("Client FAQ");

  return (
    <>
      <div className=" min-h-screen p-4 sm:p-6 flex flex-col gap-4 md:gap-6">
        <SupportTabs activeTab={activeTab} setActiveTab={setActiveTab}>
          {/* FAQ Content - only shows when "Client FAQ" tab is active */}
          <div className="min-h-screen flex">
            <Tabs
              defaultValue="password-security"
              orientation="vertical"
              className="flex w-full"
            >
              <div className="flex gap-6 md:flex-row flex-col flex-1">
                <div className="md:max-w-80  w-full rounded-md border border-[#2D2D2D] bg-[#0f0711] text-white flex flex-col">
                  {/* Search Bar */}
                  <div className="px-4 pt-4">
                    <div className="relative ">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search"
                        className="bg-black rounded-md   border-[#2D333E] text-white placeholder-gray-400 pl-10 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <TabsList className="bg-transparent h-auto flex-col w-full space-y-1 p-4 justify-start">
                    <TabsTrigger
                      value="profile-settings"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white hover:text-black data-[state=active]:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Profile Settings
                    </TabsTrigger>
                    <TabsTrigger
                      value="password-security"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Password & Security
                    </TabsTrigger>
                    <TabsTrigger
                      value="account-verification"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Account Verification
                    </TabsTrigger>
                    <TabsTrigger
                      value="linked-accounts"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Linked Accounts
                    </TabsTrigger>
                    <TabsTrigger
                      value="login-issues"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white data-[state=active]:text-black hover:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Login Issues
                    </TabsTrigger>
                    <TabsTrigger
                      value="account-deactivation"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white data-[state=active]:text-black hover:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Account Deactivation
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex border w-full rounded-md border-[#2D2D2D] bg-[#0f0711] overflow-y-auto">
                  <TabsContent
                    value="profile-settings"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Profile Settings content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="password-security"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        How to Reset Your Password
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white ">
                            How to Reset Your Stellopay Password
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            If you've forgotten your password or need to change
                            it for security reasons, follow these simple steps
                            to reset it.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Resetting Your Password via the Stellopay App:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                Open the Stellopay App and tap on "Forgot
                                Password?" on the login screen.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                Enter your registered email or phone number and
                                tap "Send Reset Link."
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                Check your inbox for a password reset email and
                                click on the link provided.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                Enter a new secure password and confirm the
                                change.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">5.</span>
                              <span>
                                Go back to the app and log in with your new
                                password.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Resetting Your Password via the Stellopay Website:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                Visit www.stellopay.com/reset-password.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                Enter your registered email or phone number and
                                click "Request Reset."
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                Follow the instructions in the email to create a
                                new password.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Tips for a Secure Password:
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start text-[#E5E5E5]">
                              <Check className="h-4 w-4 bg-green-400 text-white rounded mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                Use at least 8 characters, including uppercase,
                                lowercase, numbers, and symbols.
                              </span>
                            </div>
                            <div className="flex items-start text-[#E5E5E5]">
                              <Check className="h-4 w-4 bg-green-400 text-white rounded mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                Avoid using personal details like your name or
                                birthday.
                              </span>
                            </div>
                            <div className="flex items-start text-[#E5E5E5]">
                              <Check className="h-4 w-4 bg-green-400 text-white rounded mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                Update your password regularly for better
                                security.
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Still Need Help?
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed mb-2">
                            If you don't receive the reset email or face any
                            issues, contact Stellopay Support at
                            support@stellopay.com or call +XXX XXXX XXX XXXX.
                          </p>
                          <p className="text-[#E5E5E5] text-sm">
                            Would you like more articles like this for other
                            subcategories?
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="account-verification"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Account Verification content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="linked-accounts"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Linked Accounts content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="login-issues" className="mt-0 h-full p-8">
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Login Issues content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="account-deactivation"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Account Deactivation content coming soon
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
