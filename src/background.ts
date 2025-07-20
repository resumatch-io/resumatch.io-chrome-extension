import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/build/pdf";

const authToken = process.env.authtoken;

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

  // Custom region screenshot
  if (message.action === "captureRegionScreenshot" && message.rect) {
    console.log('[Background] Received captureRegionScreenshot request with rect:', message.rect);
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }, (image) => {
      if (!image) {
        console.error('[Background] Failed to capture screenshot');
        sendResponse({ status: "error", error: "Failed to capture screenshot" });
        return;
      }
      
      console.log('[Background] Screenshot captured successfully, sending back with rect');
      // Send the full screenshot and rect back to content script for cropping
      sendResponse({ 
        status: "success", 
        screenshot: image,
        rect: message.rect
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

  // Resume generator
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
    // imageData is a base64 data URL
    console.log("[Background] ===== OCR_IMAGE REQUEST START =====");
    console.log("[Background] OCR_IMAGE request received");
    console.log("[Background] Auth token:", authToken ? `Present (${authToken})` : "Missing");
    console.log("[Background] Full auth token value:", authToken);
    console.log("[Background] Image data type:", typeof message.imageData);
    console.log("[Background] Image data length:", message.imageData.length);
    console.log("[Background] Image data preview (first 100 chars):", message.imageData.substring(0, 100));
    console.log("[Background] Image data header:", message.imageData.split(',')[0]);
    console.log("[Background] Base64 data length:", message.imageData.split(',')[1]?.length);
    console.log("[Background] Full image data:", message.imageData);
    
    (async () => {
      try {
        console.log("[Background] ===== MAKING API REQUEST =====");
        console.log("[Background] Making OCR API request to:", "https://api.resumatch.io/v1/jd-analyzer/generate/ocr");
        
        const requestBody = {
          resumeId: "RESUMEID",
          imageData: message.imageData.split(',')[1]
        };
        console.log("[Background] Request body:", requestBody);
        console.log("[Background] Request headers:", {
          "Authorization": authToken,
          "Content-Type": "application/json"
        });
        
        const ocrRes = await fetch("https://api.resumatch.io/v1/jd-analyzer/generate/ocr", {
          method: "POST",
          headers: {
            "Authorization": authToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        
        console.log("[Background] ===== API RESPONSE =====");
        console.log("[Background] OCR API response status:", ocrRes.status);
        console.log("[Background] OCR API response status text:", ocrRes.statusText);
        console.log("[Background] OCR API response headers:", Object.fromEntries(ocrRes.headers.entries()));
        console.log("[Background] OCR API response ok:", ocrRes.ok);
        
        const responseText = await ocrRes.text();
        console.log("[Background] Raw response text:", responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("[Background] Parsed response data:", data);
          console.log("[Background] Response data type:", typeof data);
          console.log("[Background] Response data keys:", Object.keys(data));
        } catch (parseErr) {
          console.error("[Background] Failed to parse response as JSON:", parseErr);
          console.log("[Background] Response text was:", responseText);
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
        
        const finalResponse = { success: true, ...data };
        console.log("[Background] ===== SENDING RESPONSE =====");
        console.log("[Background] Final response object:", finalResponse);
        console.log("[Background] Final response keys:", Object.keys(finalResponse));
        
        sendResponse(finalResponse);
      } catch (err) {
        console.error("[Background] ===== OCR ERROR =====");
        console.error("[Background] OCR API error:", err);
        console.error("[Background] Error type:", typeof err);
        console.error("[Background] Error message:", err.message);
        console.error("[Background] Error stack:", err.stack);
        
        const errorResponse = { success: false, error: err.message || String(err) };
        console.log("[Background] Sending error response:", errorResponse);
        sendResponse(errorResponse);
      }
    })();
    return true; // async
  }
})

