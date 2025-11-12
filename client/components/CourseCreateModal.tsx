import { useState, useEffect } from "react";
import { X, Plus, Trash2, Upload } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";

interface CourseModule {
  id: string;
  title: string;
  lessons: number;
  duration: number;
  videoUrl: string;
}

interface CourseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (course: any) => void;
  editingCourse?: any;
}

export default function CourseCreateModal({ isOpen, onClose, onSubmit, editingCourse }: CourseCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageInputType, setCoverImageInputType] = useState<"url" | "file">("url");
  const [modules, setModules] = useState<CourseModule[]>([
    { id: "1", title: "", lessons: 0, duration: 0, videoUrl: "" },
  ]);

  // Initialize form with editing course data when modal opens
  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title || "");
      setDescription(editingCourse.description || editingCourse.fullDescription || "");
      setPrice(editingCourse.price?.toString() || "");
      setDuration(editingCourse.duration?.toString() || "");
      setLevel(editingCourse.level || "Beginner");
      setCoverImage(editingCourse.image || "");
      setModules(editingCourse.modules || [{ id: "1", title: "", lessons: 0, duration: 0, videoUrl: "" }]);
      setCoverImageInputType("url");
    } else {
      // Reset form for create mode
      setTitle("");
      setDescription("");
      setPrice("");
      setDuration("");
      setLevel("Beginner");
      setCoverImage("");
      setModules([{ id: "1", title: "", lessons: 0, duration: 0, videoUrl: "" }]);
    }
  }, [editingCourse, isOpen]);

  const addModule = () => {
    const newModule: CourseModule = {
      id: Date.now().toString(),
      title: "",
      lessons: 0,
      duration: 0,
      videoUrl: "",
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (id: string, field: keyof CourseModule, value: any) => {
    setModules(
      modules.map((module) =>
        module.id === id ? { ...module, [field]: value } : module
      )
    );
  };

  const deleteModule = (id: string) => {
    if (modules.length > 1) {
      setModules(modules.filter((module) => module.id !== id));
    }
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (moduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateModule(moduleId, "videoUrl", event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const course = {
      id: editingCourse?.id || Date.now().toString(),
      title,
      description,
      fullDescription: description,
      price: parseInt(price),
      duration: parseInt(duration),
      level,
      image: coverImage || "https://images.unsplash.com/photo-1516321318423-f06f70a504f0?w=1200&h=600&fit=crop",
      modules: modules.filter(m => m.title.trim()),
      author: editingCourse?.author || "Current Author",
      authorImage: editingCourse?.authorImage || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      authorBio: editingCourse?.authorBio || "Course instructor",
      rating: editingCourse?.rating || 4.8,
      students: editingCourse?.students || 0,
      status: editingCourse?.status || "published",
      date: editingCourse?.date || new Date().toISOString().split("T")[0],
      features: [
        `${duration} hours of video content`,
        `${modules.length} modules`,
        "Downloadable resources",
        "Interactive exercises",
        "Certificate of completion",
        "Lifetime access",
      ],
    };

    onSubmit(course);

    // Reset form
    setTitle("");
    setDescription("");
    setPrice("");
    setDuration("");
    setLevel("Beginner");
    setCoverImage("");
    setModules([{ id: "1", title: "", lessons: 0, duration: 0, videoUrl: "" }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-poppins font-bold text-2xl text-foreground">
            {editingCourse ? "Edit Course" : "Create Course"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Cover Image
            </label>
            <div className="flex gap-3 mb-3">
              <button
                type="button"
                onClick={() => setCoverImageInputType("url")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  coverImageInputType === "url"
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-foreground"
                }`}
              >
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setCoverImageInputType("file")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  coverImageInputType === "file"
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-foreground"
                }`}
              >
                Upload File
              </button>
            </div>

            {coverImageInputType === "url" ? (
              <Input
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
            ) : (
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition">
                <Upload className="mx-auto mb-2 text-muted-foreground" size={32} />
                <p className="text-sm font-semibold text-foreground">Click to upload cover image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
              </label>
            )}

            {coverImage && (
              <img src={coverImage} alt="Cover preview" className="mt-4 w-full h-40 object-cover rounded-lg" />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Course Title
            </label>
            <Input
              placeholder="Course title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Description
            </label>
            <Textarea
              placeholder="Course description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Price ($)
              </label>
              <Input
                type="number"
                placeholder="49"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Duration (hours)
              </label>
              <Input
                type="number"
                placeholder="12"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-foreground text-sm"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-4">
              Course Modules
            </label>
            <div className="space-y-6">
              {modules.map((module, idx) => (
                <div key={module.id} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Module {idx + 1}
                    </span>
                    {modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteModule(module.id)}
                        className="p-1 hover:bg-red-100 rounded transition text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <Input
                    placeholder="Module title"
                    value={module.title}
                    onChange={(e) => updateModule(module.id, "title", e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Number of lessons"
                      value={module.lessons}
                      onChange={(e) => updateModule(module.id, "lessons", parseInt(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Duration (hours)"
                      value={module.duration}
                      onChange={(e) => updateModule(module.id, "duration", parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Module Video
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`video-file-${module.id}`) as HTMLInputElement;
                            input?.click();
                          }}
                          className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2"
                        >
                          <Upload size={14} />
                          Upload Video
                        </button>
                        <span className="text-xs text-muted-foreground self-center">or</span>
                      </div>
                      <Input
                        type="text"
                        placeholder="Video URL (YouTube, Vimeo, etc.)"
                        value={module.videoUrl}
                        onChange={(e) => updateModule(module.id, "videoUrl", e.target.value)}
                      />
                      <input
                        id={`video-file-${module.id}`}
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoUpload(module.id, e)}
                        className="hidden"
                      />
                      {module.videoUrl && (
                        <div className="text-xs text-green-600 font-semibold">
                          ✓ Video added
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addModule}
              className="mt-4 w-full"
            >
              <Plus size={16} />
              Add Module
            </Button>
          </div>

          <div className="flex gap-3 sticky bottom-0 bg-white pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Course
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
