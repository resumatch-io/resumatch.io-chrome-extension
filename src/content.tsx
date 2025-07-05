import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { ClerkProvider } from '@clerk/chrome-extension'
import { Sidebar } from "~features/sidebar"
import { useState, useEffect } from "react"

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to the .env.development file')
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
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)

  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      try {
        if (message.action === "openSidebar") {
          setIsVisible(true)
          setMessageData(message)
          sendResponse({ status: "success", message: "Sidebar opened" })
        } else if (["saveJob", "saveContact", "findEmail", "findReferrals", "requestIntro"].includes(message.action)) {
          setIsVisible(true)
          setMessageData(message)
          sendResponse({ status: "success", message: `Action ${message.action} triggered` })
        }
      } catch (error) {
        sendResponse({ status: "error", message: "Error opening sidebar" })
      }
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (isFileDialogOpen || !isVisible) return

      const target = event.target as Element
      if (target?.tagName === 'INPUT' && (target as HTMLInputElement).type === 'file') return

      const sidebarContainer = document.querySelector(".plasmo-z-50")
      if (sidebarContainer && !sidebarContainer.contains(target)) {
        setIsVisible(false)
        setMessageData(null)
      }
    }

    const handleClose = () => {
      setIsVisible(false)
      setMessageData(null)
    }

    chrome.runtime.onMessage.addListener(messageListener)
    document.addEventListener('click', handleDocumentClick, true)
    window.addEventListener('focus', () => setIsFileDialogOpen(false))

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
      document.removeEventListener('click', handleDocumentClick, true)
      window.removeEventListener('focus', () => setIsFileDialogOpen(false))
    }
  }, [isVisible, isFileDialogOpen])

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={window.location.href}
      signInFallbackRedirectUrl={window.location.href}
      signUpFallbackRedirectUrl={window.location.href}
    >
      <div 
        className={`plasmo-z-50 plasmo-flex plasmo-fixed plasmo-top-32 plasmo-right-8 ${
          isVisible ? 'plasmo-block' : 'plasmo-hidden'
        }`}
      >
        <Sidebar 
          forceVisible={isVisible} 
          initialPage={messageData?.page} 
          capturedScreenshot={messageData?.screenshot}
          onClose={() => {
            setIsVisible(false)
            setMessageData(null)
          }}
          onFileDialogOpen={() => setIsFileDialogOpen(true)}
          onFileDialogClose={() => setIsFileDialogOpen(false)}
        />
      </div>
    </ClerkProvider>
  )
}

export default PlasmoOverlay
