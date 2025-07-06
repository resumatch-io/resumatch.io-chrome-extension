chrome.runtime.onInstalled.addListener(() => {
  const menuItems = [
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
  // resume genearator
  if (message.action === "GENERATE_RESUME") {
    const body = {
      parsedText: message.parsedText || "",
      jobDescription: message.jobDescription || ""
    }
    fetch("https://resumatch.io/api/external/generate-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({ success: true, data })
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message })
      })
    return true
  }

  // Save Resume 
  if (message.action === "SAVE_RESUME") {
    const body = {
      parsedText: message.parsedText ,
      text: message.text,
      jobDescription: message.jobDescription ,
      name: "sai",
      summary: message.summary,
      resumeTemplate: "Default"
    }
    fetch("https://resumatch.io/api/external/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({ success: true, data })
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message })
      })
    return true 
  }
})

