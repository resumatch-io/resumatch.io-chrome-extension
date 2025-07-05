chrome.runtime.onInstalled.addListener(() => {
  const menuItems = [
    { id: "open-resumatch", title: "Open ResuMatch.io" },
    { id: "save-job", title: "Save Job" },
    { id: "save-contact", title: "Save Contact" },
    { id: "find-email", title: "Find E-mail" },
    { id: "find-referrals", title: "Find Referrals" },
    { id: "request-intro", title: "Request Intro" },
    { id: "capture-screenshot", title: "Capture Screenshot" }
  ]

  menuItems.forEach((item) => {
    chrome.contextMenus.create({
      id: item.id,
      title: item.title,
      contexts: ["all"]
    })
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return

  switch (info.menuItemId) {
    case "open-resumatch":
      chrome.tabs.sendMessage(tab.id, { action: "openSidebar" })
      break
    case "save-job":
    case "save-contact":
    case "find-email":
    case "find-referrals":
    case "request-intro":
      chrome.tabs.sendMessage(tab.id, { action: info.menuItemId })
      break
    case "capture-screenshot":
      chrome.tabs.captureVisibleTab(
        tab.windowId,
        { format: "png" },
        (image) => {
          const message = image 
            ? { action: "openSidebar", page: "screenshot", screenshot: image }
            : { action: "openSidebar", page: "screenshot", error: "Failed to capture screenshot" }
          chrome.tabs.sendMessage(tab.id, message)
        }
      )
      break
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureScreenshot") {
    chrome.tabs.captureVisibleTab(
      sender.tab?.windowId, 
      { format: "png" }, 
      (image) => {
        sendResponse(image 
          ? { status: "success", screenshot: image }
          : { status: "error", message: "Failed to capture screenshot" }
        )
      }
    )
    return true
  }
})