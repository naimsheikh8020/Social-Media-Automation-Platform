import { useState } from "react";
import { dummyPostsData, PLATFORMS } from "../assets/assets";
import { ArrowRightIcon, CalendarDaysIcon, CalendarIcon, ClockIcon, SendIcon, XIcon } from "lucide-react";
import { type Post } from '../types/post';

const Scheduler = () => {
  const [posts, setPosts] = useState<Post[]>(dummyPostsData);
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<string[]>([]);

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
      setPosts((prev) => [...prev, dummyPostsData[0]])
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
              <textarea required rows={5} placeholder="What do you want to share today?" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 outline-none resize-none" value={content} onChange={(e) => setContent(e.target.value)} />
              <div className={`text-right text-xs mt-1 font-medium ${content.length > 270 ? "text-red-500" : "text-slate-400"}`}>
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
                      mediaFile.type.startsWith("image/") ? <img src={URL.createObjectURL(mediaFile)} alt="preview" className="w-full h-40 object-cover" />
                        : <video src={URL.createObjectURL(mediaFile)} className="w-full h-40 object-cover" controls />
                    }
                    <button type="button" onClick={() => setMediaFile(null)} className="absolute top-2 right-2 size-7 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full flex items-center justify-center transition-colors">
                      <XIcon className="size-3.5" />
                    </button>
                  </div>

                )

                :

                (<label className="flex items-center justify-center gap-2 p-5 py-10 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all group">
                  <span className="text-sm text-slate-500 group-hover:text-red-600 transition-colors">Click to upload image or video</span>
                  <input type="file" accept="image/*, video/*" className="hidden" onChange={(e) => e.target.files?.[0] && setMediaFile(e.target.files[0])} />
                </label>)}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-2">Date</label>
                <div className="relative ">
                  <CalendarIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="date" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-2">Time</label>
                <div className="relative ">
                  <ClockIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                  <input type="time" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500 hover:bg-red-600 transition-all text-white rounded-lg">
              {loading ?

                <>

                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Scheduling...
                </>

                :

                <>
                  Schedule Post
                  <ArrowRightIcon className="size-4" />
                </>}
            </button>

          </form>

        </div>
      </div>

      {/* Queue Panels */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Upcomming Post */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <CalendarDaysIcon className="size-4 text-yellow-500" />

            <h3 className="text-sm font-semibold text-slate-800">
              Upcoming
            </h3>

            <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              {scheduled.length}
            </span>
          </div>

          {/* Posts */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {scheduled.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDaysIcon className="size-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  No posts scheduled yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Your upcoming posts will appear here.
                </p>
              </div>
            ) : (
              scheduled.map((post) => (
                <div
                  key={post._id}
                  className="p-5 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Top Section */}
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">

                    <div className="flex items-center gap-2">
                      {post.platforms.map((pl: string) => {
                        const meta = PLATFORMS.find((p) => p.id === pl);

                        return meta ? (
                          <div
                            key={pl}
                            title={meta.name}
                            className="size-9 rounded-lg bg-slate-100 flex items-center justify-center"
                          >
                            <meta.icon className="size-4 text-slate-600" />
                          </div>
                        ) : null;
                      })}

                      <span className="text-xs font-medium text-slate-600 ml-1">
                        {post.platforms.length} {post.platforms.length === 1 ? "Platform" : "Platforms"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {post.mediaType && (
                        <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-md capitalize">
                          {post.mediaType}
                        </span>
                      )}

                      <span className="text-xs text-slate-500">
                        {new Date(post.scheduledFor).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p
                      className={`text-sm text-slate-600 leading-relaxed break-words ${expandedPosts.includes(post._id) ? "" : "line-clamp-3"
                        }`}
                    >
                      {post.content}
                    </p>

                    {post.content.length > 180 && (
                      <button
                        onClick={() => {
                          if (expandedPosts.includes(post._id)) {
                            setExpandedPosts(
                              expandedPosts.filter((id) => id !== post._id)
                            );
                          } else {
                            setExpandedPosts([...expandedPosts, post._id]);
                          }
                        }}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 mt-2 transition-colors"
                      >
                        {expandedPosts.includes(post._id) ? "See less" : "See more"}
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        {/* Published Posts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <SendIcon className="size-4 text-slate-500" />

            <h3 className="text-sm font-semibold text-slate-800">
              Published
            </h3>

            <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              {published.length}
            </span>
          </div>

          {/* Posts */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {published.length === 0 ? (
              <div className="py-12 text-center">
                <SendIcon className="size-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  No published posts  yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Your upcoming posts will appear here.
                </p>
              </div>
            ) : (
              published.map((post) => (
                <div
                  key={post._id}
                  className="p-5 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Top Section */}
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">

                    <div className="flex items-center gap-2">
                      {post.platforms.map((pl: string) => {
                        const meta = PLATFORMS.find((p) => p.id === pl);

                        return meta ? (
                          <div
                            key={pl}
                            title={meta.name}
                            className="size-9 rounded-lg bg-slate-100 flex items-center justify-center"
                          >
                            <meta.icon className="size-4 text-slate-600" />
                          </div>
                        ) : null;
                      })}

                      <span className="text-xs font-medium text-slate-600 ml-1">
                        {post.platforms.length} {post.platforms.length === 1 ? "Platform" : "Platforms"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {post.mediaType && (
                        <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-md capitalize">
                          {post.mediaType}
                        </span>
                      )}

                      <span className="text-xs text-slate-500">
                        {new Date(post.updatedAt).toLocaleString()}
                      </span>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">Published</span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p
                      className={`text-sm text-slate-600 leading-relaxed break-words ${expandedPosts.includes(post._id) ? "" : "line-clamp-3"
                        }`}
                    >
                      {post.content}
                    </p>

                    {post.content.length > 180 && (
                      <button
                        onClick={() => {
                          if (expandedPosts.includes(post._id)) {
                            setExpandedPosts(
                              expandedPosts.filter((id) => id !== post._id)
                            );
                          } else {
                            setExpandedPosts([...expandedPosts, post._id]);
                          }
                        }}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 mt-2 transition-colors"
                      >
                        {expandedPosts.includes(post._id) ? "See less" : "See more"}
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>);
};

export default Scheduler;