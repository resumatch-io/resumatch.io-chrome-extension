import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/build/pdf";

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
      // Always request the selected text from the content script
      chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" }, (response) => {
        const jobDescription = response?.selectedText || "";
        chrome.tabs.sendMessage(tab.id, {
          action: "openSidebar",
          page: "tailor",
          jobDescription
        });
      });
      break
  }
})

// Set the workerSrc for pdfjs-dist
GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("pdf.worker.min.js")

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

  // PDF parsing in background
  if (message.action === "PARSE_PDF" && message.pdfData) {
    (async () => {
      try {
        // Accepts base64 or ArrayBuffer
        let data;
        if (typeof message.pdfData === "string") {
          // base64 string
          data = Uint8Array.from(atob(message.pdfData), c => c.charCodeAt(0));
        } else {
          // ArrayBuffer
          data = new Uint8Array(message.pdfData);
        }
        const pdf = await getDocument({ data }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }
        sendResponse({ success: true, text });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // async response
  }
})

