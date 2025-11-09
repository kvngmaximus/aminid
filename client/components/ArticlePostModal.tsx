import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";

interface ContentBlock {
  id: string;
  type: "paragraph" | "image";
  content: string;
}

interface ArticlePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (article: any) => void;
}

export default function ArticlePostModal({ isOpen, onClose, onSubmit }: ArticlePostModalProps) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: "1", type: "paragraph", content: "" },
  ]);
  const [coverImage, setCoverImage] = useState("");

  const addContentBlock = (type: "paragraph" | "image") => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: "",
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setContentBlocks(
      contentBlocks.map((block) =>
        block.id === id ? { ...block, content } : block
      )
    );
  };

  const deleteBlock = (id: string) => {
    if (contentBlocks.length > 1) {
      setContentBlocks(contentBlocks.filter((block) => block.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const article = {
      id: Date.now().toString(),
      title,
      excerpt,
      category,
      isPremium,
      coverImage: coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop",
      contentBlocks,
      author: "Current Author",
      authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      readTime: Math.ceil((contentBlocks.filter(b => b.type === "paragraph").reduce((acc, b) => acc + b.content.length, 0)) / 1000),
      likes: 0,
      status: "published",
      publishedAt: new Date().toISOString().split("T")[0],
    };

    onSubmit(article);
    
    // Reset form
    setTitle("");
    setExcerpt("");
    setCategory("");
    setIsPremium(false);
    setCoverImage("");
    setContentBlocks([{ id: "1", type: "paragraph", content: "" }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-poppins font-bold text-2xl text-foreground">Create Article</h2>
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
              Title
            </label>
            <Input
              placeholder="Article title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Excerpt
            </label>
            <Textarea
              placeholder="Brief description of the article"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Category
              </label>
              <Input
                placeholder="e.g., Productivity"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-semibold text-foreground">Premium Article</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-4">
              Content
            </label>
            <div className="space-y-4">
              {contentBlocks.map((block, idx) => (
                <div key={block.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {block.type === "paragraph" ? "Paragraph" : "Image"}
                    </span>
                    {contentBlocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className="p-1 hover:bg-red-100 rounded transition text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  {block.type === "paragraph" ? (
                    <Textarea
                      placeholder="Write your paragraph here..."
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  ) : (
                    <Input
                      placeholder="Image URL"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                    />
                  )}
                  {block.type === "image" && block.content && (
                    <img src={block.content} alt="Content" className="w-full h-48 object-cover rounded-lg" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => addContentBlock("paragraph")}
              >
                <Plus size={16} />
                Add Paragraph
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addContentBlock("image")}
              >
                <Plus size={16} />
                Add Image
              </Button>
            </div>
          </div>

          <div className="flex gap-3 sticky bottom-0 bg-white pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Publish Article
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
