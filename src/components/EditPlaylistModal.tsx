"use client";

import { useState, useRef } from "react";
import { Playlist, createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

interface EditPlaylistModalProps {
  playlist: Playlist;
  coverUrl?: string | null;
  onClose: () => void;
  onSave: (updated: { name: string; coverUrl?: string }) => void;
}

export function EditPlaylistModal({ playlist, coverUrl, onClose, onSave }: EditPlaylistModalProps) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(coverUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/playlist-covers/${playlist.id}.${ext}`;
      await supabase.storage.from("audio").upload(path, file, { upsert: true });
      const { data: urlData } = supabase.storage.from("audio").getPublicUrl(path);
      if (urlData?.publicUrl) setPreviewUrl(urlData.publicUrl);
    } catch {
      toast("Failed to upload cover image");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    await supabase.from("playlists").update({ name: name.trim() }).eq("id", playlist.id);
    onSave({ name: name.trim(), coverUrl: previewUrl || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[90]" onClick={onClose}>
      <div className="bg-[#282828] rounded-lg w-full max-w-[524px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit details</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative w-[180px] h-[180px] flex-shrink-0 group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-full h-full bg-[#333] rounded-md flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 4v12.167a3.5 3.5 0 11-3.5-3.5H13V4h2zm-2 10.667h-1.5a1.5 1.5 0 100 3 1.5 1.5 0 001.5-1.5v-1.5z" /></svg>
              )}
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-12 h-12 text-white mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.318 2.768a2.276 2.276 0 013.182 0 2.276 2.276 0 010 3.182L9.182 17.268a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464L16.086 1.536zM16.5 4.5L5.5 15.5l-.5 2 2-.5L18 6l-1.5-1.5z" /></svg>
              <span className="text-white text-sm font-semibold">Choose photo</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {uploading && (
              <div className="absolute inset-0 bg-black/80 rounded-md flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-[#b3b3b3] mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#3e3e3e] border border-transparent rounded text-sm text-white placeholder-[#b3b3b3] outline-none focus:border-[#535353] transition-colors"
                placeholder="Add a name"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-[#b3b3b3] mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-full min-h-[100px] px-3 py-2 bg-[#3e3e3e] border border-transparent rounded text-sm text-white placeholder-[#b3b3b3] outline-none focus:border-[#535353] resize-none transition-colors"
                placeholder="Add an optional description"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => toast("Public playlists are not available yet")} className="flex items-center gap-2 px-4 py-2 text-sm text-white font-semibold border border-[#727272] rounded-full hover:border-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /></svg>
            Make public
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>

        <p className="text-[10px] text-[#b3b3b3] mt-4">
          By proceeding, you agree to give Spotify access to the image you choose to upload. Please make sure you have the right to upload the image.
        </p>
      </div>
    </div>
  );
}
