import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";

interface CourseModule {
  id: string;
  title: string;
  lessons: number;
  duration: number;
}

interface CourseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (course: any) => void;
}

export default function CourseCreateModal({ isOpen, onClose, onSubmit }: CourseCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [coverImage, setCoverImage] = useState("");
  const [modules, setModules] = useState<CourseModule[]>([
    { id: "1", title: "", lessons: 0, duration: 0 },
  ]);

  const addModule = () => {
    const newModule: CourseModule = {
      id: Date.now().toString(),
      title: "",
      lessons: 0,
      duration: 0,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const course = {
      id: Date.now().toString(),
      title,
      description,
      fullDescription: description,
      price: parseInt(price),
      duration: parseInt(duration),
      level,
      image: coverImage || "https://images.unsplash.com/photo-1516321318423-f06f70a504f0?w=1200&h=600&fit=crop",
      modules: modules.filter(m => m.title.trim()),
      author: "Current Author",
      authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      authorBio: "Course instructor",
      rating: 4.8,
      students: 0,
      status: "published",
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
    setModules([{ id: "1", title: "", lessons: 0, duration: 0 }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-poppins font-bold text-2xl text-foreground">Create Course</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Cover Image URL
            </label>
            <Input
              placeholder="https://images.unsplash.com/..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
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
            <div className="space-y-4">
              {modules.map((module, idx) => (
                <div key={module.id} className="space-y-2 p-4 bg-gray-50 rounded-lg">
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
