import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

import axios from "axios";

const authToken = process.env.authtoken;

chrome.runtime.onInstalled.addListener(() => {
  const menuItems = [
    { id: "save-job", title: "Save Job" },
    { id: "save-contact", title: "Save Contact" },
    { id: "find-email", title: "Find E-mail" },
    { id: "find-referrals", title: "Find Referrals" },
    { id: "request-intro", title: "Request Intro" },
    { id: "capture-screenshot", title: "Capture Screenshot" },
    { id: "Tailor My Resume", title: "Tailor My Resume" }
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
      chrome.tabs.sendMessage(tab.id, { action: "startCustomScreenshot" });
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




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // PDF parsing in background
  if (message.action === "PARSE_PDF" && message.pdfData) {
    
    if (typeof message.pdfData === 'string') {
  
    
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
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items
            .filter(item => 'str' in item) // Filter out TextMarkedContent items
            .map(item => (item as { str: string }).str) // Type assertion for TextItem
            .join(" ") + "\n";
        }
        sendResponse({ success: true, text });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // async response
  }
}

  // Custom region screenshot
  if (message.action === "captureRegionScreenshot" && message.rect) {
    // Try to get the current active tab instead of relying on sender.tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ status: "error", error: "No active tab found" });
        return;
      }

      const activeTab = tabs[0];

      chrome.tabs.captureVisibleTab(activeTab.windowId, { format: "png" }, (image) => {
        if (chrome.runtime.lastError) {
          sendResponse({ status: "error", error: chrome.runtime.lastError.message });
          return;
        }

        if (!image) {
          sendResponse({ status: "error", error: "Failed to capture screenshot - no image data" });
          return;
        }

        // Send the full screenshot and rect back to content script for cropping
        sendResponse({
          status: "success",
          screenshot: image,
          rect: message.rect
        });
      });
    });
    return true;
  }

  // Full screenshot capture
  if (message.action === "captureScreenshot") {
    // Try to get the sender's tab/window
    let windowId = sender.tab ? sender.tab.windowId : undefined;
    chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (image) => {
      if (!image) {
        sendResponse({ status: "error", message: "Failed to capture screenshot" });
        return;
      }
      sendResponse({ status: "success", screenshot: image });
    });
    return true;
  }

  // Relay startCustomScreenshot from sidebar to content script in active tab
  if (message.action === "startCustomScreenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "startCustomScreenshot" },
          (response) => {
            sendResponse(response);
          }
        );
      } else {
        sendResponse({ status: "error", message: "No active tab found." });
      }
    });
    return true; // keep channel open for async response
  }

  // Generate and Save Resume (Combined)
  if (message.action === "GENERATE_AND_SAVE_RESUME") {
    // parsedText should already be a stringified JSON from the client
    const parsedText = String(message.parsedText ?? "");
    const body = {
      parsedText,
      jobDescription: message.jobDescription || "",
      name: message.name || "Resume",
      summary: message.summary || "",
      resumeTemplate: message.resumeTemplate || "Default"
    }
    console.log('[background] GENERATE_AND_SAVE_RESUME request body:', body);
    fetch("https://resumatch.io/api/external/generate-and-save-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        console.log('[background] GENERATE_AND_SAVE_RESUME response:', data);
        sendResponse({ success: true, data })
      })
      .catch(error => {
        console.error('[background] GENERATE_AND_SAVE_RESUME error:', error);
        sendResponse({ success: false, error: error.message })
      })
    return true
  }

  // Keep old methods for backward compatibility temporarily
  // Resume generator (DEPRECATED - use GENERATE_AND_SAVE_RESUME instead)
  if (message.action === "GENERATE_RESUME") {
    // Always force parsedText to be a JSON string (double-quoted)
    const parsedText = JSON.stringify(String(message.parsedText ?? ""));
    const body = {
      parsedText,
      jobDescription: message.jobDescription || ""
    }
    console.log('[background] GENERATE_RESUME request body:', body);
    fetch("https://resumatch.io/api/external/generate-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        console.log('[background] GENERATE_RESUME response:', data);
        sendResponse({ success: true, data })
      })
      .catch(error => {
        console.error('[background] GENERATE_RESUME error:', error);
        sendResponse({ success: false, error: error.message })
      })
    return true
  }

  // Save Resume (DEPRECATED - use GENERATE_AND_SAVE_RESUME instead)
  if (message.action === "SAVE_RESUME") {
    // Always force parsedText to be a JSON string (double-quoted)
    const parsedText = JSON.stringify(String(message.parsedText ?? ""));
    const body = {
      parsedText,
      text: message.text,
      jobDescription: message.jobDescription,
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

  // Fetch Collections
  if (message.action === "FETCH_COLLECTIONS") {
    const body = {
      email: message.email
    }
    fetch("https://resumatch.io/api/external/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text().then(text => {
          if (!text || text.trim() === '') {
            throw new Error("Empty response from server");
          }

          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
          }
        });
      })
      .then(data => {
        sendResponse({ success: true, data })
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message })
      })
    return true
  }

  if (message.action === "OCR_IMAGE" && message.imageData) {
    (async () => {
      try {
        // Extract raw base64 (remove the data URL prefix if it exists)
        const base64Data =
          typeof message.imageData === "string" && message.imageData.startsWith("data:")
            ? message.imageData.split(",")[1]
            : message.imageData;

        // Generate a simple resumeId if none is provided
        const resumeId = message.resumeId || Date.now().toString();

        const { data } = await axios.post(
          "https://api.resumatch.io/v1/jd-analyzer/generate/ocr",
          {
            resumeId,
            imageData: base64Data,
          },
          { headers: { "Content-Type": "application/json", Authorization: "AIzaSyDA6Vv5EtQlQPWG8XaQYWJ3UH7Zfu_ZXeQ" } }
        );

        if (data && data.status === "SUCCESS") {
          sendResponse({ success: true, text: data.text });
        } else {
          sendResponse({ success: false, error: data?.error || "OCR failed" });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        sendResponse({ success: false, error: errorMessage });
      }
    })();
    return true; // async
  }
})

