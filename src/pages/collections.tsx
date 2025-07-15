import { useState, useEffect } from "react";
import { useUser } from "@clerk/chrome-extension";
import { FiTrash2, FiEdit3, FiCalendar, FiExternalLink } from "react-icons/fi";

export default function Collections() {
  const { user } = useUser();
  const [collections, setCollections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!user?.id || !user?.emailAddresses?.[0]?.emailAddress) {
        setError("User not authenticated or email not available");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userEmail = user.emailAddresses[0].emailAddress;
        console.log("Fetching collections for email:", userEmail);

        const response = await chrome.runtime.sendMessage({
          action: "FETCH_COLLECTIONS",
          email: userEmail
        });

        console.log("Collections response:", response);

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch collections");
        }

        console.log("Setting collections data:", response.data);
        // The response structure is: { success: true, data: { success: true, data: [...], count: 9 } }
        setCollections(response.data.data);
      } catch (err) {
        console.error("Collections fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [user?.id, user?.emailAddresses]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A3AFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Collections</h1>
        <p className="text-gray-600 mt-1">Your tailored resume collection</p>
        
      </div>
      
      {collections && collections.length > 0 ? (
        <div className="space-y-4">
          {collections.map((resume) => (
            <div
              key={resume.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {resume.name || "Untitled"}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Draft
                    </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-4">No tags</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500 text-sm">
                      <FiCalendar className="w-4 h-4 mr-2" />
                      <span>Updated on {formatDate(resume.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Template: Default
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Edit"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-lg font-medium text-gray-800 mb-2">No resumes found</h3>
            <p className="text-gray-600">Start creating your first tailored resume!</p>
          </div>
        </div>
      )}
    </div>
  );
}
