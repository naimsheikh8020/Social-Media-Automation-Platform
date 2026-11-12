import { useState } from "react";
import { dummyPostsData, PLATFORMS } from "../assets/assets";
import type { Post } from "../types/post";

const Scheduler = () => {
  const [posts, setPosts] = useState<Post[]>(dummyPostsData);
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const scheduled = posts.filter((p) => p.status === "scheduled");
  const published = posts.filter((p) => p.status === "published");
  // const failed = posts.filter((p)=> p.status === "failed");

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { 
      setLoading(false) 
      setPosts((prev)=>[...prev, dummyPostsData[0]])
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Compose Panel */}
      <div className="w-full lg:w-115 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg text-slate-700">Compose Post</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSchedule}>
            {/* Platforms Detais */}
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-2">Platforms</label>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p.id);
                  return (
                    <button key={p.id} type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items center gap-1.5 p-3 rounded-md border transition-all duration-150 ${active ? "bg-red-50 border-red-300 text-red-500 scale-103" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                      <p.icon className="size-4.5"></p.icon>
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Content  */}

            {/* Media Upload */}

            {/* Date and Time */}

            {/* Submit */}

          </form>

        </div>
      </div>

      {/* Queue Panels */}
    </div>);
};

export default Scheduler;