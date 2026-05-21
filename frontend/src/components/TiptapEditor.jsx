import React, { useCallback, useRef, useState } from "react";
import { EditorContent, useEditor, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Blockquote } from "@tiptap/extension-blockquote";
import { Extension } from "@tiptap/core";
import axios from "axios";

// ─── Custom FontSize extension ───────────────────────────────────────────────
const FontSize = Extension.create({
    name: "fontSize",
    addGlobalAttributes() {
        return [
            {
                types: ["textStyle"],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element) =>
                            element.style.fontSize?.replace("px", "") || null,
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}px` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize:
                (size) =>
                ({ chain }) => {
                    return chain().setMark("textStyle", { fontSize: size }).run();
                },
            unsetFontSize:
                () =>
                ({ chain }) => {
                    return chain()
                        .setMark("textStyle", { fontSize: null })
                        .removeEmptyTextStyle()
                        .run();
                },
        };
    },
});

// ─── Resizable Image Component for NodeView ──────────────────────────────────
const ResizableImage = ({ node, updateAttributes, selected }) => {
    const { src, alt, title, width } = node.attrs;
    const imgRef = useRef(null);

    const handleMouseDown = (e, corner) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = imgRef.current ? imgRef.current.clientWidth : 0;
        const containerWidth = imgRef.current ? imgRef.current.parentElement.clientWidth : 800;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            let newWidth = startWidth;

            if (corner === "top-left" || corner === "bottom-left") {
                newWidth = startWidth - deltaX;
            } else {
                newWidth = startWidth + deltaX;
            }

            // Constraints: minimum 50px, maximum container width
            newWidth = Math.max(50, Math.min(newWidth, containerWidth));

            // Update attributes
            updateAttributes({ width: `${newWidth}px` });
        };

        const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <NodeViewWrapper 
            className="tiptap-image-wrapper"
            style={{ textAlign: node.attrs.textAlign || "left" }}
        >
            <div
                className={`tiptap-image-container ${selected ? "tiptap-image-container--selected" : ""}`}
                style={{
                    display: "inline-block",
                    position: "relative",
                    maxWidth: "100%",
                }}
            >
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    title={title}
                    className="tiptap-image"
                    style={{
                        width: width || "100%",
                        display: "block",
                    }}
                />
                {selected && (
                    <>
                        <div
                            className="tiptap-resize-handle tiptap-resize-handle--tl"
                            onMouseDown={(e) => handleMouseDown(e, "top-left")}
                        />
                        <div
                            className="tiptap-resize-handle tiptap-resize-handle--tr"
                            onMouseDown={(e) => handleMouseDown(e, "top-right")}
                        />
                        <div
                            className="tiptap-resize-handle tiptap-resize-handle--bl"
                            onMouseDown={(e) => handleMouseDown(e, "bottom-left")}
                        />
                        <div
                            className="tiptap-resize-handle tiptap-resize-handle--br"
                            onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
                        />
                    </>
                )}
            </div>
        </NodeViewWrapper>
    );
};

// ─── Custom Image extension for resize ───────────────────────────────────────
const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: (element) => element.getAttribute("width") || element.style.width,
                renderHTML: (attributes) => {
                    if (!attributes.width) return {};
                    return { 
                        width: attributes.width,
                        style: `width: ${attributes.width};`
                    };
                },
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ResizableImage);
    },
});

// ─── Custom Blockquote extension for color ───────────────────────────────────
const CustomBlockquote = Blockquote.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            color: {
                default: null,
                parseHTML: (element) => element.style.borderColor,
                renderHTML: (attributes) => {
                    if (!attributes.color) return {};
                    return { style: `border-left-color: ${attributes.color}; color: ${attributes.color};` };
                },
            },
        };
    },
});

// ─── Toolbar Separator ───────────────────────────────────────────────────────
const Sep = () => <div className="tiptap-sep" />;

// ─── Tooltip Button ──────────────────────────────────────────────────────────
const ToolBtn = ({ onClick, active, title, children, disabled }) => (
    <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className={`tiptap-btn ${active ? "tiptap-btn--active" : ""} ${disabled ? "tiptap-btn--disabled" : ""}`}
        title={title}
        disabled={disabled}
    >
        {children}
    </button>
);

// ─── Main Editor ─────────────────────────────────────────────────────────────
const TiptapEditor = ({ content, setContent, onImageUpload }) => {
    const colorRef = useRef(null);
    const highlightRef = useRef(null);
    const quoteColorRef = useRef(null);
    const imageInputRef = useRef(null);

    // Color picker popup state
    const [colorPopupOpen, setColorPopupOpen] = useState(false);
    const [pendingColor, setPendingColor] = useState("#000000");
    const [highlightPopupOpen, setHighlightPopupOpen] = useState(false);
    const [pendingHighlight, setPendingHighlight] = useState("#ffd97d");

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, blockquote: false }),
            CustomBlockquote,
            TextStyle,
            Color,
            Underline,
            FontSize,
            FontFamily.configure({ types: ["textStyle"] }),
            TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
            Highlight.configure({ multicolor: true }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: "tiptap-link" } }),
            CustomImage.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: "tiptap-image" } }),
            Placeholder.configure({ placeholder: "Start writing your blog post here..." }),
        ],
        content,
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
    });

    const uploadInlineImage = useCallback(async (file) => {
        if (!file) return;
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
        try {
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                data
            );
            editor.chain().focus().setImage({ src: res.data.secure_url }).run();
            if (onImageUpload) {
                onImageUpload(res.data.secure_url);
            }
        } catch (err) {
            console.error("Image upload failed:", err);
        }
    }, [editor]);

    const setLink = useCallback(() => {
        const prev = editor.getAttributes("link").href;
        const url = window.prompt("Enter URL", prev || "https://");
        if (url === null) return;
        if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    const setAlignment = useCallback((alignment) => {
        if (editor.isActive('image')) {
            editor.chain().focus().updateAttributes('image', { textAlign: alignment }).run();
        } else {
            editor.chain().focus().setTextAlign(alignment).run();
        }
    }, [editor]);

    if (!editor) return null;

    const FONT_FAMILIES = [
        { label: "Default", value: "" },
        { label: "Inter", value: "Inter, sans-serif" },
        { label: "Georgia", value: "Georgia, serif" },
        { label: "Merriweather", value: "Merriweather, serif" },
        { label: "Playfair Display", value: "'Playfair Display', serif" },
        { label: "Roboto Mono", value: "'Roboto Mono', monospace" },
        { label: "Courier New", value: "'Courier New', monospace" },
        { label: "Arial", value: "Arial, sans-serif" },
        { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
    ];

    const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

    const currentFontSize =
        editor.getAttributes("textStyle").fontSize || "16";

    return (
        <div className="tiptap-wrapper">
            <div className="tiptap-toolbar">

                {/* ── History ── */}
                <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M3 13C5.8 8.7 10.1 6 15 6c4.4 0 8.3 2.5 10 7"/></svg>
                </ToolBtn>
                <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M21 13C18.2 8.7 13.9 6 9 6c-4.4 0-8.3 2.5-10 7"/></svg>
                </ToolBtn>

                <Sep />

                {/* ── Font Family ── */}
                <select
                    className="tiptap-select"
                    title="Font Family"
                    value={editor.getAttributes("textStyle").fontFamily || ""}
                    onChange={(e) => {
                        if (e.target.value === "") editor.chain().focus().unsetFontFamily().run();
                        else editor.chain().focus().setFontFamily(e.target.value).run();
                    }}
                >
                    {FONT_FAMILIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                </select>

                {/* ── Font Size ── */}
                <select
                    className="tiptap-select tiptap-select--size"
                    title="Font Size"
                    value={currentFontSize}
                    onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
                >
                    {FONT_SIZES.map((s) => (
                        <option key={s} value={String(s)}>{s}px</option>
                    ))}
                </select>

                <Sep />

                {/* ── Headings ── */}
                <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolBtn>
                <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolBtn>
                <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolBtn>

                <Sep />

                {/* ── Inline formatting ── */}
                <ToolBtn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <b>B</b>
                </ToolBtn>
                <ToolBtn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <i>I</i>
                </ToolBtn>
                <ToolBtn title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <u>U</u>
                </ToolBtn>
                <ToolBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                    <s>S</s>
                </ToolBtn>
                <ToolBtn title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
                    {"</>"}
                </ToolBtn>

                <Sep />

                {/* ── Text Color ── */}
                <div className="tiptap-color-picker-wrapper">
                    <div
                        className="tiptap-color-wrap"
                        title="Text Color"
                        onClick={() => {
                            setPendingColor(editor.getAttributes("textStyle").color || "#000000");
                            setColorPopupOpen(!colorPopupOpen);
                            setHighlightPopupOpen(false);
                        }}
                    >
                        <span className="tiptap-color-label">A</span>
                        <div
                            className="tiptap-color-swatch"
                            style={{ background: editor.getAttributes("textStyle").color || "#000000" }}
                        />
                    </div>
                    {colorPopupOpen && (
                        <div className="tiptap-color-popup">
                            <div className="tiptap-color-popup-preview" style={{ background: pendingColor }} />
                            <input
                                type="color"
                                className="tiptap-color-popup-input"
                                value={pendingColor}
                                onChange={(e) => setPendingColor(e.target.value)}
                            />
                            <button
                                type="button"
                                className="tiptap-color-confirm-btn"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    editor.chain().focus().setColor(pendingColor).run();
                                    setColorPopupOpen(false);
                                }}
                            >
                                ✓ Confirm
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Highlight Color ── */}
                <div className="tiptap-color-picker-wrapper">
                    <div
                        className="tiptap-color-wrap"
                        title="Highlight Color"
                        onClick={() => {
                            setPendingHighlight(editor.getAttributes("highlight").color || "#ffd97d");
                            setHighlightPopupOpen(!highlightPopupOpen);
                            setColorPopupOpen(false);
                        }}
                    >
                        <span className="tiptap-color-label" style={{ background: "linear-gradient(120deg,#ffd97d,#ffa7a7)" }}>H</span>
                        <div
                            className="tiptap-color-swatch"
                            style={{ background: editor.getAttributes("highlight").color || "#ffd97d" }}
                        />
                    </div>
                    {highlightPopupOpen && (
                        <div className="tiptap-color-popup">
                            <div className="tiptap-color-popup-preview" style={{ background: pendingHighlight }} />
                            <input
                                type="color"
                                className="tiptap-color-popup-input"
                                value={pendingHighlight}
                                onChange={(e) => setPendingHighlight(e.target.value)}
                            />
                            <button
                                type="button"
                                className="tiptap-color-confirm-btn"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    editor.chain().focus().setHighlight({ color: pendingHighlight }).run();
                                    setHighlightPopupOpen(false);
                                }}
                            >
                                ✓ Confirm
                            </button>
                        </div>
                    )}
                </div>
                <ToolBtn title="Clear Highlight" onClick={() => editor.chain().focus().unsetHighlight().run()}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </ToolBtn>

                <Sep />

                {/* ── Alignment ── */}
                <ToolBtn title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => setAlignment("left")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                </ToolBtn>
                <ToolBtn title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => setAlignment("center")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                </ToolBtn>
                <ToolBtn title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => setAlignment("right")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
                </ToolBtn>
                <ToolBtn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => setAlignment("justify")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </ToolBtn>

                <Sep />

                {/* ── Lists & Quotes ── */}
                <ToolBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
                </ToolBtn>
                <ToolBtn title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none">1.</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none">2.</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none">3.</text></svg>
                </ToolBtn>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid #333', borderRadius: '4px', paddingRight: '4px' }}>
                    <ToolBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                    </ToolBtn>
                    {editor.isActive("blockquote") && (
                        <div className="tiptap-color-wrap" title="Quote Color">
                            <div
                                className="tiptap-color-swatch"
                                style={{ background: editor.getAttributes("blockquote").color || "#3b82f6", width: "14px", height: "14px" }}
                                onClick={() => quoteColorRef.current?.click()}
                            />
                            <input
                                ref={quoteColorRef}
                                type="color"
                                className="tiptap-color-input"
                                defaultValue="#3b82f6"
                                onChange={(e) => editor.chain().focus().updateAttributes("blockquote", { color: e.target.value }).run()}
                            />
                        </div>
                    )}
                </div>

                <ToolBtn title="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </ToolBtn>
                <ToolBtn title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </ToolBtn>

                <Sep />

                {/* ── Link ── */}
               

                <Sep />

                {/* ── Image ── */}
                <ToolBtn title="Upload Image into content" onClick={() => imageInputRef.current?.click()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </ToolBtn>
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="tiptap-hidden-input"
                    onChange={(e) => uploadInlineImage(e.target.files[0])}
                />
                
                {editor.isActive("image") && (
                    <>
                        <Sep />
                        <span style={{ fontSize: '12px', color: '#888', marginRight: '4px' }}>Size:</span>
                        <ToolBtn title="25% Width" onClick={() => editor.chain().focus().updateAttributes('image', { width: '25%' }).run()}>25%</ToolBtn>
                        <ToolBtn title="50% Width" onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%' }).run()}>50%</ToolBtn>
                        <ToolBtn title="75% Width" onClick={() => editor.chain().focus().updateAttributes('image', { width: '75%' }).run()}>75%</ToolBtn>
                        <ToolBtn title="100% Width" onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%' }).run()}>100%</ToolBtn>
                    </>
                )}

                {/* ── Clear formatting ── */}
                <ToolBtn title="Clear Formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                </ToolBtn>
            </div>

            {/* ── Image alignment hint ── */}
            <div className="tiptap-image-hint">
                💡 After inserting an image, click it and use the <strong>alignment buttons</strong> above to position it left, center, or right.
            </div>

            <EditorContent editor={editor} className="tiptap-editor-content" />
        </div>
    );
};

export default TiptapEditor;