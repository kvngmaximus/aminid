import { useState, useEffect } from "react";
import { X, Plus, Trash2, Upload } from "lucide-react";
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
  editingArticle?: any;
}

export default function ArticlePostModal({ isOpen, onClose, onSubmit, editingArticle }: ArticlePostModalProps) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: "1", type: "paragraph", content: "" },
  ]);
  const [coverImage, setCoverImage] = useState("");
  const [coverImageInputType, setCoverImageInputType] = useState<"url" | "file">("url");

  // Initialize form with editing article data when modal opens
  useEffect(() => {
    if (editingArticle) {
      setTitle(editingArticle.title || "");
      setExcerpt(editingArticle.excerpt || "");
      setCategory(editingArticle.category || "");
      setIsPremium(editingArticle.isPremium || false);
      setCoverImage(editingArticle.coverImage || "");
      setContentBlocks(editingArticle.contentBlocks || [{ id: "1", type: "paragraph", content: "" }]);
      setCoverImageInputType("url");
    } else {
      // Reset form for create mode
      setTitle("");
      setExcerpt("");
      setCategory("");
      setIsPremium(false);
      setCoverImage("");
      setContentBlocks([{ id: "1", type: "paragraph", content: "" }]);
    }
  }, [editingArticle, isOpen]);

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

  const handleImageBlockUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateBlock(id, event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const article = {
      id: editingArticle?.id || Date.now().toString(),
      title,
      excerpt,
      category,
      isPremium,
      coverImage: coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop",
      contentBlocks,
      author: editingArticle?.author || "Current Author",
      authorImage: editingArticle?.authorImage || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      readTime: Math.ceil((contentBlocks.filter(b => b.type === "paragraph").reduce((acc, b) => acc + b.content.length, 0)) / 1000),
      likes: editingArticle?.likes || 0,
      views: editingArticle?.views || 0,
      status: editingArticle?.status || "published",
      publishedAt: editingArticle?.publishedAt || new Date().toISOString().split("T")[0],
      date: editingArticle?.date || new Date().toISOString().split("T")[0],
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
          <h2 className="font-poppins font-bold text-2xl text-foreground">
            {editingArticle ? "Edit Article" : "Create Article"}
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
                    ? "bg-gray-100 text-foreground ring-1 ring-border"
                    : "bg-gray-50 text-muted-foreground ring-1 ring-border"
                }`}
              >
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setCoverImageInputType("file")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  coverImageInputType === "file"
                    ? "bg-gray-100 text-foreground ring-1 ring-border"
                    : "bg-gray-50 text-muted-foreground ring-1 ring-border"
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
                    <div className="space-y-2">
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`image-file-${block.id}`) as HTMLInputElement;
                            input?.click();
                          }}
                          className="flex-1 px-3 py-2 bg-gray-100 text-foreground rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                        >
                          <Upload size={16} />
                          Upload Image
                        </button>
                        <span className="text-xs text-muted-foreground self-center">or</span>
                      </div>
                      <Input
                        placeholder="Image URL"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                      />
                      <input
                        id={`image-file-${block.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageBlockUpload(block.id, e)}
                        className="hidden"
                      />
                    </div>
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
              {editingArticle ? "Update Article" : "Publish Article"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
