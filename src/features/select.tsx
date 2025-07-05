'use client';

import { useState } from 'react';
import { Star, Edit2, Download, Trash2, FileText, Copy } from 'lucide-react';

const mockResumes = Array(8).fill({
  title: 'Resume 2',
  tags: ['Remote', 'Part-time', 'Contract', 'Mid Level'],
  type: 'Cover Letter',
  date: '10-Jan-2024',
});

interface SelectResumePageProps {
  onResumeSelect?: (resumeName: string) => void;
}

const SelectResumePage: React.FC<SelectResumePageProps> = ({ onResumeSelect }) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const handleResumeClick = (resumeName: string, resumeId: string) => {
    setSelectedResumeId(resumeId);
  };

  const handleSelectResume = () => {
    if (selectedResumeId && onResumeSelect) {
      const resumeName = selectedResumeId === 'my-resume' ? 'My Resume' : `Resume ${selectedResumeId}`;
      onResumeSelect(resumeName);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Select Resume to tailor</h2>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="UI UX Designer"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button className="bg-black text-white px-3 py-2 rounded-md text-xs">Search</button>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {['All', 'Favorite', 'Cover Letters', 'Resumes'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2 py-1 rounded-full text-xs  ${
                selectedFilter === filter
                  ? 'bg-[#4A3AFF] text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-gray-500 mb-3">
          164 results based on your <span className="text-blue-600 underline cursor-pointer">profile</span> and activity
        </p>

        <div className="space-y-3 pb-4">
          <div 
            className={`border-2 rounded-lg p-3 bg-white shadow-sm cursor-pointer transition-all ${
              selectedResumeId === 'my-resume' 
                ? 'border-[#4A3AFF] bg-[#4A3AFF]/5' 
                : 'border hover:border-[#4A3AFF]'
            }`}
            onClick={() => handleResumeClick('My Resume', 'my-resume')}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-gray-800">My Resume</h3>
              <div className="flex gap-1">
                <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                  <Star className="w-3 h-3 text-[#4A3AFF]" />
                </div>
                <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                  <Copy className="w-3 h-3 text-[#4A3AFF]" />
                </div>
                <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                  <Edit2 className="w-3 h-3 text-[#4A3AFF]" />
                </div>
                <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                  <Download className="w-3 h-3 text-[#4A3AFF]" />
                </div>
                <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                  <Trash2 className="w-3 h-3 text-[#4A3AFF]" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2 text-[10px]">
              {['Remote', 'Part-time', 'Contract', 'Mid Level'].map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-500">
              <span>Created on 10-Jan-2024</span>
              <span className="bg-[#4A3AFF] text-white text-[9px] px-2 py-1 rounded-full">Resume</span>
            </div>
          </div>

          {mockResumes.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 bg-white shadow-sm cursor-pointer transition-all ${
                selectedResumeId === `resume-${index}` 
                  ? 'border-[#4A3AFF] bg-[#4A3AFF]/5 border-2' 
                  : 'border-gray-200 hover:border-[#4A3AFF]'
              }`}
              onClick={() => handleResumeClick(item.title, `resume-${index}`)}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-semibold text-gray-800">{item.title}</h3>
                <div className="flex gap-1">
                  <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                    <Star className="w-3 h-3 text-[#4A3AFF]" />
                  </div>
                  <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                    <Copy className="w-3 h-3 text-[#4A3AFF]" />
                  </div>
                  <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                    <Edit2 className="w-3 h-3 text-[#4A3AFF]" />
                  </div>
                  <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                    <Download className="w-3 h-3 text-[#4A3AFF]" />
                  </div>
                  <div className="bg-gray-300 p-1 rounded-md cursor-pointer hover:bg-gray-400 transition-colors">
                    <Trash2 className="w-3 h-3 text-[#4A3AFF]" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2 text-[10px]">
                {item.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-500">
                <span>Created on {item.date}</span>
                <span className="bg-[#4A3AFF] text-white text-[9px] px-2 py-1 rounded-full">{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 space-y-3">
        <div className="flex justify-center items-center gap-1 text-xs text-gray-700">
          <button className="w-6 h-6 flex items-center justify-center rounded-full border bg-white hover:bg-gray-100">
            &lt;
          </button>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] ${
                n === 1 ? 'bg-purple-200 text-purple-800' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {n}
            </button>
          ))}
          <span className="text-[10px]">...</span>
          <button className="w-6 h-6 flex items-center justify-center rounded-full border bg-white hover:bg-gray-100 text-[10px]">
            99
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded-full border bg-white hover:bg-gray-100">
            &gt;
          </button>
        </div>
        
        <button 
          onClick={handleSelectResume}
          disabled={!selectedResumeId}
          className={`w-full py-2 rounded-lg shadow-md transition-all text-xs font-medium ${
            selectedResumeId 
              ? 'bg-[#4A3AFF] hover:bg-[#4A3AFF]/90 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedResumeId ? 'Select Resume' : 'Choose a Resume'}
        </button>
      </div>
    </div>
  );
};

export default SelectResumePage;
