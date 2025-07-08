import { useState, useEffect } from "react";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  useUser,
  useClerk
} from "@clerk/chrome-extension";
import "../style.css";
import resumatchLogo from "data-base64:../../assets/resumatch-logo.svg";
import tailorIcon from "data-base64:../../assets/tailor-icon.svg";
import GoogleLogo from "data-base64:../../assets/google-logo.svg";
import docSignGif from "data-base64:../../assets/doc-sign.gif";
import Upload from "data-base64:../../assets/screenshot.svg";
import { FiArrowLeft, FiLogOut, FiX } from "react-icons/fi";
import TailorResumePage from "./tailor";
import SelectResumePage from "./select";
import ResumePage from "./resume";
import Screenshot from "./screenshot";

interface SidebarProps {
  forceVisible?: boolean;
  initialPage?: string;
  capturedScreenshot?: string;
  jobDescription?: string;
  onClose?: () => void;
  onFileDialogOpen?: () => void;
  onFileDialogClose?: () => void;
}

export const Sidebar = ({ forceVisible = false, initialPage, capturedScreenshot: initialCapturedScreenshot, jobDescription: initialJobDescription, onClose, onFileDialogOpen, onFileDialogClose }: SidebarProps) => {
  const [isVisible, setIsVisible] = useState(forceVisible);
  const [currentPage, setCurrentPage] = useState("main");
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [jobDescription, setJobDescription] = useState(initialJobDescription || '');
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const { user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (forceVisible) {
      setIsVisible(true);
      if (initialPage) setCurrentPage(initialPage);
      if (initialCapturedScreenshot) setCapturedScreenshot(initialCapturedScreenshot);
    }
  }, [forceVisible, initialPage, initialCapturedScreenshot]);

  useEffect(() => {
    if (initialJobDescription !== undefined) {
      setJobDescription(initialJobDescription);
      setIsVisible(true);
      if (initialPage) setCurrentPage(initialPage);
    }
  }, [initialJobDescription, initialPage]);

  const navItems = [
    {
      title: "Tailor My Resume",
      description: "Tailor my resume according to the job description or resumes.",
      icon: <img src={tailorIcon} alt="Tailor Icon" className="w-10 h-10" />,
      action: "tailorResume"
    },
    {
      title:"Upload JD screenshot",
      description: "Upload a screenshot of the job description to tailor your resume.",
      icon: <img src={Upload} alt="Upload Icon" className="w-10 h-10" />,
      action: "uploadScreenshot" 
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: window.location.href })
    } catch (error) {
      window.location.reload()
    }
  }

  const handleNavigation = (action: string) => {
    if (action === "tailorResume") {
      setCurrentPage("tailor");
    } else if (action === "selectResume") {
      setCurrentPage("select");
    } else if (action === "uploadScreenshot") {
      setCurrentPage("screenshot");
    }
  };

  const handleResumeSelection = (resumeName: string) => {
    setSelectedResume(resumeName);
    setCurrentPage("tailor");
  };

  const handleTailorStart = (link?: string) => {
    setShowLoading(true);
    setShowResume(false);
    if (link) {
      setShowLoading(false);
      setShowResume(true);
      setShareableLink(link);
    } else {
      setShareableLink(null);
    }
  };

  const handleResumeBack = () => {
    setShowResume(false);
    setShowLoading(false);
    setSelectedResume(null);
    setJobDescription('');
    setCurrentPage("main");
  };

  const handleScreenshotCaptured = (screenshot: string) => {
    setCapturedScreenshot(screenshot);
    setJobDescription("Job description extracted from screenshot");
    setCurrentPage("tailor");
  };

  const renderPageHeader = (backPage?: string) => (
    <div className="flex pt-5 pb-4 items-center px-4 border-b border-gray-200 relative">
      {backPage && (
        <button
          onClick={() => setCurrentPage(backPage)}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FiArrowLeft className="text-lg" />
        </button>
      )}

      <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
        <img src={resumatchLogo} alt="Resumatch Logo" className="w-6 h-6" />
        <span className="text-sm font-semibold text-gray-900">Resumatch.io</span>
      </div>
    </div>
  );

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Hover Trigger */}
      <div
        className="fixed top-1/2 right-0 w-8 h-32 -translate-y-1/2 z-[999998] bg-[#4A3AFF] hover:bg-blue-400 text-white text-xs font-mono font-bold cursor-pointer flex items-center justify-center transition-all duration-300 rounded-l-lg max-sm:w-6 max-sm:h-24"
        onMouseEnter={() => setIsVisible(true)}
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        {!isVisible && (
          <>
            <img
              src={resumatchLogo}
              alt="Resumatch Logo"
              className="w-6 h-6 bg-white p-1 rounded rotate-90 max-sm:w-4 max-sm:h-4"
            />
            <p className="p-1 max-sm:text-[10px]">ResuMatch</p>
          </>
        )}
      </div>

      {/* Sidebar Content */}
      {(isVisible || forceVisible) && (
        <div
          className="fixed top-5 right-5 bottom-5 w-[400px] max-w-[90vw] z-[999999] bg-white rounded-2xl shadow-2xl border border-gray-200 font-sans animate-slide-in-right flex flex-col overflow-hidden"
        >
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-[1000000] p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Close"
          >
            <FiX className="text-lg" />
          </button>
          <div className="flex flex-col w-full h-full min-h-0">
            {currentPage === "tailor" ? (
              <>
                {renderPageHeader("main")}
                <div className="flex-1 min-h-0">
                  {showLoading ? (
                    <div className="flex flex-col items-center justify-center h-full p-6">
                      <img src={docSignGif} alt="Processing..." className="w-32 h-32 mb-4" />
                      <p className="text-lg font-bold text-[#4A3AFF]">Tailoring your resume...</p>
                    </div>
                  ) : showResume ? (
                    <ResumePage onBack={handleResumeBack} shareableLink={shareableLink || undefined} />
                  ) : (
                    <TailorResumePage
                      onSelectFromCollections={() => setCurrentPage("select")}
                      selectedResume={selectedResume}
                      onTailorStart={handleTailorStart}
                      onResumeRemove={() => setSelectedResume(null)}
                      jobDescriptionText={jobDescription}
                      onJobDescriptionChange={setJobDescription}
                      onFileDialogOpen={onFileDialogOpen}
                      onFileDialogClose={onFileDialogClose}
                    />
                  )}
                </div>
              </>
            ) : currentPage === "select" ? (
              <>
                {renderPageHeader("tailor")}
                <div className="flex-1 min-h-0">
                  <SelectResumePage onResumeSelect={handleResumeSelection} />
                </div>
              </>
            ) : currentPage === "screenshot" ? (
              <>
                {renderPageHeader("main")}
                <div className="flex-1 min-h-0">
                  <Screenshot
                    onScreenshotCaptured={handleScreenshotCaptured}
                    initialScreenshot={capturedScreenshot}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#4A3AFF] flex justify-center items-center h-[150px] relative">
                  <div className="flex items-center space-x-3 text-white">
                    <div className="bg-white p-2 rounded">
                      <img
                        src={resumatchLogo}
                        alt="Resumatch Logo"
                        className="w-6 h-6"
                      />
                    </div>
                    <h1 className="text-2xl font-bold">Resumatch.io</h1>
                  </div>
                  <div className="absolute top-4 right-4">
                    <SignedOut>
                      
                    </SignedOut>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-5">
                    <div className="space-y-4">
                      <SignedOut>
                        <div className="flex flex-col items-center justify-center py-6 space-y-4 rounded-2xl bg-white shadow-sm">
                          <SignInButton mode="modal">
                            <button className="flex items-center justify-center w-full max-w-xs border border-[#e0cffe] rounded-full py-3 px-5 bg-white text-gray-800 font-semibold text-sm shadow-sm hover:shadow-md transition-all">
                              <img
                                src={GoogleLogo}
                                alt="Google logo"
                                className="w-5 h-5 mr-3"
                              />
                              Sign up using Google
                            </button>
                          </SignInButton>
                        </div>
                      </SignedOut>

                      <SignedIn>
                        {user && (
                          <div className="flex justify-center items-center p-4">
                            <div className="text-[#6366F1] text-center font-medium text-sm">
                              Hi! {user.firstName || user.username || 'User'} !!
                            </div>
                          </div>
                        )}
                      </SignedIn>

                      {navItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer hover:border-[#4A3AFF]"
                          onClick={() => handleNavigation(item.action)}
                        >
                          <div className="flex items-center justify-center">
                            {item.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-base text-[#6366F1]">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      ))}

                      <SignedIn>
                        <div className="flex justify-center">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                          >
                            <FiLogOut className="text-sm" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </SignedIn>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 p-4">
                    <div className="text-center text-xs text-gray-400">
                      © 2025 Resumatch
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
