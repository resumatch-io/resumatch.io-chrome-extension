import { useState } from "react"

interface ScreenshotProps {
  onScreenshotCaptured?: (screenshot: string) => void
  initialScreenshot?: string
}

export default function Screenshot({ onScreenshotCaptured, initialScreenshot }: ScreenshotProps) {
  const [screenshot, setScreenshot] = useState<string | null>(initialScreenshot || null)
  const [isCapturing, setIsCapturing] = useState(false)

  const captureScreenshot = async () => {
    try {
      setIsCapturing(true)
      const response = await chrome.runtime.sendMessage({ action: "captureScreenshot" })
      
      if (response.status === "success") {
        setScreenshot(response.screenshot)
      }
    } catch (error) {
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="p-4 h-full text-black flex flex-col">
      <h1 className="text-lg font-bold mb-2">Capture Job Description</h1>
      <p className="mb-4">
        Capture a screenshot of the job description to extract and analyze the requirements.
      </p>

      <button
        onClick={captureScreenshot}
        disabled={isCapturing}
        className={`px-4 py-2 text-white rounded transition-colors ${
          isCapturing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#4A3AFF] hover:bg-[#3d2ecc]"
        }`}
      >
        {isCapturing ? "Capturing..." : "Capture Screenshot"}
      </button>

      {screenshot && (
        <div className="mt-4 flex-1 flex flex-col min-h-0">
          <h2 className="text-md font-semibold mb-2">Captured Screenshot:</h2>
          <div className="flex-1 overflow-auto border rounded mb-4">
            <img src={screenshot} alt="Screenshot" className="w-full h-auto" />
          </div>
          <button
            onClick={() => onScreenshotCaptured?.(screenshot)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Use This Screenshot for Tailoring
          </button>
        </div>
      )}
    </div>
  )
}