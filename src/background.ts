chrome.runtime.onInstalled.addListener(() => {
  const menuItems = [
    { id: "save-job", title: "Save Job" },
    { id: "save-contact", title: "Save Contact" },
    { id: "find-email", title: "Find E-mail" },
    { id: "find-referrals", title: "Find Referrals" },
    { id: "request-intro", title: "Request Intro" },
    { id: "capture-screenshot", title: "Capture Screenshot" },
    {id:"Tailor My Resume", title:"Tailor My Resume"}
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
    case "Tailor My Resume":
      // If text is selected, use it as job description
      const jobDescription = info.selectionText || "";
      chrome.tabs.sendMessage(tab.id, {
        action: "openSidebar",
        page: "tailor",
        jobDescription
      });
      break
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Unified resume generation and saving
  if (message.action === "GENERATE_AND_SAVE_RESUME") {
    const body = {
      parsedText: message.parsedText || "",
      jobDescription: message.jobDescription || "",
      name: "sample",
      resumeTemplate: "default"
    }
    fetch("https://resumatch.io/api/external/generate-and-save-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({ success: true, ...data })
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message })
      })
    return true
  }
})

