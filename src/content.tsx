import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { ClerkProvider } from "@clerk/chrome-extension"
import { Sidebar } from "~features/sidebar"
import { useState, useEffect } from "react"

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to the .env.development file"
  )
}

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16
  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize
    return `${pixelsValue}px`
  })
  const styleElement = document.createElement("style")
  styleElement.textContent = updatedCssText
  return styleElement
}

const PlasmoOverlay = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [messageData, setMessageData] = useState<any>(null)

  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      try {
        if (message.action === "getSelectedText") {
          const selectedText = window.getSelection()?.toString() || "";
          sendResponse({ selectedText });
          return true;
        }
        if (
          [
            "openSidebar",
            "saveJob",
            "saveContact",
            "findEmail",
            "findReferrals",
            "requestIntro"
          ].includes(message.action)
        ) {
          setIsVisible(true)
          setMessageData(message)
          sendResponse({ status: "success", message: `Action ${message.action} triggered` })
        }
      } catch (error) {
        sendResponse({ status: "error", message: "Error processing message" })
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={window.location.href}
      signInFallbackRedirectUrl={window.location.href}
      signUpFallbackRedirectUrl={window.location.href}>
      {!isVisible && (
        <div
          onMouseEnter={() => setIsVisible(true)}
          className="plasmo-fixed plasmo-top-0 plasmo-right-0 plasmo-h-full plasmo-w-5 plasmo-z-[9998]"
        />
      )}
      <div
        className={`plasmo-z-50 plasmo-flex plasmo-fixed plasmo-top-32 plasmo-right-8 ${
          isVisible ? "plasmo-block" : "plasmo-hidden"
        }`}>
        <Sidebar
          initialPage={messageData?.page}
          capturedScreenshot={messageData?.screenshot}
          jobDescription={messageData?.jobDescription}
          onClose={() => {
            setIsVisible(false)
            setMessageData(null)
          }}
          onFileDialogOpen={() => {}}
          onFileDialogClose={() => {}}
        />
      </div>
    </ClerkProvider>
  )
}

export default PlasmoOverlay
