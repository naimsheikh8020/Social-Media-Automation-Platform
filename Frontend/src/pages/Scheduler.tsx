import { useState } from "react";
import { dummyPostsData, PLATFORMS } from "../assets/assets";
import type { Post } from "../types/post";
import { XIcon } from "lucide-react";

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
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-2">Content</label>
              <textarea required rows={5} placeholder="What do you want to share today?" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 outline-none resize-none" value={content} onChange={(e)=> setContent(e.target.value)}/>
                <div className={`text-right text-xs mt-1 font-medium ${content.length > 270 ? "text-red-500" : "text-slate-400" }`}>
                  {content.length}/280
                </div>
            </div>
            {/* Media Upload */}
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-2">Media(optional)</label>
              {mediaFile ? 
              (
                <div className="relative rounded-xl  overflow-hidden border border-slate-200 bg-slate-50">
                  {
                    mediaFile.type.startsWith("image/") ? <img src={URL.createObjectURL(mediaFile)} alt="preview" className="w-full h-40 object-cover"/> 
                    : <video src={URL.createObjectURL(mediaFile)} className="w-full h-40 object-cover" controls/> 
                  }
                  <button type="button" onClick={()=> setMediaFile(null)} className="absolute top-2 right-2 size-7 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full flex items-center justify-center transition-colors">
                    <XIcon className="size-3.5"/>
                  </button>
                </div>
              
              )
              
              : 
              
              (<label className="flex items-center justify-center gap-2 p-5 py-10 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all group">
                <span className="text-sm text-slate-500 group-hover:text-red-600 transition-colors">Click to upload image or video</span>
                <input type="file" accept="image/*, video/*" className="hidden" onChange={(e)=>e.target.files?.[0] && setMediaFile(e.target.files[0])}/>
              </label>)}
            </div>

            {/* Date and Time */}

            {/* Submit */}

          </form>

        </div>
      </div>

      {/* Queue Panels */}
    </div>);
};

export default Scheduler;